import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const file = new URL('../.dev.vars', import.meta.url);
const previous = existsSync(file) ? readFileSync(file, 'utf8') : '';
if (/^ADMIN_PASSWORD=/m.test(previous) && !process.argv.includes('--reset')) {
  console.log(
    '管理员密码已配置。请查看本地 .dev.vars；重置请运行 npm run admin:password -- --reset。',
  );
} else {
  const password = randomBytes(18).toString('base64url');
  const retained = previous.replace(/^ADMIN_PASSWORD=.*(?:\r?\n|$)/gm, '');
  writeFileSync(file, `${retained.trimEnd()}\nADMIN_PASSWORD=${password}\n`);
  console.log(
    `管理员密码：${password}\n已保存至 .dev.vars（请勿提交）。重启 npm run dev 后生效。`,
  );
}
