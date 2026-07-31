// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable no-console */

/**
 * Reports ko.json drift against en.json for both the webapp and the server
 * catalogs. Four classes of issue are detected:
 *
 *  blocking (fail `--check`, because CI cannot ship them):
 *   - empty-string translations (Weblate sets the value to '' instead of
 *     removing the key when a translator clears a string)
 *   - orphaned keys (present in ko.json but no longer present in en.json)
 *
 *  informational (never fail `--check`, they are follow-up translation work):
 *   - missing keys (present in en.json but never translated into ko.json)
 *   - changed keys (English source changed since `--since <ref>`, so the
 *     existing Korean translation may be stale)
 *
 * This replaces the mmjstool `clean-empty`/`check-empty-src` checks that
 * were dropped upstream when migrating to @formatjs/cli. The informational
 * half exists so an upstream sync session can batch its i18n follow-up
 * instead of interrupting every commit (constitution 원칙 V, sync 예외).
 */

const {execFileSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..', '..');

const CATALOGS = {
    webapp: {
        label: 'webapp ko.json',
        en: 'webapp/channels/src/i18n/en.json',
        ko: 'webapp/channels/src/i18n/ko.json',
    },
    server: {
        label: 'server ko.json',
        en: 'server/i18n/en.json',
        ko: 'server/i18n/ko.json',
    },
};

const MAX_PRINTED_KEYS = 20;

/**
 * The webapp catalogs are {id: message} objects, the server catalogs are
 * [{id, translation}] arrays. Both collapse to a plain key/value map.
 */
function normalizeCatalog(raw) {
    if (!Array.isArray(raw)) {
        return raw;
    }

    return raw.reduce((acc, entry) => {
        acc[entry.id] = entry.translation;
        return acc;
    }, {});
}

function findEmptyAndOrphanedTranslations(enCatalog, koCatalog) {
    const emptyKeys = Object.keys(koCatalog).filter((key) => koCatalog[key] === '');
    const orphanedKeys = Object.keys(koCatalog).filter((key) => !(key in enCatalog));

    return {emptyKeys, orphanedKeys};
}

function analyzeCatalogs({en, ko, baseEn}) {
    const enCatalog = normalizeCatalog(en);
    const koCatalog = normalizeCatalog(ko);

    const {emptyKeys, orphanedKeys} = findEmptyAndOrphanedTranslations(enCatalog, koCatalog);
    const missingKeys = Object.keys(enCatalog).filter((key) => !(key in koCatalog));

    // A key only counts as stale when it is already translated and its English
    // source moved. Keys added since the base are missing, not stale.
    let changedKeys = [];
    if (baseEn) {
        const baseCatalog = normalizeCatalog(baseEn);
        changedKeys = Object.keys(enCatalog).filter((key) =>
            key in baseCatalog && key in koCatalog && baseCatalog[key] !== enCatalog[key]);
    }

    return {emptyKeys, orphanedKeys, missingKeys, changedKeys};
}

function hasBlockingIssues(report) {
    return report.emptyKeys.length > 0 || report.orphanedKeys.length > 0;
}

function parseArgs(argv) {
    const options = {checkMode: false, json: false, since: null, catalogs: ['webapp']};

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === '--check') {
            options.checkMode = true;
        } else if (arg === '--json') {
            options.json = true;
        } else if (arg.startsWith('--since=')) {
            options.since = arg.slice('--since='.length);
        } else if (arg === '--since') {
            options.since = argv[++i];
        } else if (arg.startsWith('--catalog=')) {
            options.catalogs = expandCatalogName(arg.slice('--catalog='.length));
        } else if (arg === '--catalog') {
            options.catalogs = expandCatalogName(argv[++i]);
        }
    }

    return options;
}

function expandCatalogName(name) {
    if (name === 'all') {
        return Object.keys(CATALOGS);
    }
    if (!(name in CATALOGS)) {
        throw new Error(`unknown catalog '${name}' (expected: ${Object.keys(CATALOGS).join(', ')}, all)`);
    }
    return [name];
}

function readCatalog(repoRelativePath) {
    return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, repoRelativePath), 'utf8'));
}

function readCatalogAtRef(ref, repoRelativePath) {
    const contents = execFileSync('git', ['show', `${ref}:${repoRelativePath}`], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
    });

    return JSON.parse(contents);
}

function printKeys(title, keys) {
    console.log(title);
    keys.slice(0, MAX_PRINTED_KEYS).forEach((key) => console.log(`  - ${key}`));
    if (keys.length > MAX_PRINTED_KEYS) {
        console.log(`  ... and ${keys.length - MAX_PRINTED_KEYS} more (use --json for the full list)`);
    }
}

function printReport(label, report, since) {
    const {emptyKeys, orphanedKeys, missingKeys, changedKeys} = report;

    if (!hasBlockingIssues(report) && missingKeys.length === 0 && changedKeys.length === 0) {
        console.log(`${label}: in sync with en.json.`);
        return;
    }

    if (emptyKeys.length > 0) {
        printKeys(`${label} has ${emptyKeys.length} empty-string translation(s):`, emptyKeys);
    }
    if (orphanedKeys.length > 0) {
        printKeys(`${label} has ${orphanedKeys.length} orphaned key(s) not present in en.json:`, orphanedKeys);
    }
    if (missingKeys.length > 0) {
        printKeys(`${label} is missing ${missingKeys.length} key(s) present in en.json (follow-up translation):`, missingKeys);
    }
    if (changedKeys.length > 0) {
        printKeys(`${label} has ${changedKeys.length} key(s) whose English source changed since ${since} (review translation):`, changedKeys);
    }
}

function main() {
    const options = parseArgs(process.argv.slice(2));

    const reports = options.catalogs.map((name) => {
        const catalog = CATALOGS[name];
        const baseEn = options.since ? readCatalogAtRef(options.since, catalog.en) : null;

        return {
            catalog: name,
            label: catalog.label,
            since: options.since,
            ...analyzeCatalogs({
                en: readCatalog(catalog.en),
                ko: readCatalog(catalog.ko),
                baseEn,
            }),
        };
    });

    if (options.json) {
        console.log(JSON.stringify(reports, null, 2));
    } else {
        reports.forEach((report) => printReport(report.label, report, options.since));
    }

    if (options.checkMode && reports.some(hasBlockingIssues)) {
        process.exitCode = 1;
    }
}

module.exports = {
    analyzeCatalogs,
    findEmptyAndOrphanedTranslations,
    hasBlockingIssues,
    normalizeCatalog,
};

if (require.main === module) {
    main();
}
