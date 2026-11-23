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
  // Gemini CLI stopped serving free personal accounts on 18 June 2026. Google's replacement is Antigravity CLI.
  agy:    { name: 'Antigravity CLI', check: 'agy', cmd: 'agy', ctxFile: 'AGENTS.md', node: false,
            run: { windows: 'irm https://antigravity.google/cli/install.ps1 | iex',
                   mac: 'curl -fsSL https://antigravity.google/cli/install.sh | bash',
                   linux: 'curl -fsSL https://antigravity.google/cli/install.sh | bash' } },
};

// Install commands per operating system. Windows uses winget, macOS uses Homebrew, and Linux uses
// whichever package manager the machine has (the .sh script works that out when it runs).
const WINGET = id => 'winget install --id ' + id + ' -e --source winget --accept-source-agreements --accept-package-agreements';
const PMS = ['apt', 'dnf', 'pacman', 'zypper'];
const PKG = (apt, pacman) => ({ apt: 'sudo apt-get install -y ' + apt, dnf: 'sudo dnf install -y ' + apt,
                                pacman: 'sudo pacman -S --needed --noconfirm ' + (pacman || apt), zypper: 'sudo zypper install -y ' + apt });
const TOOLS = {
  brew:   { name: 'Homebrew', check: 'brew',
            mac: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"' },
  curl:   { name: 'curl', check: 'curl', linux: PKG('curl') },
  git:    { name: 'Git', check: 'git', windows: WINGET('Git.Git'), mac: 'brew install git', linux: PKG('git') },
  node:   { name: 'Node.js LTS', check: 'node', windows: WINGET('OpenJS.NodeJS.LTS'), mac: 'brew install node',
            linux: { apt: 'curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs',
                     dnf: 'curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash - && sudo dnf install -y nodejs',
                     pacman: 'sudo pacman -S --needed --noconfirm nodejs npm', zypper: 'sudo zypper install -y nodejs npm' } },
  code:   { name: 'VS Code', check: 'code', windows: WINGET('Microsoft.VisualStudioCode'), mac: 'brew install --cask visual-studio-code',
            linux: 'sudo snap install code --classic || { echo "No snap on this system. Get VS Code from https://code.visualstudio.com/docs/setup/linux"; false; }' },
  gh:     { name: 'GitHub CLI', check: 'gh', windows: WINGET('GitHub.cli'), mac: 'brew install gh', linux: PKG('gh', 'github-cli') },
  pandoc: { name: 'Pandoc', check: 'pandoc', windows: WINGET('JohnMacFarlane.Pandoc'), mac: 'brew install pandoc', linux: PKG('pandoc', 'pandoc-cli') },
  python: { name: 'Python', check: { windows: 'py', mac: 'python3', linux: 'python3' }, windows: WINGET('Python.Python.3.12'),
            mac: 'brew install python', linux: PKG('python3 python3-pip', 'python python-pip') },
  ollama: { name: 'Ollama', check: 'ollama', windows: WINGET('Ollama.Ollama'), mac: 'brew install ollama && brew services start ollama',
            linux: 'curl -fsSL https://ollama.com/install.sh | sh' },
};

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
           codey: caps.some(c => c.needs.includes('git')),
           firstWin: mine + (arch || GENERAL).firstWin, tips: (arch || GENERAL).tips };
}

// Local models, smallest first. Download sizes are approximate.
const MODELS = [['1.5b', '1 GB'], ['3b', '1.9 GB'], ['7b', '4.7 GB'], ['14b', '9 GB']];

// RAM decides what the machine can hold. A graphics card decides how fast it answers, and can lift the size.
function localModel(ram, gpu) {
  if (!(ram >= 8)) return null;
  const apple = gpu === 'apple', vram = +gpu || 0;
  const ramTier = ram >= 32 ? 3 : ram >= 16 ? 2 : apple ? 1 : 0;
  const gpuTier = vram >= 12 ? 3 : vram >= 8 ? 2 : vram >= 4 ? 1 : -1;
  const tier = Math.max(ramTier, Math.min(gpuTier, ram >= 16 ? 3 : 2));
  const speed = apple || gpuTier >= tier ? 'fast' : vram ? 'split' : 'slow';
  const speedText = apple ? 'Apple Silicon shares its memory with the graphics chip, so answers come quickly.'
    : speed === 'fast' ? 'It fits inside your graphics card\'s memory, so answers come quickly.'
    : speed === 'split' ? 'It is bigger than your graphics card\'s memory, so part of it runs on the processor: smarter, but slower.'
    : 'With no dedicated graphics card it runs on the processor: expect a few words a second.';
  return { tag: 'qwen2.5-coder:' + MODELS[tier][0], size: MODELS[tier][1], speed, speedText };
}

