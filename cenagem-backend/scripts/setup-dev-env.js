/* eslint-disable no-console */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, 'apps', 'api', '.env.local');

const ensureSecret = (content, key, bytes) => {
  const pattern = new RegExp(`^${key}=`, 'm');
  if (pattern.test(content)) {
    return { content, updated: false };
  }

  const secret = crypto.randomBytes(bytes).toString('hex');
  let nextContent = content;

  if (!nextContent.trim()) {
    nextContent = [
      '# Local-only secrets generated automatically for development.',
      '# Do not commit this file; production secrets come from the KMS/KeyVault pipeline.',
      `${key}=${secret}`,
      '',
    ].join('\n');
  } else {
    if (!nextContent.endsWith('\n')) {
      nextContent += '\n';
    }
    nextContent += `${key}=${secret}\n`;
  }

  return { content: nextContent, updated: true };
};

const main = () => {
  let content = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, 'utf8')
    : '';

  let changed = false;

  const resultAccess = ensureSecret(content, 'JWT_ACCESS_SECRET', 32);
  content = resultAccess.content;
  changed = changed || resultAccess.updated;

  const resultRefresh = ensureSecret(content, 'JWT_REFRESH_SECRET', 48);
  content = resultRefresh.content;
  changed = changed || resultRefresh.updated;

  if (!changed) {
    console.log(
      `[setup-dev-env] ${envPath} already contains both JWT secrets.`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(envPath), { recursive: true });
  fs.writeFileSync(envPath, content, 'utf8');
  console.log(`[setup-dev-env] Secrets written to ${envPath}`);
};

main();
