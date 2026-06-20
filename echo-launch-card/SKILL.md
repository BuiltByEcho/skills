---
name: echo-launch-card
description: Generate a shareable Echo Base Launch Card for any Base token contract. Use when a user asks Bankrbot or an agent to run an Echo launch/security/hygiene scan on a Base token address, including Bankr, Virtuals, Clanker/Farcaster, Doppler, and DEX-only launches. Returns an automated launch hygiene verdict, pool/liquidity/holder/conflict signals, quick fixes, and a branded PNG card URL for posting or forwarding. Read-only intelligence; not financial advice.
emoji: 🛡️
tags: [base, token, launch, security, hygiene, bankr, echo, card]
visibility: public
metadata:
  homepage: https://www.builtbyecho.xyz
  endpoint: https://shield.builtbyecho.xyz/api/launch-card
  network: base
  chainId: 8453
---

# Echo Base Launch Card

Echo Base Launch Card generates a shareable launch hygiene card for Base ERC-20 tokens.

It is Base-wide by design. Bankr is the first distribution path: a user can ask Bankrbot to check a token address, and the agent returns a short verdict plus a branded card image that can be posted on X or forwarded to the project.

The broader goal is to build comparable launch intelligence across Base launch surfaces: Bankr, Virtuals, Clanker/Farcaster, Doppler, and DEX-only launches. Do not claim one launch source is safer than another until Echo has stored enough comparable scan data to support it.

This skill is read-only. It does not trade, swap, sign, transfer, or make buy/sell recommendations.

## When to Use

Use this skill when the user asks for:

- "run Echo Launch Card on this token"
- "run Echo security scan on this contract"
- "check this Bankr launch"
- "check this Virtuals token"
- "check this Clanker / Farcaster launch"
- "scan this Base launch"
- "make a shareable launch scan graphic"
- "scan this Base token before I post it"
- "find launch hygiene issues for this contract"

Only use it for Base ERC-20 contract addresses.

## Endpoint

Default production endpoint:

```text
GET https://shield.builtbyecho.xyz/api/launch-card?address={contract_address}
```

Optional render formats:

```text
GET https://shield.builtbyecho.xyz/api/launch-card?address={contract_address}&format=png
GET https://shield.builtbyecho.xyz/api/launch-card?address={contract_address}&format=svg
```

The JSON response includes:

- `card.level` - LOW / MEDIUM / HIGH / EXTREME / UNKNOWN
- `card.score` - Echo Shield 0-100 score
- `card.metrics.pools` - Base DEX pools found
- `card.conflicts.symbolCount` - same-symbol Base token conflicts surfaced from DEX data
- `card.conflicts.nameCount` - same-name Base token conflicts surfaced from DEX data
- `card.metrics.liquidityUsd`
- `card.metrics.fdvUsd`
- `card.metrics.holderCount`
- `card.metrics.adjustedTop10Percentage`
- `card.metrics.ownerStatus`
- `card.metrics.launchVenue` - detected launch source when available
- `card.metrics.launchSurface` - normalized launch surface cohort
- `card.token.imageUrl` - detected project logo when available
- `card.fixList` - recommended public fixes
- `card.cardUrl` - PNG image URL
- `card.scanUrl` - full raw scan JSON URL
- `card.shareText` - draft X-safe post text

Keep Bankrbot's default reply compact. The card is the front door; deeper scan evidence belongs behind `card.scanUrl` and, when available, the hosted report page.

Stored cohort summaries are available when Echo scan memory is configured:

```text
GET https://shield.builtbyecho.xyz/api/launch-cohorts
```

## Agent Workflow

1. Validate that the user provided a 42-character `0x` EVM address.
2. Use an HTTP-capable tool or shell command to call the JSON endpoint. This is mandatory; do not answer from model memory or from Bankr's normal token research tools.

```bash
curl -sS "https://shield.builtbyecho.xyz/api/launch-card?address=0xTOKEN" | jq .
```

3. Confirm the returned JSON has `ok: true` and a `card` object. If you cannot fetch the endpoint or cannot inspect returned JSON, say: `Echo scan endpoint could not be reached.` Stop there.
4. If `ok` is not `true`, explain the error briefly and ask for a valid Base token contract.
5. Return a short response with:
   - Token symbol/name
   - Risk level and score
   - Launch source when detected
   - Pools found
   - Best 2-3 value signals: liquidity, same-symbol/name conflicts, holder concentration, or owner/admin status
   - Top 1-2 fixes
   - PNG card URL
   - Full scan/report link
   - NFA disclaimer

6. If the user asks for a post draft, use `card.shareText` as the base and include `card.cardUrl`.

## Suggested Bankrbot Response

```text
Echo Launch Card for $SYMBOL on Base

Risk: MEDIUM (72/100)
Launch source: Base DEX / unknown
Pools found: 3
Same-symbol conflicts: 2
Liquidity: $24.1K
Top 10 holders: 18.4%

Fix now:
- Pin the canonical contract address and pool link in every public profile.
- Complete DEX profile metadata so traders see the official project context.

Card: https://shield.builtbyecho.xyz/api/launch-card?address=0xTOKEN&format=png
Full scan: https://shield.builtbyecho.xyz/api/scan?address=0xTOKEN

NFA. Automated launch hygiene scan.
```

## Boundaries

- Do not call the result a formal audit.
- Do not fabricate a score, verdict, card URL, scan URL, launch source, or fix list. If the Echo endpoint cannot be reached, fail closed.
- Do not substitute a BaseScan, DexScreener, DEXTools, Bankr token research, or model-known token result for Echo data.
- Do not leave `card.cardUrl` or `card.scanUrl` blank. If either is missing, say the Echo payload was incomplete.
- Do not say "safe to buy" or "do not buy."
- Use the exact `card.level` wording from the Echo payload. Do not convert `LOW` into "Safe."
- Do not say "Bankr launches are safer" unless Echo has a stored comparison dataset and the response includes the supporting numbers.
- Do not accuse a project of fraud from automated signals alone.
- Phrase issues as launch hygiene findings: "same-symbol conflicts surfaced", "liquidity is thin", "owner/admin is still present", "holder concentration needs context."
- Do not run transactions or request wallet permissions for this skill.
- If a project asks how to improve the card, give concrete fixes from `card.fixList`.

## Verification

Run the sandbox smoke harness before submitting a Bankrbot skill PR or changing the endpoint:

```bash
node echo-launch-card/scripts/smoke-test.mjs
```

Manual smoke test with any known Base token address:

```bash
curl -I "https://shield.builtbyecho.xyz/api/launch-card?address=0x4ed4e862860bed51a9570b96d89af5e1b0efefed&format=png"
curl -sS "https://shield.builtbyecho.xyz/api/launch-card?address=0x4ed4e862860bed51a9570b96d89af5e1b0efefed" | jq '.ok, .card.level, .card.score, .card.cardUrl'
```

The sandbox gate should confirm:

- A known Base token returns `ok: true`, `card.level`, `card.score`, `card.cardUrl`, and `card.scanUrl`.
- PNG rendering returns `200 image/png` with a 1200x1200 image.
- Malformed addresses fail cleanly with `invalid_address`.
- Non-token addresses fail cleanly with `scan_error`.
