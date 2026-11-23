// Checks a machine after an installer has run for real:  node test/verify.js <case>
// Fails if any step did not finish, a workspace file is missing, or an installed tool does not answer.
const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
const { EXPECT } = require('./make-installers.js');

const name = process.argv[2], home = os.homedir(), win = process.platform === 'win32';
let failed = 0;
const check = (ok, what) => { if (!ok) failed++; console.log((ok ? 'PASS  ' : 'FAIL  ') + what); };

const logFile = path.join(home, '.agentready', 'last-run.json');
check(fs.existsSync(logFile), 'run log exists');
const log = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, 'utf8').replace(/^﻿/, '')) : [];
for (const s of [].concat(log)) check(s.status === 'installed' || s.status === 'present', s.step + ': ' + s.status);
check([].concat(log).length > 0, 'the log lists the steps');

const ws = path.join(home, 'AgentReady-Workspace');
check(fs.existsSync(path.join(ws, 'FIRST_TASK.md')), 'FIRST_TASK.md written');
if (name === 'free') check(fs.existsSync(path.join(ws, 'AGENTS.md')), 'AGENTS.md written');
if (name === 'claude') {
  check(fs.existsSync(path.join(ws, 'CLAUDE.md')), 'CLAUDE.md written');
  const f = path.join(ws, '.claude', 'settings.json');
  check(fs.existsSync(f) && Array.isArray(JSON.parse(fs.readFileSync(f, 'utf8')).permissions.deny), '.claude/settings.json is valid and has deny rules');
}

// a new terminal would have these on its path; this process started before the install
const extra = win
  ? [path.join(process.env.LOCALAPPDATA, 'agy', 'bin'), path.join(process.env.APPDATA, 'npm'), path.join(process.env.LOCALAPPDATA, 'Programs', 'Ollama'),
     path.join(process.env.LOCALAPPDATA, 'Pandoc'), path.join(process.env.ProgramFiles, 'Pandoc'), path.join(process.env.ProgramFiles, 'nodejs')]
  : [path.join(home, '.local', 'bin'), '/opt/homebrew/bin', '/usr/local/bin', '/snap/bin'];
const env = Object.assign({}, process.env, { PATH: extra.join(path.delimiter) + path.delimiter + process.env.PATH });
for (const cmd of EXPECT[name] || []) {
  const r = spawnSync(cmd + ' --version', { shell: true, env, encoding: 'utf8', timeout: 120000 });
  check(r.status === 0, cmd + ' --version -> ' + String(r.stdout || r.stderr || r.error || '').trim().split('\n')[0]);
}
if (name !== 'free') {
  const r = spawnSync('ollama list', { shell: true, env, encoding: 'utf8', timeout: 120000 });
  check(r.status === 0 && /qwen2\.5-coder/.test(r.stdout || ''), 'the local model is downloaded');
}
console.log(failed ? failed + ' check(s) failed' : 'all checks passed');
process.exit(failed ? 1 : 0);
