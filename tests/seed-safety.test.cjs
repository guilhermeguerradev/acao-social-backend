const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const cwd = path.resolve(__dirname, '..');
function runSeed(overrides, args = ['prisma/seed-demo.cjs']) {
  return spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
    timeout: 10000,
    windowsHide: true,
    env: {
      ...process.env,
      DATABASE_URL: 'postgresql://unused:unused@localhost:1/acao_social',
      NODE_ENV: 'development',
      DEMO_PASSWORD: '',
      SEED_USER_PASSWORD: '',
      ...overrides,
    },
  });
}

test('manual demo seed refuses production and remote databases before accessing data', () => {
  for (const env of [{ NODE_ENV: 'production' }, { DATABASE_URL: 'postgresql://unused:unused@example.invalid/acao_social' }]) {
    const result = runSeed(env);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /somente em desenvolvimento e PostgreSQL local/);
    assert.doesNotMatch(result.stderr, /ECONNREFUSED|ENOTFOUND/);
  }
});

test('legacy destructive seed validates destination and password before deleting any data', () => {
  const args = ['-r', 'ts-node/register', 'prisma/seed.ts'];
  for (const env of [{ NODE_ENV: 'production' }, { DATABASE_URL: 'postgresql://unused:unused@example.invalid/acao_social' }]) {
    const result = runSeed(env, args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Seed permitido somente no banco local acao_social/);
    assert.doesNotMatch(result.stderr, /ECONNREFUSED|ENOTFOUND/);
  }
  const missingPassword = runSeed({}, args);
  assert.equal(missingPassword.status, 1);
  assert.match(missingPassword.stderr, /Missing required environment variable: SEED_USER_PASSWORD/);
  assert.doesNotMatch(missingPassword.stderr, /ECONNREFUSED|ENOTFOUND/);
});

test('manual demo seed requires the expected database and an explicit valid password', () => {
  const wrongDatabase = runSeed({ DATABASE_URL: 'postgresql://unused:unused@localhost:1/other_database' });
  assert.equal(wrongDatabase.status, 1);
  assert.match(wrongDatabase.stderr, /banco local esperado e acao_social/);
  for (const password of ['', 'short', 'a'.repeat(73), 'á'.repeat(37)]) {
    const result = runSeed({ DEMO_PASSWORD: password });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Defina DEMO_PASSWORD/);
    assert.doesNotMatch(result.stderr, /ECONNREFUSED|ENOTFOUND/);
  }
});
