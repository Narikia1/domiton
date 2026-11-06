# Data SSOT: Domiton

Every fact the app relies on lives in one place, and everything else reads it. This does for data what [`design-binding.md`](design-binding.md) does for design, and follows the same rule from Narikia's rulebook: nothing is hardcoded that can be centrally defined, including content, routes, configuration and repeated values.

## Where each fact lives

| Fact | Where | How it changes |
|---|---|---|
| Name, endorsement, family, company | [`src/data/brand.ts`](../src/data/brand.ts) | By hand |
| Languages, and which language a country uses | [`src/data/locales.ts`](../src/data/locales.ts) | By hand |
| Every word on screen | [`src/ui/i18n`](../src/ui/i18n): `en.ts` is the source, `de.ts` and `fr.ts` follow it | By hand |
| Words joined to names in suggestions, per language | [`src/data/name-words.ts`](../src/data/name-words.ts) | By hand |
| Limits and timings | [`src/data/limits.ts`](../src/data/limits.ts) | By hand |
| Lookup sources, and registry servers IANA leaves out | [`src/data/registries.ts`](../src/data/registries.ts) | By hand, after testing |
| Endings Hostinger sells | [`src/data/hostinger-endings.ts`](../src/data/hostinger-endings.ts) | Generated: `npm run data` |
| The referral code, and Hostinger's site per language | [`src/data/hostinger.ts`](../src/data/hostinger.ts) | By hand |
| Colours, type, spacing, motion | [`src/ui/tokens`](../src/ui/tokens) | Generated: `npm run tokens` |

Facts flow one way: `src/data` is read by the core, the screens, the server and the desktop apps, and imports nothing from them.

## Languages

The app speaks English, German and French. It addresses people formally (`Sie`, `vous`), like every Narikia app.

It chooses in this order: what the person picked in the app, their device's languages in order, the language of their country, then English.

To add a language:

1. Add it to `LOCALES` and `LOCALE_NAMES` in `locales.ts`.
2. Add its catalogue in `src/ui/i18n`.
3. Add its words to `name-words.ts`, and to `electronLanguages` in `electron-builder.yml`.

The type checker and the tests fail until all of these are done.

## Hostinger

"Get it" appears only when all of these are true:

- The name is free or probably free.
- Hostinger's own catalogue lists its ending as a new registration. Transfer-only endings don't count.

The button opens Hostinger's site in the person's language, with Jay's referral code. Domiton is a Narikia product, and only this link is personal, so the notice doesn't say Narikia earns from it. The app says it's an affiliate link wherever the button appears, and the link is marked `rel="sponsored"`.

To refresh the list from Hostinger, set the token in the environment and commit the result:

```bash
HOSTINGER_API_TOKEN=... npm run data
```

## Registries

IANA's two lists come first, so most endings need no entry here. `registries.ts` only adds servers those lists leave out, such as `whois.nic.cd`. A server goes in only after it has told a registered name from an unregistered one.

[`coverage.md`](coverage.md) records how each ending answered when last measured.

## What enforces this

[`tests/data.test.ts`](../tests/data.test.ts), [`tests/i18n.test.ts`](../tests/i18n.test.ts) and [`tests/design.test.ts`](../tests/design.test.ts) fail the build if:

- `src/data` imports from any other part of the app.
- A component holds its own text.
- A language is missing a key, or its placeholders differ.
- French or German punctuation is wrong.
- The app's name differs from its installers'.
- An ending in Hostinger's list is malformed, or a link appears for an ending it doesn't sell.
