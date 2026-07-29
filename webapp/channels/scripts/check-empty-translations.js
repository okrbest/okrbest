// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/**
 * Detects two classes of ko.json quality issues that Weblate does not
 * clean up on its own:
 *  - empty-string translations (Weblate sets the value to '' instead of
 *    removing the key when a translator clears a string)
 *  - orphaned keys (present in ko.json but no longer extracted into en.json)
 *
 * This replaces the mmjstool `clean-empty`/`check-empty-src` checks that
 * were dropped upstream when migrating to @formatjs/cli.
 */

const fs = require('fs');
const path = require('path');

function findEmptyAndOrphanedTranslations(enCatalog, koCatalog) {
    const emptyKeys = Object.keys(koCatalog).filter((key) => koCatalog[key] === '');
    const orphanedKeys = Object.keys(koCatalog).filter((key) => !(key in enCatalog));

    return {emptyKeys, orphanedKeys};
}

function main() {
    const checkMode = process.argv.includes('--check');

    const enPath = path.join(__dirname, '..', 'src', 'i18n', 'en.json');
    const koPath = path.join(__dirname, '..', 'src', 'i18n', 'ko.json');

    const enCatalog = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const koCatalog = JSON.parse(fs.readFileSync(koPath, 'utf8'));

    const {emptyKeys, orphanedKeys} = findEmptyAndOrphanedTranslations(enCatalog, koCatalog);

    if (emptyKeys.length === 0 && orphanedKeys.length === 0) {
        console.log('ko.json: no empty or orphaned translation keys found.');
        return;
    }

    if (emptyKeys.length > 0) {
        console.log(`ko.json has ${emptyKeys.length} empty-string translation(s):`);
        emptyKeys.forEach((key) => console.log(`  - ${key}`));
    }

    if (orphanedKeys.length > 0) {
        console.log(`ko.json has ${orphanedKeys.length} orphaned key(s) not present in en.json:`);
        orphanedKeys.forEach((key) => console.log(`  - ${key}`));
    }

    if (checkMode) {
        process.exitCode = 1;
    }
}

module.exports = {findEmptyAndOrphanedTranslations};

if (require.main === module) {
    main();
}
