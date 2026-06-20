#!/usr/bin/env node

const endpoint = process.env.ECHO_LAUNCH_CARD_ENDPOINT ?? "https://shield.builtbyecho.xyz/api/launch-card";

const cases = [
  {
    name: "known Base token",
    address: "0x4ed4e862860bed51a9570b96d89af5e1b0efefed",
    expectOk: true
  },
  {
    name: "Blocktronics token",
    address: "0x7afE438411ee3959C7De6f7fB76bf9C769320bA3",
    expectOk: true
  },
  {
    name: "malformed address",
    address: "0x1234",
    expectOk: false,
    expectError: "invalid_address"
  },
  {
    name: "non-token zero address",
    address: "0x0000000000000000000000000000000000000000",
    expectOk: false,
    expectError: "scan_error"
  }
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function pngSize(buffer) {
  if (buffer.length < 24 || buffer.toString("ascii", 12, 16) !== "IHDR") {
    return undefined;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

async function fetchJson(address) {
  const response = await fetch(`${endpoint}?address=${encodeURIComponent(address)}&format=json`);
  const body = await response.json();
  return { response, body };
}

async function fetchPng(address) {
  const response = await fetch(`${endpoint}?address=${encodeURIComponent(address)}&format=png`);
  const body = Buffer.from(await response.arrayBuffer());
  return { response, body };
}

for (const testCase of cases) {
  const { response, body } = await fetchJson(testCase.address);

  if (testCase.expectOk) {
    assert(response.ok, `${testCase.name}: expected HTTP ok, got ${response.status}`);
    assert(body.ok === true, `${testCase.name}: expected ok=true`);
    assert(body.card?.token?.symbol, `${testCase.name}: missing token symbol`);
    assert(typeof body.card?.score === "number", `${testCase.name}: missing numeric score`);
    assert(body.card?.level, `${testCase.name}: missing risk level`);
    assert(body.card?.cardUrl?.includes("format=png"), `${testCase.name}: missing PNG card URL`);
    assert(body.card?.scanUrl, `${testCase.name}: missing full scan URL`);

    const png = await fetchPng(testCase.address);
    const size = pngSize(png.body);
    assert(png.response.status === 200, `${testCase.name}: PNG returned ${png.response.status}`);
    assert((png.response.headers.get("content-type") ?? "").includes("image/png"), `${testCase.name}: PNG content-type mismatch`);
    assert(size?.width === 1200 && size?.height === 1200, `${testCase.name}: expected 1200x1200 PNG`);

    console.log(`${testCase.name}: ${body.card.token.symbol} ${body.card.level} ${body.card.score}/100, PNG ${size.width}x${size.height}`);
    continue;
  }

  assert(response.status >= 400, `${testCase.name}: expected error HTTP status`);
  assert(body.ok === false, `${testCase.name}: expected ok=false`);
  assert(body.error === testCase.expectError, `${testCase.name}: expected ${testCase.expectError}, got ${body.error}`);
  console.log(`${testCase.name}: clean ${body.error}`);
}

console.log("echo-launch-card smoke test passed");
