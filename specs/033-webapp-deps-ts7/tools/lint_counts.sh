#!/bin/bash
# usage: lint_counts.sh <absolute outdir>   (run from repo root)
# Writes eslint.txt / stylelint.txt as "file rule count" lines, scoped like npm run check.
set -u
O=$1
cd webapp/channels || exit 1
npx eslint ./src eslint.config.mjs --quiet --format json 2>/dev/null | node -e '
let s = "";
process.stdin.on("data", (d) => { s += d; }).on("end", () => {
    const c = {};
    for (const f of JSON.parse(s)) {
        for (const m of f.messages) {
            if (m.severity === 2) {
                const k = f.filePath.replace(/.*webapp\/channels\//, "") + " " + m.ruleId;
                c[k] = (c[k] || 0) + 1;
            }
        }
    }
    for (const k of Object.keys(c).sort()) {
        console.log(k + " " + c[k]);
    }
});' > "$O/eslint.txt"
(npx stylelint "**/*.{css,scss}" --formatter json 2>&1 >/dev/null; true) | node -e '
let s = "";
process.stdin.on("data", (d) => { s += d; }).on("end", () => {
    const c = {};
    for (const f of JSON.parse(s)) {
        for (const w of f.warnings) {
            const k = f.source.replace(/.*webapp\/channels\//, "") + " " + w.rule;
            c[k] = (c[k] || 0) + 1;
        }
    }
    for (const k of Object.keys(c).sort()) {
        console.log(k + " " + c[k]);
    }
});' > "$O/stylelint.txt"
echo "eslint $(awk '{s+=$3} END {print s}' "$O/eslint.txt") stylelint $(awk '{s+=$3} END {print s}' "$O/stylelint.txt")"