function recommend(ctx) {
  const goal = understand(ctx.goalText || (GOALS.find(g => g.id === ctx.goalId) || {}).label);
  const subs = ctx.subs || [], os = ctx.os || 'windows';
  const steps = [], skipped = [];
  const add = (kind, name, why, check, run, extra) => steps.push(Object.assign({ kind, name, why, check, run }, extra));
  // a tool from the table, with the install command for this operating system
  const tool = (kind, id, why) => {
    const t = TOOLS[id], r = t[os], check = typeof t.check === 'string' ? t.check : t.check[os];
    add(kind, t.name, why, check, typeof r === 'string' ? r : r.apt, typeof r === 'string' ? null : { alt: r });
  };

  // agent: use what the user already pays for
  let agentId, agentWhy;
  if (subs.includes('claude')) { agentId = 'claude'; agentWhy = 'You already pay for Claude, and Claude Code is included in that plan. No new spend.'; }
  else if (subs.includes('chatgpt')) { agentId = 'codex'; agentWhy = 'You already pay for ChatGPT, and Codex CLI signs in with that plan. No new spend.'; }
  else { agentId = 'agy'; agentWhy = 'You have no paid plan, and Google\'s Antigravity CLI has a free tier with a personal Google account. It is the cheapest way to start.'; }
  const agent = AGENTS[agentId];

  // where the AI runs: the user's choice, checked against what the machine can carry
  const pick = ctx.brain || 'auto';
  const lm = localModel(ctx.ram, ctx.gpu);
  const autoLocal = ctx.net === 'patchy' || (agentId === 'agy' && ctx.hours > 3);
  const wantsLocal = pick === 'local' || pick === 'both' || (pick === 'auto' && autoLocal);
  const brain = pick === 'local' && lm ? 'local' : wantsLocal && lm ? 'both' : 'cloud';
  const chatOnly = brain === 'local';
  const local = brain === 'cloud' ? null : lm;

  if (os === 'mac')
    tool('base', 'brew', 'macOS has no built-in installer for these tools. Homebrew is the standard one, and everything below comes through it.');
  if (os === 'linux')
    tool('base', 'curl', 'Fetches the official installers used by the steps below.');
  if (chatOnly ? goal.codey : goal.needs.includes('git'))
    tool('base', 'git', chatOnly ? 'Saves versions of your code, so a bad change is one command away from undone.'
      : 'Agents save and undo their work with Git. It is your safety net when an edit goes wrong.');
  if (!chatOnly && agent.node !== false) tool('base', 'node', 'The agent itself is installed through Node\'s package manager.');
  if (os === 'windows' && !chatOnly && agent.node !== false)
    add('base', 'Script permission', 'Windows blocks PowerShell scripts by default, and an agent installed through Node starts from one, so it would refuse to open. This allows scripts made on this PC, for your account only. Downloaded scripts still need a signature.', null,
      'try { Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force -ErrorAction Stop } catch [System.Security.SecurityException] { }',
      { test: "@('RemoteSigned','Unrestricted','Bypass') -contains [string](Get-ExecutionPolicy -Scope CurrentUser) -or @('RemoteSigned','Unrestricted','Bypass') -contains [string](Get-ExecutionPolicy -Scope LocalMachine)" });
  if (ctx.skill === 'pro') skipped.push({ name: 'VS Code', why: 'You already have an editor you like.' });
  else if (chatOnly && !goal.codey) skipped.push({ name: 'VS Code', why: 'A chat-only setup makes no files to browse. Add an editor when you start writing code.' });
  else tool('editor', 'code', ctx.skill === 'new'
    ? 'A friendly window to see the files in your workspace, with a built-in terminal so you never hunt for one.'
    : 'A free editor with a built-in terminal, so files and AI sit side by side.');
  if (!chatOnly) add('agent', agent.name, agentWhy, agent.check, typeof agent.run === 'string' ? agent.run : agent.run[os]);
  else skipped.push({ name: 'An agent (Claude Code, Codex, Antigravity)', why: 'Agents are built for the big online models. Small local models are not yet reliable at running tools, so offline you chat with the model and stay in charge of your files. Pick "Both" to get an agent as well.' });

  if (local) {
    const reason = pick === 'local' ? 'You chose to run offline. Ollama runs AI models on your own machine: private, free and with no daily limit.'
      : pick === 'both' ? 'You asked for an offline backup. Ollama runs a model on your own machine for when the internet or your plan runs out.'
      : (ctx.net === 'patchy' ? 'Your internet is patchy' : 'You plan heavy use on a free tier') + ', so a small model on your own machine keeps you working offline and for free.';
    tool('local', 'ollama', reason);
    const fit = ctx.gpu === 'apple' ? ctx.ram + ' GB of shared memory' : +ctx.gpu ? ctx.ram + ' GB of RAM and ' + ctx.gpu + ' GB graphics card' : ctx.ram + ' GB of RAM';
    add('local', 'Model ' + lm.tag, 'Sized for your ' + fit + ' (about ' + lm.size + ' to download). ' + lm.speedText + ' Chat with it using: ollama run ' + lm.tag, null, 'ollama pull ' + lm.tag);
  } else if (pick === 'cloud') {
    skipped.push({ name: 'Local model', why: 'You chose online models only.' });
  } else if (wantsLocal) {
    skipped.push({ name: 'Local model', why: 'With 4 GB of RAM or less a local model would crawl and freeze your laptop.' + (pick === 'local' ? ' So this is an online setup instead: use the cloud agent in short sessions.' : ' Use the cloud agent in short sessions instead.') });
  } else {
    skipped.push({ name: 'Local model', why: 'Your internet and plan cover your usage, so several GB of model would be dead weight.' });
  }

  if (goal.needs.includes('gh')) {
    if (chatOnly) skipped.push({ name: 'GitHub CLI', why: 'It is for an agent to publish your work. A chat-only setup has no use for it yet.' });
    else tool('tool', 'gh', 'Lets your agent publish projects and open pull requests, which is what people reviewing your work look at.');
  }
  if (goal.needs.includes('pandoc'))
    tool('tool', 'pandoc', 'Turns the AI\'s text into Word or PDF files you can hand out or submit.');
  if (goal.needs.includes('python'))
    tool('tool', 'python', chatOnly ? 'Your goal involves data. The model can write small Python scripts for your spreadsheets, and this lets you run them.'
      : 'Your goal involves data. With Python the agent can read spreadsheets and CSV files and draw charts, instead of guessing at numbers.');

  let thirdParty = false;
  if (goal.needs.includes('skills') && agentId === 'claude' && !chatOnly) {
    if (ctx.guard.thirdparty) {
      thirdParty = true;
      add('addon', 'Superpowers skill pack', 'Community skills that make the agent plan, test and debug step by step instead of guessing. Community-made, so we flag it.', null,
        'claude plugin marketplace add obra/superpowers-marketplace; claude plugin install superpowers@superpowers-marketplace', { thirdParty: true });
    } else skipped.push({ name: 'Superpowers skill pack', why: 'You turned community add-ons off.' });
  }

  if (!chatOnly) {
    skipped.push({ name: 'A second AI subscription', why: 'It would add cost, not capability, for this goal.' });
    skipped.push({ name: 'MCP servers', why: 'None are needed on day one. Add one when you actually hit the need.' });
  }

  // workspace files
  const files = [];
  const agentCommand = chatOnly ? 'ollama run ' + lm.tag : agent.cmd;
  const firstWin = (chatOnly ? 'You cannot see or change my files, so show me every file in full and tell me where to save it. ' : '') + goal.firstWin;
  if (!chatOnly) {
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
  }
  if (agentId === 'claude' && !chatOnly) {
    const deny = [];
    if (ctx.guard.destructive) deny.push('Bash(rm -rf:*)', 'Bash(git push --force:*)', 'Bash(git reset --hard:*)');
    if (ctx.guard.secrets) deny.push('Read(./.env)', 'Read(./.env.*)', 'Read(./secrets/**)');
    const settings = { permissions: { defaultMode: ctx.mode === 'learn' ? 'default' : 'acceptEdits', deny } };
    files.push({ path: '.claude/settings.json', content: JSON.stringify(settings, null, 2) + '\n', why: 'Hard permission rules the agent cannot talk its way past.' });
  }
  files.push({ path: 'FIRST_TASK.md', content: '# Your first win\n\nOpen a terminal in this folder, run `' + agentCommand + '`, and paste this:\n\n> ' + firstWin + '\n' +
    (chatOnly ? '\nThis model only chats. It cannot create files, so save what it gives you into this folder yourself.\n' : '') +
    (brain === 'both' ? '\nNo internet, or out of quota? Run `ollama run ' + lm.tag + '` to chat with the model on your own machine.\n' : ''),
    why: 'A ready first task, so you are not staring at an empty prompt.' });

  // only keep a tip if the tool it leans on is actually in this stack
  const got = n => steps.some(s => s.name === n);
  const tips = goal.tips.filter(t => (!/pandoc/i.test(t) || got('Pandoc')) && (!/\bgh\b/.test(t) || got('GitHub CLI')));

  return { goal, os, brain, agentId: chatOnly ? 'local' : agentId, agent: chatOnly ? null : agent, agentCommand, firstWin, tips,
           steps, skipped, files, local, thirdParty,
           cost: cost(agentId, ctx, local, chatOnly), safety: safety(agentId, ctx, thirdParty, chatOnly, os) };
}

