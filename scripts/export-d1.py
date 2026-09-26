import glob
import json
import os
import sqlite3
import sys

sys.stdout.reconfigure(encoding='utf-8')

files = glob.glob('.wrangler/state/v3/d1/**/*.sqlite', recursive=True)
for path in files:
    db = sqlite3.connect('file:' + os.path.abspath(path).replace('\\', '/') + '?mode=ro', uri=True)
    tables = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    if 'cms_documents' not in tables:
        db.close()
        continue
    data = {
        'documents': [dict(key=key, value=json.loads(value), revision=revision)
                      for key, value, revision in db.execute('SELECT key, value, revision FROM cms_documents')],
        'snapshots': [dict(key=key, payload=json.loads(payload), stored_at=stored_at)
                      for key, payload, stored_at in db.execute('SELECT key, payload, stored_at FROM aa_language_model_snapshots')],
        'keys': [dict(service=service, api_key=api_key, updated_at=updated_at)
                 for service, api_key, updated_at in db.execute('SELECT service, api_key, updated_at FROM api_integration_keys')],
    }
    print(json.dumps(data, ensure_ascii=False))
    db.close()
    break
else:
    raise SystemExit('未找到包含 cms_documents 的本地 D1 数据库')
