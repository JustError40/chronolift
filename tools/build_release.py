"""Архив для загрузки в Яндекс Игры: releases/chronolift-yandex.zip.

В корне архива index.html (требование 1.22), без страницы с имитацией SDK и без тестов.
Запуск: python tools/build_release.py
"""
import os
import re
import zipfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
GAME = os.path.join(ROOT, 'game')
OUT = os.path.join(ROOT, 'releases', 'chronolift-yandex.zip')
SKIP_DIRS = {'test'}
SKIP_FILES = {'test-yandex.html'}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
total = 0
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
    for d, dirs, files in os.walk(GAME):
        dirs[:] = [x for x in dirs if x not in SKIP_DIRS]
        for f in files:
            if f in SKIP_FILES:
                continue
            p = os.path.join(d, f)
            rel = os.path.relpath(p, GAME).replace(os.sep, '/')
            if re.search(r'[^A-Za-z0-9_./-]', rel):     # требование 1.22: без пробелов и русских букв
                raise SystemExit('недопустимое имя файла: ' + rel)
            z.write(p, rel)
            total += os.path.getsize(p)
print(f'{os.path.normpath(OUT)}: {os.path.getsize(OUT) / 1e6:.1f} МБ, распаковано {total / 1e6:.1f} МБ (лимит 100)')
