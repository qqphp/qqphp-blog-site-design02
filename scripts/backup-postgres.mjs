import { spawnSync } from 'node:child_process';
import { cp, mkdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { ensureManagedPostgres } from './managed-postgres.mjs';

if (!process.env.DATABASE_URL) throw new Error('请先配置 DATABASE_URL');
await ensureManagedPostgres();
const url = new URL(process.env.DATABASE_URL);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const base = resolve(process.argv[2] || '.local/backups');
const destination = join(base, `alei-${stamp}`);
const media = resolve('.local/media');
if (base.toLowerCase() === media.toLowerCase() ||
    base.toLowerCase().startsWith(`${media.toLowerCase()}\\`))
  throw new Error('备份目录不能位于素材目录内部');
await mkdir(base, { recursive: true });
await mkdir(destination, { recursive: false });
const bin = process.env.POSTGRES_BIN || 'C:\\Program Files\\PostgreSQL\\18\\bin';
const result = spawnSync(join(bin, 'pg_dump.exe'), ['-Fc', '-f', join(destination, 'database.dump')], {
  encoding: 'utf8', windowsHide: true,
  env: {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || '5432',
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: url.pathname.slice(1),
  },
});
if (result.error || result.status !== 0)
  throw new Error(`数据库备份失败：${result.error?.message || result.stderr?.trim() || '未知错误'}`);
try {
  await stat(media);
  await cp(media, join(destination, 'media'), { recursive: true });
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}
console.log(`数据库和素材备份完成：${destination}`);
console.log('备份中包含内容及 API 密钥，请妥善保管，并单独备份 .dev.vars。');