function cost(agentId, ctx, local, chatOnly) {
  const h = ctx.hours, free = agentId === 'agy';
  let level, text;
  if (chatOnly) {
    level = 'ok'; text = 'It runs on your own machine: no subscription and no daily limit. You pay once in download (' + local.size + ') and a little electricity.';
  } else if (free) {
    if (h <= 1) { level = 'ok'; text = 'The free tier has a weekly quota. About ' + h + ' h a day should fit inside it.'; }
    else if (h <= 3) { level = 'warn'; text = 'The free tier has a weekly quota, and ' + h + ' h a day will be tight. Expect to run out before the week ends.'; }
    else { level = 'bad'; text = 'At ' + h + ' h a day you will use up the free weekly quota in a few days.'; }
    if (local && h > 1) text += ' The local model covers the gap.';
  } else {
    if (h <= 3) { level = 'ok'; text = 'Your existing plan should cover about ' + h + ' h a day.'; }
    else { level = 'warn'; text = 'At ' + h + ' h a day you may hit plan limits on busy days. Fresh sessions per task stretch it further.' + (local ? ' The local model covers the gap.' : ''); }
  }
  return { newSpend: 0, level, text };
}

function safety(agentId, ctx, thirdParty, chatOnly, os) {
  const hard = agentId === 'claude';
  const source = os === 'mac' ? 'Homebrew, or the vendor\'s own installer or npm package'
    : os === 'linux' ? 'your system\'s package manager, or the installer its maker recommends'
    : 'winget, or the vendor\'s own installer or npm package';
  const checks = chatOnly ? [
    [true, 20, 'Every tool comes from its official source (' + source + ')'],
    [true, 15, 'Your prompts and files never leave your machine'],
    [true, 20, 'Nothing to block: a chat-only model cannot run commands'],
    [true, 20, 'It cannot open files, so your secrets stay unread'],
    [ctx.mode === 'learn', 10, 'You approve each install step (Learn mode)'],
    [true, 10, 'No agent has any permissions on your machine'],
    [true, 5, 'No community add-ons'],
  ] : [
    [true, 20, 'Every tool comes from its official source (' + source + ')'],
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
  return { tool: 'AgentReady', version: 2, goal: plan.goal.label, mode: ctx.mode, os: plan.os, brain: plan.brain,
           workspace: '~/AgentReady-Workspace', agentCommand: plan.agentCommand,
           steps: plan.steps.map(s => Object.assign({ name: s.name, why: s.why, check: s.check || '', run: s.run }, s.alt ? { alt: s.alt } : null, s.test ? { test: s.test } : null)),
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
    "function Update-SessionPath { $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User') + ';' + (Join-Path $env:LOCALAPPDATA 'Microsoft\\WindowsApps') + ';' + (Join-Path $env:LOCALAPPDATA 'agy\\bin') + ';' + (Join-Path $env:APPDATA 'npm') + ';' + (Join-Path $env:LOCALAPPDATA 'Programs\\Microsoft VS Code\\bin') + ';' + (Join-Path $env:LOCALAPPDATA 'Programs\\Ollama') }",
    '# Is this step already done? Either its command exists, or its own test says so.',
    'function Test-Step($s) {',
    '  if ($s.check -and (Get-Command $s.check -ErrorAction SilentlyContinue)) { return $true }',
    '  if ($s.test) { try { return [bool](Invoke-Expression $s.test) } catch { return $false } }',
    '  return $false',
    '}',
    '# Old Windows 10 builds default to a web security setting that download servers no longer accept.',
    'try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch { }',
    "Write-Host ''",
    "Write-Host ('AgentReady: ' + $plan.goal) -ForegroundColor Magenta",
    "if ($DryRun) { Write-Host 'DRY RUN: nothing will be changed.' -ForegroundColor Yellow }",
    '# winget ships with Windows 10 and 11, but on some machines it is not registered yet. Repair it before any step needs it.',
    "$needsWinget = @($plan.steps | Where-Object { $_.run -like 'winget *' -and -not (Test-Step $_) }).Count -gt 0",
    'Update-SessionPath',
    '# Everything is downloaded, so check the internet before changing anything.',
    '$todo = @($plan.steps | Where-Object { -not (Test-Step $_) }).Count',
    'if (-not $DryRun -and $todo -gt 0) {',
    "  $online = $false; try { [void][Net.Dns]::GetHostAddresses('github.com'); $online = $true } catch { }",
    '  if (-not $online) {',
    "    Write-Host 'No internet connection found. The tools have to be downloaded, so connect and run this again. Nothing was changed.' -ForegroundColor Red",
    '    exit 1',
    '  }',
    '}',
    'if ($needsWinget -and -not (Get-Command winget -ErrorAction SilentlyContinue)) {',
    "  $fix = 'Add-AppxPackage -RegisterByFamilyName -MainPackage Microsoft.DesktopAppInstaller_8wekyb3d8bbwe'",
    "  Write-Host ''",
    "  Write-Host 'winget, the Windows app installer, is not recognised on this machine.' -ForegroundColor Yellow",
    "  Write-Host ('      fix: ' + $fix)",
    "  if ($DryRun) { Write-Host '      A real run tries this fix first, and stops if it does not work.' }",
    '  else {',
    '    try { Invoke-Expression $fix } catch { Write-Host $_ -ForegroundColor Red }',
    '    Update-SessionPath',
    '    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {',
    "      Write-Host 'Still no winget. Install App Installer from the Microsoft Store (https://aka.ms/getwinget), open a new terminal and run this script again.' -ForegroundColor Red",
    "      Write-Host 'Nothing was installed.'",
    '      exit 1',
    '    }',
    "    Write-Host '      winget works now' -ForegroundColor Green",
    '  }',
    '}',
    '$log = @(); $i = 0; $total = @($plan.steps).Count',
    'foreach ($s in $plan.steps) {',
    '  $i++',
    "  Write-Host ''",
    "  Write-Host ('[{0}/{1}] {2}' -f $i, $total, $s.name) -ForegroundColor Cyan",
    "  Write-Host ('      why: ' + $s.why)",
    '  if (Test-Step $s) {',
    "    Write-Host '      already in place, skipping' -ForegroundColor Green",
    "    $log += [pscustomobject]@{ step = $s.name; status = 'present' }; continue",
    '  }',
    "  Write-Host ('      run: ' + $s.run) -ForegroundColor Yellow",
    "  if ($DryRun) { $log += [pscustomobject]@{ step = $s.name; status = 'would-run' }; continue }",
    '  if ($learnMode) {',
    "    $a = Read-Host '      Run this step? (y/n)'",
    "    if ($a -ne 'y') { Write-Host '      skipped by you'; $log += [pscustomobject]@{ step = $s.name; status = 'skipped' }; continue }",
    '  }',
    "  if ($s.run -like 'ollama pull*') {",
    '    # the download needs the Ollama service: wait for it, and start it if the installer did not',
    '    for ($n = 0; $n -lt 15; $n++) {',
    '      & ollama list *> $null',
    '      if ($LASTEXITCODE -eq 0) { break }',
    "      if ($n -eq 3) { Start-Process ollama -ArgumentList 'serve' -WindowStyle Hidden }",
    '      Start-Sleep -Seconds 2',
    '    }',
    '  }',
    '  $ok = $true; $global:LASTEXITCODE = 0',
    '  try { Invoke-Expression $s.run; if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) { $ok = $false } } catch { $ok = $false; Write-Host $_ -ForegroundColor Red }',
    '  Update-SessionPath',
    '  # winget reports an error when the app is already there or already up to date. That is a pass.',
    "  if (-not $ok -and $s.run -like 'winget *' -and @(-1978335189, -1978335135) -contains $LASTEXITCODE) { $ok = $true }",
    '  # what counts is whether the tool is there now, not what the installer said',
    '  if (-not $ok -and ($s.check -or $s.test) -and (Test-Step $s)) { $ok = $true }',
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
    "$failed = @($log | Where-Object { $_.status -eq 'failed' }).Count",
    "if ($failed -gt 0) { Write-Host ''; Write-Host ($failed.ToString() + ' step(s) failed. Fix them and run this again: finished steps are skipped.') -ForegroundColor Red; exit 1 }",
    '',
  ].join('\r\n');
}

// One script for macOS and Linux. It is plain shell with no JSON to parse, because a clean machine has no jq or Python.
function buildSh(mac, linux) {
  const q = s => "'" + String(s).replace(/'/g, "'\\''") + "'";
  const stepLine = s => '  step ' + q(s.name) + ' ' + q(s.why) + ' ' + q(s.check) + ' ' +
    (s.alt ? '"$(pm ' + PMS.map(p => q(s.alt[p])).join(' ') + ')"' : q(s.run));
  const fileBlock = f => {
    let eof = 'AGENTREADY_EOF';
    while (f.content.split('\n').includes(eof)) eof += '_';
    return ['write_file ' + q(f.path) + " <<'" + eof + "'", f.content.replace(/\n$/, ''), eof];
  };
  return [].concat([
    '#!/usr/bin/env bash',
    '# AgentReady setup script for macOS and Linux. Read it before you run it.',
    '#   Preview only:  bash agentready-setup.sh --dry-run',
    '#   Ask each step: add --learn      Run everything: add --auto',
    '',
    'GOAL=' + q(mac.goal),
    'MODE=' + q(mac.mode),
    'AGENT_CMD=' + q(mac.agentCommand),
    'WS="$HOME/AgentReady-Workspace"',
    'DRY=0',
    'for a in "$@"; do',
    '  case "$a" in',
    '    --dry-run) DRY=1 ;;',
    '    --learn) MODE=learn ;;',
    '    --auto) MODE=auto ;;',
    '    *) echo "Unknown option: $a"; exit 2 ;;',
    '  esac',
    'done',
    '',
    "if [ -t 1 ]; then C='\\033[36m'; G='\\033[32m'; Y='\\033[33m'; R='\\033[31m'; M='\\033[35m'; Z='\\033[0m'; else C=''; G=''; Y=''; R=''; M=''; Z=''; fi",
    "say() { printf '%b%s%b\\n' \"$1\" \"$2\" \"$Z\"; }",
    '',
    'case "$(uname -s)" in',
    '  Darwin) OS=mac ;;',
    '  Linux) OS=linux ;;',
    "  *) echo 'This script is for macOS and Linux. On Windows, download the .ps1 installer from AgentReady instead.'; exit 1 ;;",
    'esac',
    'if [ "$DRY" = 0 ] && [ "$(id -u)" = 0 ]; then',
    '  if [ "$OS" = mac ]; then',
    "    echo 'Run this as your normal user, not with sudo. It asks for your password only when a step needs it.'; exit 1",
    '  fi',
    '  # Linux as root (a server or a container): there may be no sudo, and none is needed.',
    '  if ! command -v sudo >/dev/null 2>&1; then sudo() { if [ "$1" = -E ]; then shift; fi; "$@"; }; fi',
    'fi',
    '',
    '# Linux: find the package manager. pm picks the matching command for a step.',
    'PM=none',
    'if [ "$OS" = linux ]; then',
    '  for p in apt-get dnf pacman zypper; do',
    '    if command -v "$p" >/dev/null 2>&1; then PM=${p%-get}; break; fi',
    '  done',
    'fi',
    'pm() {',
    '  case "$PM" in',
    "    apt) printf '%s' \"$1\" ;;",
    "    dnf) printf '%s' \"$2\" ;;",
    "    pacman) printf '%s' \"$3\" ;;",
    "    zypper) printf '%s' \"$4\" ;;",
    '  esac',
    '}',
    '',
    '# Make tools installed a moment ago visible to the rest of this run.',
    'refresh_path() {',
    '  for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do',
    '    if [ -x "$b" ]; then eval "$("$b" shellenv)"; fi',
    '  done',
    '  if [ -d "$HOME/.local/bin" ]; then',
    '    case ":$PATH:" in *":$HOME/.local/bin:"*) ;; *) PATH="$HOME/.local/bin:$PATH" ;; esac',
    '  fi',
    '  hash -r 2>/dev/null',
    '}',
    '',
    '# Is a tool really there? macOS ships placeholder git and python3 that only work once the',
    '# developer tools are installed, and an old Node.js cannot run the agents.',
    'have() {',
    '  command -v "$1" >/dev/null 2>&1 || return 1',
    '  if [ "$OS" = mac ] && [ "$(command -v "$1")" = "/usr/bin/$1" ]; then',
    '    case "$1" in git|python3) xcode-select -p >/dev/null 2>&1 || return 1 ;; esac',
    '  fi',
    '  if [ "$1" = node ]; then',
    "    node -e 'process.exit(+process.versions.node.split(\".\")[0] >= 20 ? 0 : 1)' 2>/dev/null || return 1",
    '  fi',
    '  return 0',
    '}',
    '',
    '# If npm keeps its tools in a system folder, installing them would need sudo. Use ~/.local instead.',
    'NPM_MOVED=0',
    'npm_prefix() {',
    '  p=$(npm config get prefix 2>/dev/null) || return 0',
    '  if [ -w "$p" ]; then return 0; fi',
    '  echo "      npm keeps tools in $p, which needs admin rights, so they go in ~/.local instead"',
    '  mkdir -p "$HOME/.local/bin"',
    '  npm config set prefix "$HOME/.local"',
    '  NPM_MOVED=1',
    '  refresh_path',
    '}',
    '',
    '# The model download needs the Ollama service to be up. Wait for it, and start it if nothing else did.',
    'ollama_up() {',
    '  n=0',
    '  while [ "$n" -lt 15 ]; do',
    '    if ollama list >/dev/null 2>&1; then return 0; fi',
    '    if [ "$n" = 3 ]; then (ollama serve >/dev/null 2>&1 &); fi',
    '    n=$((n + 1)); sleep 2',
    '  done',
    '}',
    '',
    "LOG=''",
    'note() { LOG="$LOG${LOG:+,}{\\"step\\":\\"$1\\",\\"status\\":\\"$2\\"}"; }',
    '',
    'I=0',
    'FAILED=0',
    'APT_FRESH=0',
    'step() {  # name, why, command to check for, install command',
    '  I=$((I + 1)); name=$1; why=$2; check=$3; run=$4',
    "  echo ''",
    '  say "$C" "[$I/$TOTAL] $name"',
    '  echo "      why: $why"',
    '  if [ -n "$check" ] && have "$check"; then',
    "    say \"$G\" '      already installed, skipping'; note \"$name\" present; return 0",
    '  fi',
    '  if [ -z "$run" ]; then',
    "    say \"$Y\" '      I do not know the package manager on this system. Install this by hand, then run the script again.'",
    '    note "$name" manual; return 0',
    '  fi',
    '  say "$Y" "      run: $run"',
    '  if [ "$DRY" = 1 ]; then note "$name" would-run; return 0; fi',
    '  if [ "$MODE" = learn ]; then',
    "    printf '      Run this step? (y/n) '; read -r a",
    "    if [ \"$a\" != y ]; then echo '      skipped by you'; note \"$name\" skipped; return 0; fi",
    '  fi',
    '  case "$run" in',
    "    *'apt-get install'*)",
    "      if [ \"$APT_FRESH\" = 0 ]; then echo '      first, refresh the package list: sudo apt-get update'; sudo apt-get update; APT_FRESH=1; fi ;;",
    "    'npm install -g'*) npm_prefix ;;",
    "    'ollama pull'*) ollama_up ;;",
    '  esac',
    '  ok=1; eval "$run" || ok=0',
    '  refresh_path',
    '  # what counts is whether the tool is there now, not what the installer said',
    '  if [ "$ok" = 0 ] && [ -n "$check" ] && have "$check"; then ok=1; fi',
    '  if [ "$ok" = 1 ]; then',
    "    say \"$G\" '      done'; note \"$name\" installed",
    '  else',
    "    say \"$R\" '      FAILED: later steps may need this. Fix it and run the script again; finished steps are skipped.'",
    '    note "$name" failed; FAILED=$((FAILED + 1))',
    '  fi',
    '}',
    '',
    'write_file() {  # path inside the workspace; the content arrives on standard input',
    '  if [ -e "$WS/$1" ]; then echo "      keep  $1 (exists, not overwritten)"; cat >/dev/null; return 0; fi',
    '  echo "      write $1"',
    '  if [ "$DRY" = 1 ]; then cat >/dev/null; return 0; fi',
    '  mkdir -p "$(dirname "$WS/$1")"',
    '  cat > "$WS/$1"',
    '}',
    '',
    "echo ''",
    'say "$M" "AgentReady: $GOAL"',
    "if [ \"$DRY\" = 1 ]; then say \"$Y\" 'DRY RUN: nothing will be changed.'; fi",
    'refresh_path',
    '# Everything is downloaded, so check the internet before changing anything.',
    'if [ "$DRY" = 0 ] && command -v curl >/dev/null 2>&1 && ! curl -fsS -m 15 -o /dev/null https://github.com; then',
    "  say \"$R\" 'No internet connection found. The tools have to be downloaded, so connect and run this again. Nothing was changed.'",
    '  exit 1',
    'fi',
    '',
    'if [ "$OS" = mac ]; then',
    '  TOTAL=' + mac.steps.length,
  ], mac.steps.map(stepLine), [
    'else',
    '  TOTAL=' + linux.steps.length,
  ], linux.steps.map(stepLine), [
    'fi',
    '',
    "echo ''",
    'say "$C" "Workspace: $WS"',
  ], ...mac.files.map(fileBlock), [
    '',
    'if [ "$DRY" = 0 ]; then',
    '  mkdir -p "$HOME/.agentready"',
    "  printf '[%s]\\n' \"$LOG\" > \"$HOME/.agentready/last-run.json\"",
    "  echo ''",
    "  say \"$M\" 'Next: open a NEW terminal, then run:'",
    '  echo "  cd \\"$WS\\""',
    '  echo "  $AGENT_CMD"',
    "  echo '  ...and paste the prompt from FIRST_TASK.md'",
    '  if [ "$NPM_MOVED" = 1 ]; then',
    "    echo ''",
    "    echo 'If the new terminal cannot find the agent, add this line to ~/.bashrc or ~/.zshrc and open another:'",
    "    echo '  export PATH=\"$HOME/.local/bin:$PATH\"'",
    '  fi',
    '  if [ "$FAILED" -gt 0 ]; then',
    "    echo ''",
    '    say "$R" "$FAILED step(s) failed. Fix them and run this again: finished steps are skipped."',
    '    exit 1',
    '  fi',
    'fi',
    '',
  ]).join('\n');
}

// Windows blocks double-clicked .ps1 files by default ("running scripts is disabled"), and the window closes before
// anyone can read why. So the download is a .cmd: a few lines of batch that show a menu, then run the PowerShell
// script that follows them in the same file. Still one file, still readable top to bottom.
function buildCmd(ps1) {
  return [
    '@echo off',
    'rem AgentReady setup for Windows. Read it before you run it: the PowerShell script starts at the marker line below.',
    'rem Double-click this file for a menu, or run it from a terminal:  agentready-setup.cmd -DryRun   (or -Learn, or -Auto)',
    'setlocal',
    'title AgentReady setup',
    'set "AR_SELF=%~f0"',
    'set "AR_PS1=%TEMP%\\agentready-setup-%RANDOM%.ps1"',
    'set "AR_ARGS=%*"',
    'set "AR_CODE=0"',
    'powershell -NoProfile -ExecutionPolicy Bypass -Command "$t = [IO.File]::ReadAllText($env:AR_SELF); $i = $t.IndexOf([char]35 + \'AGENTREADY-POWERSHELL-PART\'); [IO.File]::WriteAllText($env:AR_PS1, $t.Substring($i), (New-Object Text.UTF8Encoding($true)))"',
    'if not exist "%AR_PS1%" (echo Could not start PowerShell. Nothing was changed. & goto end)',
    'if not "%~1"=="" goto run',
    ':menu',
    'echo.',
    'echo   AgentReady setup',
    'echo.',
    'echo   1. Preview only: show every step, change nothing',
    'echo   2. Install, asking me before each step',
    'echo   3. Install everything',
    'echo   4. Quit',
    'echo.',
    'choice /c 1234 /n /m "Type 1, 2, 3 or 4: "',
    'if errorlevel 4 goto end',
    'set "AR_ARGS=-DryRun"',
    'if errorlevel 2 set "AR_ARGS=-Learn"',
    'if errorlevel 3 set "AR_ARGS=-Auto"',
    'powershell -NoProfile -ExecutionPolicy Bypass -File "%AR_PS1%" %AR_ARGS%',
    'goto menu',
    ':run',
    'powershell -NoProfile -ExecutionPolicy Bypass -File "%AR_PS1%" %AR_ARGS%',
    'set "AR_CODE=%ERRORLEVEL%"',
    ':end',
    'del "%AR_PS1%" >nul 2>&1',
    'echo.',
    'if "%~1"=="" pause',
    'exit /b %AR_CODE%',
    '',
    '#AGENTREADY-POWERSHELL-PART',
    ps1.split('\r\n').slice(3).join('\r\n'),
  ].join('\r\n');
}

// The right installer for an operating system: a double-clickable .cmd on Windows, one shell script for macOS and Linux.
// A setup name becomes part of the file name, so several downloads do not all end up as "agentready-setup (3)".
function fileBase(name) {
  const slug = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return 'agentready-' + (slug || 'setup');
}

function buildInstaller(ctx, os, name) {
  const man = o => buildManifest(recommend(Object.assign({}, ctx, { os: o })), ctx);
  const win = os === 'windows', file = fileBase(name) + (win ? '.cmd' : '.sh');
  const text = win ? buildCmd(buildPs1(man('windows'))) : buildSh(man('mac'), man('linux'));
  return { name: file, flag: win ? '-DryRun' : '--dry-run',
           text: text.split(win ? 'agentready-setup.cmd' : 'agentready-setup.sh').join(file),
           runline: win ? '.\\' + file + ' -DryRun' : 'bash ' + file + ' --dry-run' };
}

if (typeof module !== 'undefined') module.exports = { GOALS, understand, localModel, recommend, buildManifest, buildPs1, buildCmd, buildSh, fileBase, buildInstaller };

// ---------- UI ----------
if (typeof document !== 'undefined') (function () {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const S = { step: 0, skill: 'new', subs: [], mode: 'learn', brain: 'auto' };

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
    if (mem) { $('#ram').value = mem >= 32 ? '32' : mem >= 16 ? '16' : mem >= 8 ? '8' : '4'; bits.push('at least ' + mem + ' GB RAM (browsers report 8 at most, so raise it if you have more)'); }
    else $('#ram').value = '8';
    if (navigator.hardwareConcurrency) bits.push(navigator.hardwareConcurrency + ' CPU threads');
    const c = navigator.connection;
    if (c && (c.saveData || /2g|3g/.test(c.effectiveType || ''))) { $('#net').value = 'patchy'; bits.push('a slow or metered connection'); }
    // graphics: the browser gives a name but never the memory size, and on laptops it often names only the built-in chip
    try {
      const gl = document.createElement('canvas').getContext('webgl');
      const name = gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL) || '';
      const short = (name.match(/(NVIDIA [^,()]+|GeForce [^,()]+|Radeon [^,()]+|Intel[^,()]+|Apple M\d[^,()]*)/) || [''])[0].replace(/ Direct3D.*| OpenGL.*/, '').trim();
      if (/Apple M\d/.test(name) || (os === 'mac' && /Apple/.test(name))) $('#gpu').value = 'apple';
      else if (/NVIDIA|GeForce|Radeon RX|Arc\b/.test(name)) $('#gpu').value = '4';
      if (short) bits.push(short + ' graphics (I cannot read its memory, so check the size)');
    } catch (e) { /* no WebGL: the user picks */ }
    $('#detected').textContent = bits.length ? 'I sniffed out: ' + bits.join(', ') + '. Correct anything that is wrong.' : 'I could not detect your machine from the browser, so please fill this in.';
  })();
  const hoursOut = () => { const h = +$('#hours').value; $('#hours-out').textContent = h + (h === 1 ? ' hour' : ' hours'); };
  $('#hours').addEventListener('input', hoursOut); hoursOut();

  function ctx() {
    return { goalText: goalEl.value.trim(), skill: S.skill, subs: S.subs, mode: S.mode,
             os: $('#os').value, ram: +$('#ram').value, gpu: $('#gpu').value, net: $('#net').value, hours: +$('#hours').value,
             brain: S.brain,
             guard: { destructive: $('#g-destructive').checked, secrets: $('#g-secrets').checked, thirdparty: $('#g-thirdparty').checked } };
  }

  // models step: say what this machine can carry, and what the chosen option means
  const BRAIN_NOTES = {
    auto: 'I will use online models, and add an offline one only when your internet or free tier cannot carry you.',
    cloud: 'Rented models are the smartest and take no disk space. They need internet, and plans have daily limits.',
    local: 'Private, free and unlimited once downloaded. Local models are smaller and weaker, and offline you chat with the model: it does not run tools for you.',
    both: 'An online agent for the real work, plus a model on your own machine for when the internet or your quota runs out.',
  };
  function brainHint() {
    const lm = localModel(+$('#ram').value, $('#gpu').value);
    $('#brain-hint').textContent = BRAIN_NOTES[S.brain] + ' ' + (lm
      ? 'This machine can carry ' + lm.tag + ' (about ' + lm.size + ' to download). ' + lm.speedText
      : 'With 4 GB of RAM or less this machine cannot carry a local model, so the setup stays online whatever you pick.');
  }
  $('.chips[data-group="brain"]').addEventListener('click', brainHint);

  // navigation
  const LAST = 5;
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
    if (n === 3) brainHint();
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
    const win = c.os === 'windows', tips = plan.tips;
    const pack = () => ({ inst: buildInstaller(c, win ? 'windows' : 'mac', S.setupName), other: buildInstaller(c, win ? 'mac' : 'windows', S.setupName) });
    const inst = pack().inst;
    const where = { cloud: 'Runs on online models.', both: 'Runs on online models, with an offline model as backup.', local: 'Runs offline, on your own machine.' }[plan.brain];
    $('#result').innerHTML =
      '<p class="verdict">' + plan.steps.length + ' things to set up. ' + plan.skipped.length + ' left out on purpose.</p>' +
      '<p class="note">For: <b>' + esc(man.goal) + '</b><br>' + esc(plan.goal.read) + ' ' + where + '</p>' +
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
      '<div class="card firstwin"><h4>Your first win, ready to paste</h4><blockquote>' + esc(plan.firstWin) + '</blockquote></div>' +
      '<div class="card tips"><h4>After your first win</h4><ol>' + tips.map(t => '<li>' + esc(t) + '</li>').join('') + '</ol></div>' +
      '<label class="setup-name">Setup name <span>(optional: it goes in the file name, so your downloads are easy to tell apart)</span>' +
        '<input type="text" id="setup-name" maxlength="40" autocomplete="off" spellcheck="false" placeholder="Anything works, e.g. college laptop" value="' + esc(S.setupName || '') + '"></label>' +
      '<div class="actions">' +
        '<button class="btn" id="dl-main">Download installer for ' + (win ? 'Windows (.cmd)' : c.os === 'mac' ? 'macOS (.sh)' : 'Linux (.sh)') + '</button>' +
        '<button class="btn ghost" id="preview">Preview dry run</button>' +
        '<button class="btn ghost" id="dl-other">' + (win ? 'macOS and Linux version (.sh)' : 'Windows version (.cmd)') + '</button>' +
        '<button class="btn ghost" id="dl-json">Download manifest (.json)</button></div>' +
      '<div class="runline" id="runline">' + esc(inst.runline) + '</div>' +
      '<p class="note">' + (win ? 'Easiest: double-click the downloaded file and type 1 for a preview that changes nothing. Windows may ask "Are you sure you want to run this?" because it came from the internet. Or run the line above in a terminal from your Downloads folder; drop <code>' + inst.flag + '</code> to install.'
          : 'Run that first from your Downloads folder to see every step without changing anything. Drop <code>' + inst.flag + '</code> to install.') +
        (win ? '' : ' The same file works on macOS and Linux: it uses Homebrew on a Mac, and apt, dnf, pacman or zypper on Linux.') + '</p>' +
      '<div class="term" id="term" hidden></div>';
    requestAnimationFrame(() => requestAnimationFrame(() => { const r = $('.ring'); if (r) r.style.setProperty('--v', sc); }));
    $('#setup-name').oninput = e => { S.setupName = e.target.value; $('#runline').textContent = pack().inst.runline; };
    $('#dl-main').onclick = () => { const i = pack().inst; download(i.name, i.text); };
    $('#dl-other').onclick = () => { const i = pack().other; download(i.name, i.text); };
    $('#dl-json').onclick = () => download(fileBase(S.setupName) + '.json', JSON.stringify(man, null, 2));
    $('#preview').onclick = () => {
      const t = $('#term'), n = man.steps.length;
      t.hidden = false;
      t.innerHTML = '<span class="y">DRY RUN: nothing will be changed.</span>\n' +
        man.steps.map((s, i) => '\n<span class="g">[' + (i + 1) + '/' + n + '] ' + esc(s.name) + '</span>\n<span class="c">      why: ' + esc(s.why) + '</span>\n' +
          (s.check ? '<span class="c">      skip if "' + esc(s.check) + '" is already installed</span>\n' : '') + '      run: ' + esc(s.run) +
          (s.alt ? '\n<span class="c">      (shown for Ubuntu and Debian; on Fedora, Arch or openSUSE the script uses dnf, pacman or zypper)</span>' : '')).join('\n') +
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
