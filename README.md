# Domiton

Check whether a domain name is free, and find similar names on the same ending, on any ending in the world. In English, German and French. A Narikia app in the DotGo family.

Use it at [domiton.narikia.com](https://domiton.narikia.com), or download the [Mac and Windows apps](https://github.com/Narikia1/domiton/releases/latest).

## How it answers

Domiton asks the registry that runs each ending. It uses no paid service and no registrar, so a search is never passed to anyone who sells names. Where Hostinger sells an ending, a free name also gets a "Get it" button with an affiliate link, and the app says so beside it.

| Answer | What it means |
|---|---|
| **Free** | The registry says it has no record of the name, and the name has no live name servers. |
| **Taken** | The registry has a record, or the name has live name servers. |
| **Probably free** | The registry won't answer, but the name has no DNS at all. The app says so, and never calls this "free". |
| **Can't tell** | Nobody answered. |

It asks in this order, in [`src/core/check.ts`](src/core/check.ts):

1. **RDAP**, the registries' modern service. IANA's list says which server answers for which ending.
2. **WHOIS**, for endings without RDAP such as `.io`, `.co`, `.de` and `.cd`. IANA's list names the server for most, and [`src/data/registries.ts`](src/data/registries.ts) adds those it leaves out.
3. **Public DNS**, through Cloudflare. It proves a name is taken, and overrules a registry that says "free".

Telling someone a name is free when it isn't is the one mistake this app must not make. The `.ng` RDAP server, for example, answers every name with a 404 web page, even names that exist.

Some registries don't answer public lookups, including `.shop` and `.es`, so free names there come back as "probably free". [`docs/coverage.md`](docs/coverage.md) lists how every ending answered when last measured, and this measures it again:

```bash
npm run survey
```

`.de` limits how fast it answers, so a long search on it moves to "probably free" partway through.

## How it's built

One TypeScript core, used by all three versions:

- [`src/core`](src/core): reads the input, checks a name, suggests similar names.
- [`src/data`](src/data): every fact the app relies on, in one place. [`docs/data-ssot.md`](docs/data-ssot.md) says where each one lives.
- [`src/ui`](src/ui): the screens, the same everywhere. Built as atoms, molecules, organisms, a template and a page, with the words in [`src/ui/i18n`](src/ui/i18n).
- [`api/lookup.ts`](api/lookup.ts) and [`src/server`](src/server): the website's lookup service, for Vercel. A browser can't reach WHOIS itself, so the website needs this.
- [`src/desktop`](src/desktop): the Mac and Windows apps (Electron). They call the core directly, so they need no server and lookups come from the user's own connection.

## How it looks

Domiton has the layout and feel of the Revolut app, in Narikia's own colours and typefaces. It follows Narikia's Design SSOT rulebook: [`docs/design-binding.md`](docs/design-binding.md) has its values and the exceptions the owner approved.

Colours, type, spacing and motion come only from Narikia's design tokens. [`src/ui/tokens`](src/ui/tokens) is generated from them, so never edit it. After the tokens change, regenerate it from a computer that has the Narikia folder, and commit the result:

```bash
npm run tokens
```

[`tests/design.test.ts`](tests/design.test.ts) fails the build on a raw colour or size, an unknown token, weak contrast, text held in a component, or a component importing from a higher layer.

## Run it

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run desktop
```

## Test it

```bash
npm run typecheck
```

```bash
npm test
```

Against the real registries, for 32 endings:

```bash
npm run test:live
```

The real desktop app, end to end:

```bash
npm run test:e2e
```

## Release

The website deploys to Vercel on every push to `main`.

The Mac and Windows installers are built by [`release.yml`](.github/workflows/release.yml) on real machines of each kind, which also test the built app. Bump the version in `package.json`, push, and start it:

```bash
gh workflow run release.yml --repo Narikia1/domiton
```

**Mac:** the workflow signs the app with Narikia's Developer ID and sends the installer to Apple. It waits 15 minutes and then publishes anyway, because Apple can take days with a new account. Macs that are online pick up Apple's answer on their own. When Apple has accepted it, staple the answer to the published file so that it also works offline:

```bash
gh release download v1.0.0 --repo Narikia1/domiton --pattern Domiton-mac.dmg
```

```bash
xcrun stapler staple Domiton-mac.dmg
```

```bash
gh release upload v1.0.0 Domiton-mac.dmg --clobber --repo Narikia1/domiton
```

Stapling changes the file, so update its line in `SHA256SUMS.txt` in the same release.

The workflow needs these repository secrets: `MAC_CERTIFICATE_P12` (base64), `MAC_CERTIFICATE_PASSWORD`, `APPLE_API_KEY_P8` (base64), `APPLE_API_KEY_ID` and `APPLE_API_ISSUER`.

**Windows:** the installer isn't signed, so SmartScreen warns on first start. A Microsoft-trusted certificate has to be bought.

To build on a Mac without signing:

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist:mac
```
