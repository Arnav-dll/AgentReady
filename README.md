<div align="center">

# 🐶 AgentReady

### Why is setting up AI harder than *using* it?

**Tell it your goal. It looks at your laptop and your budget, then builds the smallest safe AI agent setup that gets you there, in one script you can read before you run.**

![status](https://img.shields.io/badge/status-hackathon%20MVP-7a3cff)
![stack](https://img.shields.io/badge/stack-HTML%20%C2%B7%20CSS%20%C2%B7%20vanilla%20JS-0a66ff)
![build](https://img.shields.io/badge/build%20step-none-0f9d6b)
![privacy](https://img.shields.io/badge/data%20sent-zero-0f9d6b)
![license](https://img.shields.io/badge/license-MIT-0f9d6b)
![platform](https://img.shields.io/badge/installer-Windows%20first-444b5e)

![AgentReady landing page](docs/hero.png)

</div>

---

## The problem

Powerful AI agents exist. Most people still can't use them, because the hard part comes *before* the first prompt.

| The itch | Who it hurts |
|---|---|
| Why do I need to know what an MCP server is before I can get help with homework? | Students, first-timers |
| Why can't I tell which AI tool my existing subscription already covers? | Anyone paying for AI |
| Why does every setup guide assume 32 GB of RAM and fast Wi-Fi? | Budget laptops, small towns |
| Why does an agent get the run of my files by default? | Everyone |
| Why is every tutorial out of date within a month? | Self-learners |
| Why am I staring at an empty prompt after installing? | Teachers, non-coders |

**Our problem statement:** close the gap between a normal person and using AI agents for jobs, projects, assignments and internships.

## What AgentReady does

- **Goal first.** You say *"land a backend internship"* or *"grade 60 papers by Friday"*, not which tool you want.
- **Fits your machine and wallet.** It uses the subscription you already have, and adds a small local model only when your internet or free tier can't carry you.
- **Minimum stack.** Every item comes with a reason. It also lists what it left out, and why.
- **Safe by default.** Guardrail rules, a dry run and a safety score before anything touches your laptop.
- **A first win.** A ready-to-paste first task for your goal, so you never face an empty prompt.
- **A pup, not a popup.** A small companion in the corner gives one tip at a time, fades on its own, and can be told to shh.

## How it works

```mermaid
flowchart TD
    A([You state a goal]) --> B{Goal matcher}
    B -->|career| G1[Internship or job]
    B -->|study| G2[Assignments and learning]
    B -->|teach| G3[Teaching and grading]
    B -->|automate| G4[Dev automation]
    B -->|research| G5[Research and writing]
    G1 & G2 & G3 & G4 & G5 --> C[Capabilities needed]

    D([What you already pay for]) --> R
    E([Machine: OS, RAM, internet, daily use]) --> R
    F([Mode and guardrails]) --> R
    C --> R{{Recommender}}

    R --> S[Minimal stack with a reason per item]
    R --> K[Left out on purpose]
    R --> SC[Safety score]
    R --> CO[Cost estimate]

    S --> M[(Manifest JSON)]
    M --> P[Dry-run preview in the page]
    M --> I[Installer script .ps1]
    I --> W[Workspace: rules file, guardrails, first task]
    W --> Z([Your first win])
```

## How the stack gets picked

The recommender is a small set of readable rules. No black box.

```mermaid
flowchart TD
    Q1{Paying for Claude?} -->|yes| CC[Claude Code]
    Q1 -->|no| Q2{Paying for ChatGPT?}
    Q2 -->|yes| CX[Codex CLI]
    Q2 -->|no| GM[Gemini CLI on the free tier]

    CC & CX & GM --> Q3{Patchy internet, or heavy use on a free tier?}
    Q3 -->|no| NL[Skip the local model: dead weight]
    Q3 -->|yes| Q4{RAM}
    Q4 -->|4 GB or less| SK[Skip: it would freeze the laptop]
    Q4 -->|8 GB| L1[Ollama + 1.5b model]
    Q4 -->|16 GB| L2[Ollama + 7b model]
    Q4 -->|32 GB or more| L3[Ollama + 14b model]

    NL & SK & L1 & L2 & L3 --> Q5{Terminal comfort}
    Q5 -->|new or some| VS[Add VS Code]
    Q5 -->|pro| NV[Keep your own editor]
```

## What the installer does

```mermaid
sequenceDiagram
    actor U as You
    participant W as AgentReady page
    participant S as setup.ps1
    participant PC as Your laptop

    U->>W: Goal, subscriptions, machine, guardrails
    W->>W: Recommend, score, estimate (all in the browser)
    W-->>U: Stack, reasons, dry-run preview
    U->>W: Download installer
    U->>S: Run with -DryRun
    S-->>U: Every step and file, nothing changed
    U->>S: Run for real (Learn or Auto)
    loop each step
        S->>PC: Already installed?
        alt present
            S-->>U: Skip
        else missing
            opt Learn mode
                S->>U: Run this step? (y/n)
            end
            S->>PC: Install from the official source
        end
    end
    S->>PC: Write workspace, rules, guardrails, first task
    S-->>U: Next: open the workspace and paste FIRST_TASK.md
```

## Tech stack

```mermaid
flowchart LR
    subgraph Browser["Runs entirely in your browser"]
        UI["index.html + styles.css<br/>liquid-glass UI, no framework"]
        LOGIC["app.js<br/>goal matcher · recommender<br/>safety score · cost estimate"]
        GEN["Manifest + PowerShell generator"]
        PUP["Companion pup<br/>inline SVG + CSS animation"]
        UI --> LOGIC --> GEN
        LOGIC --> PUP
    end

    subgraph Output["What you download"]
        JSON[("agentready-setup.json")]
        PS1["agentready-setup.ps1"]
    end

    subgraph Laptop["Installed on your laptop"]
        WG["winget<br/>Git · Node.js · VS Code · GitHub CLI · Pandoc · Ollama"]
        NPM["npm<br/>Claude Code · Codex CLI · Gemini CLI"]
        WS["~/AgentReady-Workspace<br/>rules file · .claude/settings.json · FIRST_TASK.md"]
    end

    GEN --> JSON
    GEN --> PS1
    PS1 --> WG
    PS1 --> NPM
    PS1 --> WS
```

| Layer | Choice | Why |
|---|---|---|
| UI | HTML, CSS, vanilla JS | No build step. Open the file and it works, even offline |
| Look | `backdrop-filter` glass over a soft colour field | Apple-style liquid glass, with a reduced-motion fallback |
| Logic | Plain rule functions in `app.js` | Easy to read, easy to test in Node |
| Installer | Generated PowerShell | Nothing to trust but a script you can read |
| Packages | winget and vendor npm packages | Official sources only |
| Local AI | Ollama, model sized to RAM | Keeps low-spec and offline users working |

## The pup

```mermaid
stateDiagram-v2
    [*] --> Quiet
    Quiet --> Tip: new wizard step, at most one every 20 s
    Quiet --> Tip: you tap the pup
    Tip --> Quiet: fades after 9 s
    Tip --> Tip: Another tip
    Tip --> Snoozed: Shh for 10 min
    Snoozed --> Tip: you tap the pup
    Snoozed --> Quiet: 10 min pass
```

It never opens a modal, never takes focus, and only the pup itself accepts clicks.

## Safety score

| Check | Points |
|---|---|
| Every tool comes from its official source | 20 |
| The agent works in its own folder | 15 |
| Destructive commands blocked | 20 |
| Secret files off limits | 20 |
| You approve each step (Learn mode) | 10 |
| Rules enforced by the agent's permission system | 10 |
| No community add-ons | 5 |

This is a check of the chosen settings, not a penetration test.

## Try it

```bash
git clone https://github.com/Arnav-dll/AgentReady.git
cd AgentReady
# open index.html in a browser. That's it.
```

After the wizard, from the folder where the script downloaded:

```powershell
# See every step. Changes nothing.
powershell -ExecutionPolicy Bypass -File .\agentready-setup.ps1 -DryRun

# Install, asking before each step
powershell -ExecutionPolicy Bypass -File .\agentready-setup.ps1 -Learn

# Install everything
powershell -ExecutionPolicy Bypass -File .\agentready-setup.ps1 -Auto
```

Tools that are already installed are skipped, and existing workspace files are never overwritten.

## Project layout

```text
AgentReady/
├── index.html      # landing page, wizard and pup markup
├── styles.css      # liquid-glass design system
├── app.js          # goals, recommender, scoring, script generator, pup
└── docs/
    └── hero.png
```

## Honest limits

- The goal matcher and recommender are **rule-based**, not an ML model.
- The installer script is **Windows only**. macOS and Linux users get the manifest as a checklist.
- The pup lives **inside the page**. A desktop companion is on the roadmap.
- The cost figure is a **rough estimate**. Provider limits change.
- The community skill pack step is **untested end to end**.

## Roadmap

```mermaid
flowchart LR
    N["Now<br/>rule-based wizard<br/>Windows installer<br/>in-page pup"] --> A["Next<br/>LLM goal understanding<br/>macOS and Linux scripts"]
    A --> B["Then<br/>desktop pup that notices<br/>what you do by hand"]
    B --> C["Later<br/>sandbox-tested catalog<br/>post-install red-team check"]
```

## Team

| | Role |
|---|---|
| [@Arnav-dll](https://github.com/Arnav-dll) | Creator and repo owner |
| [@DhruvJoshi-GIT](https://github.com/DhruvJoshi-GIT) | Collaborator |

## License

[MIT](LICENSE)

## Credits

Built for the IIIT hackathon open track.
