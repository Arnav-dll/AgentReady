/* AgentReady: goal -> minimal safe stack -> readable installer. All logic runs locally. */

// ---------- data ----------
const ITCHES = [
  ['Why do I need to know what an MCP server is before I can get help with homework?', 'Students, first-timers', 5],
  ['Why can\'t I tell which AI tool my existing subscription already covers?', 'Anyone paying for AI', 4],
  ['Why does every setup guide assume 32 GB of RAM and fast Wi-Fi?', 'Budget laptops, small towns', 5],
  ['Why does an agent get the run of my files by default?', 'Everyone', 4],
  ['Why is every tutorial out of date within a month?', 'Self-learners', 3],
  ['Why am I staring at an empty prompt after installing?', 'Teachers, non-coders', 4],
];

const GOALS = [
  { id: 'career', label: 'Land an internship or job',
    keys: ['intern(ship)?s?', 'jobs?', 'hired?|hiring', 'resume|cv', 'portfolio', 'placements?', 'interviews?', 'career', 'freelanc\\w*', 'linkedin'],
    firstWin: 'Interview me in 5 questions about my skills and the role I want, then propose one portfolio project I can finish in two weeks. Scaffold it here with a README, and explain each file as you create it.',
    tips: ['Once the first project runs, ask your agent to write tests. Reviewers open the tests folder.',
           'Ask for three resume bullets from this project, then ask it to quiz you on your own code.',
           'Push the project to GitHub with the gh tool I set up. A link beats a claim.'] },
  { id: 'study', label: 'Finish assignments and actually learn',
    keys: ['assignments?', 'homework', 'learn(ing)?', 'stud(y|ying|ies)', 'student', 'exams?', 'courses?', 'dsa', 'college|school|university', 'understand', 'semester', 'viva', 'tutorials?'],
    firstWin: 'I am a student. Take the assignment I describe next, break it into steps, and make me attempt each step before you show a solution. After each step, ask me one question to check I understood.',
    tips: ['Stuck? Ask "explain this like I missed the last lecture" before asking for the answer.',
           'After finishing, ask for five viva questions on your own solution.',
           'Keep each assignment in its own folder so the agent stays focused and cheap.'] },
  { id: 'teach', label: 'Teach and grade faster',
    keys: ['teach(er|ing|es)?', 'grad(e|es|ing)', 'rubrics?', 'lessons?', 'class(es|room)?', 'students', 'papers', 'quiz(zes)?', 'lectures?', 'syllabus', 'worksheets?'],
    firstWin: 'I am a teacher. Ask me for one assignment brief, then write a 4-level grading rubric for it, three sample feedback comments per level, and five viva questions that reveal whether a student understands their own submission.',
    tips: ['Drop submissions into a folder and ask for feedback drafts. You stay the grader; it does the typing.',
           'Ask for a quiz in three difficulty levels from one lesson note.',
           'Pandoc is installed, so ask for the rubric as a Word file.'] },
  { id: 'automate', label: 'Automate my dev work',
    keys: ['automat\\w*', 'refactor\\w*', 'deploy\\w*', 'ship', 'tests?|testing', 'bugs?|debug\\w*', 'repo(sitory)?s?', 'codebase', 'pull requests?', 'dev', 'scripts?'],
    firstWin: 'Read this repository, summarise how it is structured, list the three riskiest untested areas, and propose a plan to add tests for the first one. Wait for my approval before editing.',
    tips: ['Ask for a plan first, then approve. It costs fewer tokens than fixing a wrong guess.',
           'Start a fresh session per task. Long sessions cost more and drift.',
           'Let the agent open pull requests with gh, and review them like a teammate\'s.'] },
  { id: 'research', label: 'Research and write',
    keys: ['research', 'paper', 'thesis|dissertation', 'writ(e|ing)', 'reports?', 'essays?', 'literature', 'articles?', 'notes', 'blogs?', 'books?', 'summar\\w*'],
    firstWin: 'I am writing about a topic I will describe next. Ask me three scoping questions, then produce an outline with the claims that need sources marked clearly. Do not invent citations.',
    tips: ['Ask it to mark every claim that needs a source. Then check those yourself.',
           'Keep notes as Markdown files here. The agent can search and connect them.',
           'Pandoc is installed, so the draft can become a PDF or Word file in one request.'] },
];

