#!/usr/bin/env python3
"""
OKR.BEST i18n rebranding script.
Replaces Mattermost references with OKR.BEST in JSON i18n files.
"""

import json
import sys
import os

# Replacement rules (order matters - specific first, generic last)
REPLACEMENTS = [
    ("Mattermost Enterprise Advanced", "OKR.BEST Enterprise Advanced"),
    ("Mattermost Enterprise Edition", "OKR.BEST Enterprise Edition"),
    ("Mattermost Enterprise", "OKR.BEST Enterprise"),
    ("Mattermost Professional", "OKR.BEST Professional"),
    ("Mattermost Cloud", "OKR.BEST Cloud"),
    ("Mattermost Hosted Push Notification Service", "OKR.BEST Hosted Push Notification Service"),
    ("Mattermost Software and Services License Agreement", "OKR.BEST Software and Services License Agreement"),
    ("Mattermost Software Evaluation Agreement", "OKR.BEST Software Evaluation Agreement"),
    ("Mattermost Team Edition", "OKR.BEST Team Edition"),
    ("Mattermost Starter", "OKR.BEST Starter"),
    ("Mattermost", "OKR.BEST"),
    ("docs.mattermost.com", "docs.okrbest.com"),
    ("mattermost.com/pl/", "okr.best/pl/"),
    ("mattermost.com", "okr.best"),
    ("support@mattermost.com", "support@okr.best"),
    ("feedback@mattermost.com", "support@okr.best"),
    ("legal@mattermost.com", "legal@okr.best"),
    ("trademark@mattermost.com", "trademark@okr.best"),
    ("commercial@mattermost.com", "commercial@okr.best"),
]

def rebrand_value(value):
    if not isinstance(value, str):
        return value
    for old, new in REPLACEMENTS:
        value = value.replace(old, new)
    return value

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    changed = 0

    if isinstance(data, dict):
        # Webapp format: {"key": "value", ...}
        for key in data:
            original = data[key]
            if isinstance(original, str):
                new_val = rebrand_value(original)
                if new_val != original:
                    data[key] = new_val
                    changed += 1
    elif isinstance(data, list):
        # Server format: [{"id": "key", "translation": "value"}, ...]
        for item in data:
            if isinstance(item, dict) and 'translation' in item:
                original = item['translation']
                if isinstance(original, str):
                    new_val = rebrand_value(original)
                    if new_val != original:
                        item['translation'] = new_val
                        changed += 1

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

    return changed

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 rebrand_i18n.py <file_or_directory> [...]")
        sys.exit(1)

    total_files = 0
    total_changes = 0

    for arg in sys.argv[1:]:
        if os.path.isdir(arg):
            for fname in sorted(os.listdir(arg)):
                if fname.endswith('.json'):
                    fpath = os.path.join(arg, fname)
                    count = process_file(fpath)
                    if count > 0:
                        print(f"  {fname}: {count} replacements")
                    total_files += 1
                    total_changes += count
        else:
            count = process_file(arg)
            if count > 0:
                print(f"  {os.path.basename(arg)}: {count} replacements")
            total_files += 1
            total_changes += count

    print(f"\nTotal: {total_changes} replacements in {total_files} files")
