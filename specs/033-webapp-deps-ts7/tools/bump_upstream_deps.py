#!/usr/bin/env python3
"""Move upstream package.json dependency changes of one commit onto the fork.

Usage: bump.py <repo> <upstream-commit> [--dry-run]

Rules (specs/033-webapp-deps-ts7/data-model.md section 2):
  - fork == upstream_before -> set upstream_after (add if before missing, delete if after missing)
  - skip @tiptap/*, @mattermost/compass-ui, overrides removed by the fork
  - skip when fork value is higher than upstream_after (never downgrade)
  - otherwise skip and report "needs human"
Non-dependency field changes are only reported.
"""
import json
import re
import subprocess
import sys

SECTIONS = ('dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies', 'overrides')
FORK_REMOVED = {('overrides', '@deanwhillier/jest-matchmedia-mock')}


def git_json(repo, rev, path):
    try:
        out = subprocess.check_output(['git', '-C', repo, 'show', f'{rev}:{path}'], stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        return None
    return json.loads(out)


def excluded(name):
    return name.startswith('@tiptap/') or name == '@mattermost/compass-ui'


def ver_tuple(v):
    if not isinstance(v, str):
        return None
    m = re.match(r'^[\^~]?(\d+)\.(\d+)\.(\d+)', v)
    return tuple(int(x) for x in m.groups()) if m else None


def insert_ordered(section_after, section_fork, key, value):
    """Insert key into fork section near where upstream placed it."""
    keys_after = list(section_after.keys())
    idx = keys_after.index(key)
    prev = next((k for k in reversed(keys_after[:idx]) if k in section_fork), None)
    items = list(section_fork.items())
    pos = 0 if prev is None else [k for k, _ in items].index(prev) + 1
    items.insert(pos, (key, value))
    return dict(items)


def main():
    repo, commit = sys.argv[1], sys.argv[2]
    dry = '--dry-run' in sys.argv
    files = subprocess.check_output(['git', '-C', repo, 'show', '--name-only', '--format=', commit]).decode().split()
    files = [f for f in files if f.endswith('package.json') and f.startswith('webapp/')]
    applied, skipped, human, warn = [], [], [], []
    for f in files:
        before, after = git_json(repo, commit + '^', f), git_json(repo, commit, f)
        path = f'{repo}/{f}'
        with open(path) as fh:
            raw = fh.read()
        fork = json.loads(raw)
        for k in sorted(set(before or {}) | set(after or {})):
            if k in SECTIONS:
                continue
            if (before or {}).get(k) != (after or {}).get(k):
                warn.append(f'{f} {k}')
        for sec in SECTIONS:
            b, a = (before or {}).get(sec) or {}, (after or {}).get(sec) or {}
            fs = fork.get(sec)
            for name in sorted(set(b) | set(a)):
                bv, av = b.get(name), a.get(name)
                if bv == av:
                    continue
                cur = (fs or {}).get(name)
                tag = f'{f} {sec} {name}: {bv} -> {av} (fork {cur})'
                if excluded(name) or (sec, name) in FORK_REMOVED:
                    skipped.append(tag + ' [excluded]')
                    continue
                if cur != bv:
                    ct, at = ver_tuple(cur), ver_tuple(av)
                    if ct and at and ct > at:
                        skipped.append(tag + ' [fork higher]')
                    else:
                        human.append(tag)
                    continue
                if fs is None:
                    fork[sec] = fs = {}
                if av is None:
                    del fs[name]
                elif bv is None:
                    fork[sec] = fs = insert_ordered(a, fs, name, av)
                else:
                    fs[name] = av
                applied.append(tag)
        if not dry:
            text = json.dumps(fork, indent=2, ensure_ascii=False) + ('\n' if raw.endswith('\n') else '')
            with open(path, 'w') as fh:
                fh.write(text)
    for label, items in (('APPLIED', applied), ('SKIPPED', skipped), ('NEEDS-HUMAN', human), ('NON-DEP-FIELD', warn)):
        print(f'## {label} {len(items)}')
        for i in items:
            print('  ' + i)


if __name__ == '__main__':
    main()
