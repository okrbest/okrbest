# Translation glossary

Key terminology for AI-assisted translation: core product terminology shared by webapp and server (mobile and desktop reuse it implicitly).

- `en.json` — term inventory: `term -> {definition, partOfSpeech, doNotTranslate, aliases?, commonWord?}`.
- `<locale>.json` — one file per officially supported locale: `term -> {target, note?}`. Key set and order match `en.json` exactly. `target` is the term to propagate and holds nothing but the translated term itself. `note` carries inflection/usage guidance and records known inconsistencies or mistranslations in existing locale files that future passes must not propagate.

Targets were derived from the majority rendering in existing locale files and the community translation rules for German, French, and Dutch. Where the majority rendering is wrong, `target` carries the correct term and `note` records what the catalogs ship today — the glossary is a correction, not a mirror. `doNotTranslate` terms keep their English form in every context, including fully translated sentences, and their `target` is the term itself.

`commonWord` marks a `doNotTranslate` name that is also an ordinary English word, such as `Channels` or `Calls`. The English reads the same whether a string names the product or just starts a sentence with the word, so the translation rules do not flag a translation that leaves such a name out. The translator decides from the description.

This file set is the authority for these terms. Notes state guidance directly rather than deferring to an external source, so a translation prompt needs nothing beyond the glossary itself.

The translation rules in [`i18n/scripts/`](../scripts/) use it: a translation that leaves out a `doNotTranslate` name lands only with a stated reason. `node i18n/scripts/check_glossary.mjs` checks these files in CI.

**okrbest:** `ko.json`의 `Mattermost`·`Mattermost Cloud` 항목은 포크 리브랜드 기준으로 바꿨다 — 우리 UI의 제품명은 OKR.BEST다(`spec-docs/rebrand.md`). 다른 언어 파일은 upstream 그대로다.
