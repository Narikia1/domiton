# Design binding: Domiton

Supplies Domiton's values for Narikia's Design SSOT rulebook. It adds no rules of its own, except the exceptions recorded below.

| Field | Value |
|---|---|
| **Product** | Domiton, a Narikia app in the DotGo family |
| **Design system owner** | Jay |
| **Project state** | Greenfield |
| **Rulebook version** | `design-ssot v1.0.0` |
| **Binding last updated** | 2026-11-06 |

## Surfaces

| Surface | Where |
|---|---|
| Website | `domiton.narikia.com` |
| Mac app | Installer from the release workflow |
| Windows app | Installer from the release workflow |

## Platform leaves

All three show the same pages, so they share one token artifact.

| Leaf | Stack | Token artifact |
|---|---|---|
| Web | React + Vite + TypeScript | CSS custom properties |
| Mac and Windows | Electron, showing the web pages | The same CSS custom properties |

## Brands

Narikia's brand token set. DotGo is only an app family name, so it appears as words and has no logo or tokens of its own.

## Module paths

| What | Path |
|---|---|
| Token source | `narikia/design-tokens` |
| Generated tokens (never edit) | `src/ui/tokens`, from `npm run tokens` |
| Components | `src/ui/atoms`, `molecules`, `organisms`, `templates` |
| Pages | `src/ui/pages` |

## Accessibility

| Field | Value |
|---|---|
| Standard | WCAG 2.2 Level AA |
| Jurisdiction | Germany / EU |
| Applicable law | BFSG |

Contrast was measured in the rendered app, in both themes, against the strongest point of the colour wash.

The tokens allow some pairs that only reach AA as large text or as icons. So:

- White on Narikia Blue (3.56:1) appears only as an icon.
- White on green (3.01:1) and on red (3.91:1) appears only in the 20px bold answer badge. Green is 0.01 above the large-text floor.
- Problem messages are ink beside a red dot, not red text, because the input error token is red on white at 12px (3.91:1).

## Organisms

`AppHeader`, `AppFooter`, `Verdict`, `AnswerPanel`, `SimilarNames`, `AnswersGuide`, `ProblemNotice`.

## Exceptions

Approved by the design system owner on 2026-11-06, who asked for Domiton to look like the Revolut app. It takes that app's layout and feel. It does not use Revolut's logo, name or typeface.

| Exception | Rule it departs from | Why |
|---|---|---|
| Buttons are pills (`rounding.pill`), not `rounding.control` | `button.radius` | Pills are central to that look |
| The status badge is a pill and uses `typography.heading.5`, not `rounding.chip` and `typography.label.md` | `badge.radius`, `badge.size` | It's the page's main answer, and large text is what makes its colours reach AA |
| List cards use `rounding.panel`, not `rounding.card` | `card.radius` | Rounder cards are part of that look |
