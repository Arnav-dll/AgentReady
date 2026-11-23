// Builds the installers that CI runs for real on clean Windows, macOS and Linux machines.
//   node test/make-installers.js        -> test/out/agentready-<case>.cmd and .sh
const fs = require('fs'), path = require('path');
const A = require('../app.js');

const base = { skill: 'new', subs: [], mode: 'auto', ram: 8, gpu: 'none', net: 'good', hours: 1, brain: 'auto',
               guard: { destructive: true, secrets: true, thirdparty: false } };
const CASES = {
  // no subscription: Antigravity CLI from Google's installer, plus Git, VS Code and GitHub CLI
  free:    { goalText: 'Land an internship or job' },
  // paid Claude with an offline backup: Node, Claude Code through npm, Ollama, a 1 GB model, Pandoc
  claude:  { goalText: 'grade 60 papers by Friday', subs: ['claude'], brain: 'both' },
  // offline only: Ollama, a model and Python, with no agent
  offline: { goalText: 'keep my shop accounts in a spreadsheet', brain: 'local' },
};
// commands that must answer after each case has run
const EXPECT = { free: ['agy', 'git', 'gh'], claude: ['node', 'claude', 'ollama', 'pandoc'], offline: ['ollama'] };

if (require.main === module) {
  const out = path.join(__dirname, 'out');
  fs.mkdirSync(out, { recursive: true });
  for (const [name, o] of Object.entries(CASES)) {
    const ctx = Object.assign({}, base, o);
    for (const os of ['windows', 'mac']) {
      const i = A.buildInstaller(ctx, os, name);
      fs.writeFileSync(path.join(out, i.name), i.text);
      console.log('wrote', i.name);
    }
  }
}
module.exports = { CASES, EXPECT, base };