// What the words of a goal imply, whatever the goal is. Several can apply at once.
const CAPS = [
  { label: 'writing code', needs: ['git'],
    keys: 'cod(e|ing)|program(s|ming|mer)?|apps?|web ?(site|app|page)s?|software|scripts?|bots?|games?|apis?|python|javascript|typescript|java|c\\+\\+|rust|html|css|react|sql|flutter|kotlin|backend|frontend|full ?stack|dsa|algorithms?|leetcode|machine learning|develop(er|ment|ing)?|dev|hackathon|arduino' },
  { label: 'showing your work to others', needs: ['git', 'gh', 'skills'],
    keys: 'intern(ship)?s?|jobs?|hired?|hiring|placements?|portfolio|career|github|open ?source|hackathon|freelanc\\w*' },
  { label: 'ongoing dev work', needs: ['git', 'gh', 'skills'],
    keys: 'automat\\w*|dev|refactor\\w*|deploy\\w*|ship|tests?|testing|debug\\w*|bugs?|repo(sitory)?s?|codebase|pull requests?|collaborat\\w*' },
  { label: 'writing documents', needs: ['pandoc'],
    keys: 'reports?|essays?|thesis|dissertation|papers?|rubrics?|resume|cv|letters?|pdfs?|word|docx?|documents?|notes|lessons?|quiz(zes)?|worksheets?|blogs?|articles?|books?|proposals?|grad(e|es|ing)|teach(er|ing|es)?|research|writ(e|ing)|literature|handouts?|notices?|newsletters?' },
  { label: 'working with data', needs: ['python'],
    keys: 'excel|csv|spreadsheets?|sheets?|datasets?|data (analysis|science|entry|sets?)|analy[sz]\\w*|charts?|graphs?|statistics|stats|marks|budgets?|sales|expenses|invoices?|attendance|inventory|accounts?' },
];

const GENERAL = {
  firstWin: 'Before doing anything, ask me up to three questions to understand where I am starting from. Then break my goal into small steps, tell me which ones you can do in this folder, and do the first one with me, explaining as you go.',
  tips: ['Describe the result you want, not the steps. Then ask the agent for a plan before it starts.',
         'Start a fresh session for each task. Long sessions cost more and drift.',
         'If an answer looks wrong, say so and ask it to check itself. It often catches its own mistake.'],
};

const AGENTS = {
  claude: { name: 'Claude Code', check: 'claude', cmd: 'claude', ctxFile: 'CLAUDE.md',
            run: 'npm install -g @anthropic-ai/claude-code' },
  codex:  { name: 'Codex CLI', check: 'codex', cmd: 'codex', ctxFile: 'AGENTS.md',
            run: 'npm install -g @openai/codex' },
  gemini: { name: 'Gemini CLI', check: 'gemini', cmd: 'gemini', ctxFile: 'GEMINI.md',
            run: 'npm install -g @google/gemini-cli' },
};

const WINGET = id => 'winget install --id ' + id + ' -e --accept-source-agreements --accept-package-agreements';

// ---------- logic ----------
const has = (t, frag) => new RegExp('(?:^|[^a-z0-9])(?:' + frag + ')(?![a-z0-9])').test(t);

