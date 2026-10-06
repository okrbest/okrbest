# Google Fonts Open Sans
The OpenSans fonts used in this project are sourced from Google Fonts. The specific file formats are generated using the [google-webfonts-helper](https://google-webfonts-helper.herokuapp.com/fonts/open-sans?subsets=cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext,vietnamese), with the following settings.

## Charsets
* Cyrillic
* Cyrillic-ext
* Greek
* Greek-ext
* Latin
* Latin-ext
* Vietnamese

## Styles
* 300 (Light Bold)
* 300italic (Light Bold, Italic)
* regular (Regular)
* italic (Italic)
* 600italic (Semibold)
* 600 (Semibold, Italic)

## Support
Selected `Modern Browsers` to include only `.woff` and `.woff2` assets.

## OKR.Best additions (spec 014, Slack design benchmark)

### Open Sans 800 (ExtraBold)
* `open-sans-v44-*-800.woff2` / `.woff` — same charsets as above, generated with
  [google-webfonts-helper](https://gwfh.mranftl.com/fonts/open-sans). Registered at
  `font-weight: 900` in `_typography.scss` (Open Sans has no 900; 800 fills the
  900 slot so headings and author names render without synthetic bold).
* License: SIL Open Font License 1.1 (same as the existing Open Sans files).

### Noto Sans KR (regular, 600, 900)
* `noto-sans-kr-v40-korean_latin-{regular,600,900}.woff2` — charsets Korean + Latin,
  generated with [google-webfonts-helper](https://gwfh.mranftl.com/fonts/noto-sans-kr).
* Purpose: pin Korean glyph rendering instead of relying on OS fallback fonts.
* License: SIL Open Font License 1.1. Copyright Google LLC / Adobe (Source Han Sans
  derivative). License text: https://openfontlicense.org

### Metropolis Black (900)
* `Metropolis-Black.woff2` / `.woff` — from the
  [@fontsource/metropolis](https://www.npmjs.com/package/@fontsource/metropolis)
  distribution (files copied directly; no npm dependency added).
* Purpose: 900-weight headings (the bundled Metropolis set stops at SemiBold 600).
* License: Unlicense (public domain), by Chris Simpson.
