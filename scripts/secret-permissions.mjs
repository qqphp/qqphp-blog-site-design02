import { chmodSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

export function restrictSecretFile(path) {
  if (process.platform !== 'win32') {
    chmodSync(path, 0o600);
    return;
  }
  const identity = spawnSync('whoami.exe', ['/user', '/fo', 'csv', '/nh'], {
    encoding: 'utf8', windowsHide: true,
  });
  const sid = identity.stdout?.match(/S-1-5-\d+(?:-\d+)+/)?.[0];
  if (!sid) throw new Error('无法识别当前 Windows 用户，未能限制密钥文件访问');
  const result = spawnSync('icacls.exe', [path, '/inheritance:r', '/grant:r',
    `*${sid}:F`, '*S-1-5-18:F', '*S-1-5-32-544:F'], {
    encoding: 'utf8', windowsHide: true,
  });
  if (result.status !== 0)
    throw new Error(`无法限制密钥文件访问：${result.stderr?.trim() || '未知错误'}`);
}