// Any goal works. The closest archetype only shapes the first task and tips; the tools come from
// what the words imply. Nothing recognised -> a general setup built on the user's own words.
function understand(text) {
  const raw = (text || '').replace(/\s+/g, ' ').trim(), t = raw.toLowerCase();
  let arch = null, score = 0;
  for (const g of GOALS) { const s = g.keys.filter(k => has(t, k)).length; if (s > score) { arch = g; score = s; } }
  const caps = CAPS.filter(c => has(t, c.keys));
  const needs = [...new Set(caps.flatMap(c => c.needs))];
  if (!caps.length) needs.push('git');
  const isExample = GOALS.some(g => g.label.toLowerCase() === t);
  const mine = raw && !isExample ? 'My goal: "' + raw.replace(/"/g, "'").replace(/[.!?\s]+$/, '') + '". ' : '';
  const capNames = caps.map(c => c.label).join(', ');
  const read = arch ? 'Sounds like: ' + arch.label.toLowerCase() + '.' + (capNames ? ' I also picked up: ' + capNames + '.' : '')
    : capNames ? 'I picked up: ' + capNames + '.'
    : 'That is a new one for me, so you get the general setup. Your exact words go into the agent\'s rules and its first task.';
  return { id: arch ? arch.id : 'custom', label: raw || 'A general AI agent setup', needs, read, known: !!(arch || caps.length),
           firstWin: mine + (arch || GENERAL).firstWin, tips: (arch || GENERAL).tips };
}

function localModel(ram) {
  if (ram >= 32) return { tag: 'qwen2.5-coder:14b', size: '9 GB' };
  if (ram >= 16) return { tag: 'qwen2.5-coder:7b', size: '4.7 GB' };
  if (ram >= 8)  return { tag: 'qwen2.5-coder:1.5b', size: '1 GB' };
  return null;
}

function recommend(ctx) {
  const goal = understand(ctx.goalText || (GOALS.find(g => g.id === ctx.goalId) || {}).label);
  const subs = ctx.subs || [];
  const steps = [], skipped = [];
  const add = (kind, name, why, check, run, extra) => steps.push(Object.assign({ kind, name, why, check, run }, extra));

  // agent: use what the user already pays for
  let agentId, agentWhy;
  if (subs.includes('claude')) { agentId = 'claude'; agentWhy = 'You already pay for Claude, and Claude Code is included in that plan. No new spend.'; }
  else if (subs.includes('chatgpt')) { agentId = 'codex'; agentWhy = 'You already pay for ChatGPT, and Codex CLI signs in with that plan. No new spend.'; }
  else { agentId = 'gemini'; agentWhy = 'You have no paid plan, and Gemini CLI has a free tier with a Google account. It is the cheapest way to start.'; }
  const agent = AGENTS[agentId];

  if (goal.needs.includes('git'))
    add('base', 'Git', 'Agents save and undo their work with Git. It is your safety net when an edit goes wrong.', 'git', WINGET('Git.Git'));
  add('base', 'Node.js LTS', 'The agent itself is installed through Node\'s package manager.', 'node', WINGET('OpenJS.NodeJS.LTS'));
  if (ctx.skill === 'pro') skipped.push({ name: 'VS Code', why: 'You already have an editor you like.' });
  else add('editor', 'VS Code', ctx.skill === 'new'
    ? 'A friendly window to see the files your agent creates, with a built-in terminal so you never hunt for one.'
    : 'A free editor with a built-in terminal, so files and agent sit side by side.', 'code', WINGET('Microsoft.VisualStudioCode'));
  add('agent', agent.name, agentWhy, agent.check, agent.run);

  // local fallback: only when it helps and the machine can carry it
  const lm = localModel(ctx.ram);
  const wantsLocal = ctx.net === 'patchy' || (agentId === 'gemini' && ctx.hours > 3);
  let local = null;
  if (wantsLocal && lm) {
    local = lm;
    const reason = ctx.net === 'patchy' ? 'Your internet is patchy' : 'You plan heavy use on a free tier';
    add('local', 'Ollama', reason + ', so a small model on your own laptop keeps you working offline and for free.', 'ollama', WINGET('Ollama.Ollama'));
    add('local', 'Model ' + lm.tag, 'Sized for your ' + ctx.ram + ' GB of RAM (about ' + lm.size + ' on disk). Chat with it using: ollama run ' + lm.tag, null, 'ollama pull ' + lm.tag);
  } else if (wantsLocal) {
    skipped.push({ name: 'Local model', why: 'With 4 GB of RAM or less a local model would crawl and freeze your laptop. Use the cloud agent in short sessions instead.' });
  } else {
    skipped.push({ name: 'Local model', why: 'Your internet and plan cover your usage, so several GB of model would be dead weight.' });
  }

  if (goal.needs.includes('gh'))
    add('tool', 'GitHub CLI', 'Lets your agent publish projects and open pull requests, which is what people reviewing your work look at.', 'gh', WINGET('GitHub.cli'));
  if (goal.needs.includes('pandoc'))
    add('tool', 'Pandoc', 'Turns the agent\'s text into Word or PDF files you can hand out or submit.', 'pandoc', WINGET('JohnMacFarlane.Pandoc'));
  if (goal.needs.includes('python'))
    add('tool', 'Python', 'Your goal involves data. With Python the agent can read spreadsheets and CSV files and draw charts, instead of guessing at numbers.', 'py', WINGET('Python.Python.3.12'));

  let thirdParty = false;
  if (goal.needs.includes('skills') && agentId === 'claude') {
    if (ctx.guard.thirdparty) {
      thirdParty = true;
      add('addon', 'Superpowers skill pack', 'Community skills that make the agent plan, test and debug step by step instead of guessing. Community-made, so we flag it.', null,
        'claude plugin marketplace add obra/superpowers-marketplace; claude plugin install superpowers@superpowers-marketplace', { thirdParty: true });
    } else skipped.push({ name: 'Superpowers skill pack', why: 'You turned community add-ons off.' });
  }

  skipped.push({ name: 'A second AI subscription', why: 'It would add cost, not capability, for this goal.' });
  skipped.push({ name: 'MCP servers', why: 'None are needed on day one. Add one when you actually hit the need.' });

  // workspace files
  const files = [];
  const rules = [
    '# AgentReady workspace', '',
    'Goal: ' + goal.label, '',
    '## How to work with me',
    ctx.skill === 'new' ? '- I am new to this. Explain every command before running it, in plain language.' : '- Keep explanations short unless I ask.',
    ctx.mode === 'learn' ? '- Ask before each change and tell me why it is needed.' : '- Work through tasks end to end, then summarise what changed.',
    '- Stay inside this folder.',
    ctx.guard.destructive ? '- Never force-delete files or force-push. Ask first if something must be removed.' : null,
    ctx.guard.secrets ? '- Never read or print .env files, keys or passwords.' : null,
    '- Prefer small steps. Suggest a fresh session when the conversation gets long, to save tokens.',
  ].filter(x => x !== null).join('\n') + '\n';
  files.push({ path: agent.ctxFile, content: rules, why: 'Tells ' + agent.name + ' your goal and house rules every session.' });

  if (agentId === 'claude') {
    const deny = [];
    if (ctx.guard.destructive) deny.push('Bash(rm -rf:*)', 'Bash(git push --force:*)', 'Bash(git reset --hard:*)');
    if (ctx.guard.secrets) deny.push('Read(./.env)', 'Read(./.env.*)', 'Read(./secrets/**)');
    const settings = { permissions: { defaultMode: ctx.mode === 'learn' ? 'default' : 'acceptEdits', deny } };
    files.push({ path: '.claude/settings.json', content: JSON.stringify(settings, null, 2) + '\n', why: 'Hard permission rules the agent cannot talk its way past.' });
  }
  files.push({ path: 'FIRST_TASK.md', content: '# Your first win\n\nOpen a terminal in this folder, run `' + agent.cmd + '`, and paste this:\n\n> ' + goal.firstWin + '\n', why: 'A ready first task, so you are not staring at an empty prompt.' });

  return { goal, agentId, agent, steps, skipped, files, local, thirdParty,
           cost: cost(agentId, ctx, local), safety: safety(agentId, ctx, thirdParty) };
}

function cost(agentId, ctx, local) {
  const h = ctx.hours, free = agentId === 'gemini';
  let level, text;
  if (free) {
    if (h <= 1) { level = 'ok'; text = 'The free tier should comfortably cover about ' + h + ' h a day.'; }
    else if (h <= 3) { level = 'warn'; text = 'The free tier will be tight at ' + h + ' h a day. Expect to hit the daily limit on busy days.'; }
    else { level = 'bad'; text = 'At ' + h + ' h a day you will hit free limits most days.' + (local ? ' The local model covers the gap.' : ''); }
  } else {
    if (h <= 3) { level = 'ok'; text = 'Your existing plan should cover about ' + h + ' h a day.'; }
    else { level = 'warn'; text = 'At ' + h + ' h a day you may hit plan limits on busy days. Fresh sessions per task stretch it further.'; }
  }
  return { newSpend: 0, level, text };
}

function safety(agentId, ctx, thirdParty) {
  const hard = agentId === 'claude';
  const checks = [
    [true, 20, 'Every tool comes from its official source (winget or the vendor\'s npm package)'],
    [true, 15, 'The agent works in its own folder, not your whole disk'],
    [ctx.guard.destructive, 20, 'Destructive commands blocked'],
    [ctx.guard.secrets, 20, 'Secret files off limits'],
    [ctx.mode === 'learn', 10, 'You approve each step (Learn mode)'],
    [hard, 10, hard ? 'Rules enforced by the agent\'s permission system' : 'Rules are instructions only: this agent has no hard permission file we can set'],
    [!thirdParty, 5, thirdParty ? 'Includes one community add-on' : 'No community add-ons'],
  ];
  const score = checks.reduce((n, c) => n + (c[0] ? c[1] : 0), 0);
  return { score, checks: checks.map(c => ({ ok: !!c[0], text: c[2] })) };
}

function buildManifest(plan, ctx) {
  return { tool: 'AgentReady', version: 1, goal: plan.goal.label, mode: ctx.mode,
           workspace: '~/AgentReady-Workspace', agentCommand: plan.agent.cmd,
           steps: plan.steps.map(s => ({ name: s.name, why: s.why, check: s.check || '', run: s.run })),
           files: plan.files.map(f => ({ path: f.path, content: f.content })) };
}

function buildPs1(manifest) {
  const json = JSON.stringify(manifest).replace(/[\u007f-￿]/g, c => '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4));
  return [
    '# AgentReady setup script. Read it before you run it.',
    '#   Preview only:  powershell -ExecutionPolicy Bypass -File .\\agentready-setup.ps1 -DryRun',
    '#   Ask each step: add -Learn      Run everything: add -Auto',
    'param([switch]$DryRun, [switch]$Learn, [switch]$Auto)',
    "$plan = @'",
    json,
    "'@ | ConvertFrom-Json",
    "$learnMode = $Learn -or (($plan.mode -eq 'learn') -and -not $Auto)",
    "function Update-SessionPath { $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User') }",
    "Write-Host ''",
    "Write-Host ('AgentReady: ' + $plan.goal) -ForegroundColor Magenta",
    "if ($DryRun) { Write-Host 'DRY RUN: nothing will be changed.' -ForegroundColor Yellow }",
    '$log = @(); $i = 0; $total = @($plan.steps).Count',
    'foreach ($s in $plan.steps) {',
    '  $i++',
    "  Write-Host ''",
    "  Write-Host ('[{0}/{1}] {2}' -f $i, $total, $s.name) -ForegroundColor Cyan",
    "  Write-Host ('      why: ' + $s.why)",
    '  if ($s.check -and (Get-Command $s.check -ErrorAction SilentlyContinue)) {',
    "    Write-Host '      already installed, skipping' -ForegroundColor Green",
    "    $log += [pscustomobject]@{ step = $s.name; status = 'present' }; continue",
    '  }',
    "  Write-Host ('      run: ' + $s.run) -ForegroundColor Yellow",
    "  if ($DryRun) { $log += [pscustomobject]@{ step = $s.name; status = 'would-run' }; continue }",
    '  if ($learnMode) {',
    "    $a = Read-Host '      Run this step? (y/n)'",
    "    if ($a -ne 'y') { Write-Host '      skipped by you'; $log += [pscustomobject]@{ step = $s.name; status = 'skipped' }; continue }",
    '  }',
    '  $ok = $true',
    '  try { Invoke-Expression $s.run; if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) { $ok = $false } } catch { $ok = $false; Write-Host $_ -ForegroundColor Red }',
    '  Update-SessionPath',
    "  if ($ok) { Write-Host '      done' -ForegroundColor Green } else { Write-Host '      FAILED: later steps may need this. Fix it and run the script again; finished steps are skipped.' -ForegroundColor Red }",
    "  $log += [pscustomobject]@{ step = $s.name; status = $(if ($ok) { 'installed' } else { 'failed' }) }",
    '}',
    "$ws = Join-Path $HOME 'AgentReady-Workspace'",
    "Write-Host ''",
    "Write-Host ('Workspace: ' + $ws) -ForegroundColor Cyan",
    'foreach ($f in $plan.files) {',
    '  $p = Join-Path $ws $f.path',
    "  if (Test-Path $p) { Write-Host ('      keep  ' + $f.path + ' (exists, not overwritten)'); continue }",
    "  Write-Host ('      write ' + $f.path)",
    '  if ($DryRun) { continue }',
    '  New-Item -ItemType Directory -Force -Path (Split-Path $p) | Out-Null',
    '  [IO.File]::WriteAllText($p, $f.content, (New-Object Text.UTF8Encoding($false)))',
    '}',
    'if (-not $DryRun) {',
    "  $state = Join-Path $HOME '.agentready'",
    '  New-Item -ItemType Directory -Force -Path $state | Out-Null',
    "  [IO.File]::WriteAllText((Join-Path $state 'last-run.json'), ($log | ConvertTo-Json), (New-Object Text.UTF8Encoding($false)))",
    "  Write-Host ''",
    "  Write-Host 'Next: open a NEW terminal, then run:' -ForegroundColor Magenta",
    "  Write-Host ('  cd \"' + $ws + '\"')",
    "  Write-Host ('  ' + $plan.agentCommand)",
    "  Write-Host '  ...and paste the prompt from FIRST_TASK.md'",
    '}',
    '',
  ].join('\r\n');
}

if (typeof module !== 'undefined') module.exports = { GOALS, understand, recommend, buildManifest, buildPs1 };

// ---------- UI ----------
if (typeof document !== 'undefined') (function () {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const S = { step: 0, skill: 'new', subs: [], mode: 'learn' };

  $('#itch-rows').innerHTML = ITCHES.map(r =>
    '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td><span class="paws" aria-label="' + r[2] + ' of 5">' +
    '●'.repeat(r[2]) + '<s>' + '●'.repeat(5 - r[2]) + '</s></span></td></tr>').join('');

  // goal step
  const goalEl = $('#goal'), matchEl = $('#goal-match');
  $('#goal-chips').innerHTML = GOALS.map(g => '<button>' + esc(g.label) + '</button>').join('');
  function readGoal() {
    const v = goalEl.value.trim();
    $$('#goal-chips button').forEach(b => b.classList.toggle('on', b.textContent === v));
    matchEl.textContent = v ? understand(v).read : '';
  }
  $('#goal-chips').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    goalEl.value = b.textContent; readGoal();
  });
  goalEl.addEventListener('input', readGoal);

  // chip groups
  $$('.chips[data-group]').forEach(group => {
    const key = group.dataset.group, multi = group.hasAttribute('data-multi');
    group.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (!multi) { group.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); S[key] = b.dataset.value; return; }
      const none = b.dataset.value === 'none';
      group.querySelectorAll('button').forEach(x => { if (none ? x !== b : x.dataset.value === 'none') x.classList.remove('on'); });
      b.classList.toggle('on');
      S[key] = [...group.querySelectorAll('button.on')].map(x => x.dataset.value);
    });
  });

  // machine detection (best effort; the user can correct it)
  (function detect() {
    const ua = navigator.userAgent, bits = [];
    const os = /Windows/.test(ua) ? 'windows' : /Mac/.test(ua) ? 'mac' : /Linux|Android/.test(ua) ? 'linux' : 'windows';
    $('#os').value = os;
    const mem = navigator.deviceMemory;
    if (mem) { $('#ram').value = mem >= 8 ? '8' : '4'; bits.push('at least ' + mem + ' GB RAM (browsers report 8 at most, so raise it if you have more)'); }
    else $('#ram').value = '8';
    if (navigator.hardwareConcurrency) bits.push(navigator.hardwareConcurrency + ' CPU threads');
    const c = navigator.connection;
    if (c && (c.saveData || /2g|3g/.test(c.effectiveType || ''))) { $('#net').value = 'patchy'; bits.push('a slow or metered connection'); }
    $('#detected').textContent = bits.length ? 'I sniffed out: ' + bits.join(', ') + '. Correct anything that is wrong.' : 'I could not detect your machine from the browser, so please fill this in.';
  })();
  const hoursOut = () => { const h = +$('#hours').value; $('#hours-out').textContent = h + (h === 1 ? ' hour' : ' hours'); };
  $('#hours').addEventListener('input', hoursOut); hoursOut();

  function ctx() {
    return { goalText: goalEl.value.trim(), skill: S.skill, subs: S.subs, mode: S.mode,
             os: $('#os').value, ram: +$('#ram').value, net: $('#net').value, hours: +$('#hours').value,
             guard: { destructive: $('#g-destructive').checked, secrets: $('#g-secrets').checked, thirdparty: $('#g-thirdparty').checked } };
  }

  // navigation
  const LAST = 4;
  function go(n) {
    if (n > 0 && !goalEl.value.trim()) {
      matchEl.textContent = 'Type what you want to get done, in any words, or tap an example.';
      goalEl.focus(); return;
    }
    S.step = n;
    $$('.pane').forEach(p => p.classList.toggle('on', +p.dataset.pane === n));
    $$('#steps li').forEach((li, i) => { li.classList.toggle('on', i === n); li.classList.toggle('done', i < n); });
    $('#steps').style.setProperty('--i', n);
    $('#back').hidden = n === 0;
    $('#next').textContent = n === LAST - 1 ? 'Build my setup' : n === LAST ? 'Start over' : 'Next';
    if (n === LAST) render();
    $('#wizard').scrollIntoView({ block: 'start' });
  }
  $('#next').addEventListener('click', () => go(S.step === LAST ? 0 : S.step + 1));
  $('#back').addEventListener('click', () => go(S.step - 1));

  // result
  let current = null;
  function render() {
    const c = ctx(), plan = recommend(c), man = buildManifest(plan, c);
    current = { c, plan, man };
    const sc = plan.safety.score, col = sc >= 85 ? 'var(--ok)' : sc >= 65 ? 'var(--warn)' : 'var(--bad)';
    const win = c.os === 'windows';
    // only show a tip if the tool it leans on is actually in this stack
    const has = n => plan.goal.needs.includes(n);
    const tips = plan.goal.tips.filter(t => (!/pandoc/i.test(t) || has('pandoc')) && (!/gh/.test(t) || has('gh')));
    $('#result').innerHTML =
      '<p class="verdict">' + plan.steps.length + ' things to set up. ' + plan.skipped.length + ' left out on purpose.</p>' +
      '<p class="note">For: <b>' + esc(man.goal) + '</b><br>' + esc(plan.goal.read) + '</p>' +
      '<div class="res-grid"><div>' +
        '<div class="card"><h4>Your stack, and why each piece is there</h4>' +
          plan.steps.map((s, i) => '<div class="item" style="--i:' + i + '"><span class="k">' + s.kind + '</span><b>' + esc(s.name) + '</b><p>' + esc(s.why) + '</p></div>').join('') + '</div>' +
        '<div class="card" style="margin-top:16px"><h4>Left out on purpose</h4>' +
          plan.skipped.map((s, i) => '<div class="item skip" style="--i:' + (i + plan.steps.length) + '"><span class="k">skip</span><b>' + esc(s.name) + '</b><p>' + esc(s.why) + '</p></div>').join('') + '</div>' +
      '</div><div class="side">' +
        '<div class="card"><h4>Safety score</h4><div class="ring" style="--c:' + col + '"><b>' + sc + '</b></div>' +
          '<ul class="checks">' + plan.safety.checks.map(k => '<li class="' + (k.ok ? '' : 'no') + '">' + esc(k.text) + '</li>').join('') + '</ul>' +
          '<p class="fine">A check of this setup\'s settings, not a penetration test.</p></div>' +
        '<div class="card cost"><h4>Cost</h4><b>₹0 new spend</b><p>' + esc(plan.cost.text) + '</p><p class="fine">A rough estimate. Provider limits change.</p></div>' +
      '</div></div>' +
      '<div class="card firstwin"><h4>Your first win, ready to paste</h4><blockquote>' + esc(plan.goal.firstWin) + '</blockquote></div>' +
      '<div class="card tips"><h4>After your first win</h4><ol>' + tips.map(t => '<li>' + esc(t) + '</li>').join('') + '</ol></div>' +
      '<div class="actions">' +
        '<button class="btn" id="dl-ps1">Download installer (.ps1)</button>' +
        '<button class="btn ghost" id="preview">Preview dry run</button>' +
        '<button class="btn ghost" id="dl-json">Download manifest (.json)</button></div>' +
      (win ? '' : '<p class="note">The installer script is Windows-only for now. On ' + (c.os === 'mac' ? 'macOS' : 'Linux') + ' use the manifest as a checklist: the tools are the same, the install commands differ.</p>') +
      '<div class="runline">powershell -ExecutionPolicy Bypass -File .\\agentready-setup.ps1 -DryRun</div>' +
      '<p class="note">Run that first from your Downloads folder to see every step without changing anything. Drop <code>-DryRun</code> to install.</p>' +
      '<div class="term" id="term" hidden></div>';
    requestAnimationFrame(() => requestAnimationFrame(() => { const r = $('.ring'); if (r) r.style.setProperty('--v', sc); }));
    $('#dl-ps1').onclick = () => download('agentready-setup.ps1', buildPs1(man));
    $('#dl-json').onclick = () => download('agentready-setup.json', JSON.stringify(man, null, 2));
    $('#preview').onclick = () => {
      const t = $('#term'), n = man.steps.length;
      t.hidden = false;
      t.innerHTML = '<span class="y">DRY RUN: nothing will be changed.</span>\n' +
        man.steps.map((s, i) => '\n<span class="g">[' + (i + 1) + '/' + n + '] ' + esc(s.name) + '</span>\n<span class="c">      why: ' + esc(s.why) + '</span>\n' +
          (s.check ? '<span class="c">      skip if "' + esc(s.check) + '" is already installed</span>\n' : '') + '      run: ' + esc(s.run)).join('\n') +
        '\n\n<span class="g">Workspace: ~/AgentReady-Workspace</span>\n' + man.files.map(f => '      write ' + esc(f.path)).join('\n');
      t.scrollIntoView({ block: 'nearest' });
    };
  }
  function download(name, text) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ---------- motion: reveal on scroll, and one patch of pigment that trails the cursor ----------
  (function motion() {
    const groups = ['.stats li', '#itches h2, #itches .sub, #itches .table-wrap', '#how h2', '.how article', '#wizard h2, #wizard .sub, #wizard .wizard'];
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
        { rootMargin: '0px 0px -8% 0px' });
      groups.forEach(sel => $$(sel).forEach((el, i) => { el.style.setProperty('--i', i); el.classList.add('reveal'); io.observe(el); }));
    }
    const glow = $('.sky b');
    if (!glow || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0, seen = false;
    function tick() {
      x += (tx - x) * 0.07; y += (ty - y) * 0.07;                     // eased follow, so it has weight
      glow.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : 0;   // sleeps when settled
    }
    addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY;
      if (!seen) { seen = true; x = tx; y = ty; glow.classList.add('live'); }
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  })();
})();
