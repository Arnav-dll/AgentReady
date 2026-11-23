<div align="center">

# AgentReady

### Why is setting up AI harder than *using* it?

**Tell it your goal. It looks at your laptop and your budget, then builds the smallest safe AI agent setup that gets you there, in one script you can read before you run.**

![status](https://img.shields.io/badge/status-hackathon%20MVP-7a3cff)
![stack](https://img.shields.io/badge/stack-HTML%20%C2%B7%20CSS%20%C2%B7%20vanilla%20JS-0a66ff)
![build](https://img.shields.io/badge/build%20step-none-0f9d6b)
![privacy](https://img.shields.io/badge/data%20sent-zero-0f9d6b)
![license](https://img.shields.io/badge/license-MIT-0f9d6b)
![platform](https://img.shields.io/badge/installer-Windows%20%C2%B7%20macOS%20%C2%B7%20Linux-444b5e)

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

- **Goal first, in any words.** You say *"land a backend internship"*, *"grade 60 papers by Friday"* or *"keep my shop's accounts in a spreadsheet"*, not which tool you want. Nothing is rejected: a goal it does not recognise still gets a general setup built around your exact words.
- **Fits your machine and wallet.** It uses the subscription you already have, and asks about RAM and graphics card so a local model is sized to what the laptop can carry.
- **Online, offline or both.** You choose rented online models, a model on your own machine, or an online agent with an offline backup. "Decide for me" adds a local model only when your internet or free tier can't carry you.
- **Minimum stack.** Every item comes with a reason. It also lists what it left out, and why.
- **Safe by default.** Guardrail rules, a dry run and a safety score before anything touches your laptop.
- **A first win.** A ready-to-paste first task for your goal, so you never face an empty prompt, plus three tips for what to ask next.

## How it works

```mermaid
flowchart TD
    A([You state a goal, in any words]) --> B{Goal reader}
    B -->|what the words imply| C[Capabilities needed:<br/>code, sharing work, documents, data]
    B -->|closest of 5 archetypes, if any| T[First task and tips]
    B -->|nothing recognised| G[General setup,<br/>your words become the first task]
    G --> C

    D([What you already pay for]) --> R
    E([Machine: OS, RAM, GPU, internet, daily use]) --> R
    H([Models: online, offline or both]) --> R
    F([Mode and guardrails]) --> R
    C --> R{{Recommender}}
    T --> W

    R --> S[Minimal stack with a reason per item]
    R --> K[Left out on purpose]
    R --> SC[Safety score]
    R --> CO[Cost estimate]

    S --> M[(Manifest JSON)]
    M --> P[Dry-run preview in the page]
    M --> I[Installer script:<br/>.ps1 on Windows, .sh on macOS and Linux]
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
    Q2 -->|no| GM[Antigravity CLI on the free tier]

    CC & CX & GM --> Q3{Local model wanted?<br/>You chose offline or both, or on "decide for me":<br/>patchy internet, or heavy use on a free tier}
    Q3 -->|no| NL[Skip the local model: dead weight]
    Q3 -->|yes| Q4{RAM and graphics card}
    Q4 -->|4 GB RAM or less| SK[Skip: it would freeze the laptop]
    Q4 -->|8 GB RAM| L1[Ollama + 1.5b model<br/>3b with a 4 GB card]
    Q4 -->|16 GB RAM, or an 8 GB card| L2[Ollama + 7b model]
    Q4 -->|32 GB RAM, or 16 GB RAM with a 12 GB card| L3[Ollama + 14b model]

    NL & SK & L1 & L2 & L3 --> Q5{Terminal comfort}
    Q5 -->|new or some| VS[Add VS Code]
    Q5 -->|pro| NV[Keep your own editor]

    VS & NV --> Q6{What the goal's words imply}
    Q6 -->|code| T1[Git]
    Q6 -->|sharing work, dev work| T2[Git + GitHub CLI]
    Q6 -->|documents| T3[Pandoc]
    Q6 -->|data| T4[Python]
    Q6 -->|nothing recognised| T5[Git, as an undo net]
```

"Offline" is a chat-only setup: Ollama and a model, with no agent, because small local models are not yet reliable at running tools.

## What the installer does

The page gives you the script for your system: `agentready-setup.ps1` on Windows, and one `agentready-setup.sh` that works on both macOS (Homebrew) and Linux (apt, dnf, pacman or zypper, found when it runs). The flow is the same on all three.

```mermaid
sequenceDiagram
    actor U as You
    participant W as AgentReady page
    participant S as setup script
    participant PC as Your laptop

    U->>W: Goal, subscriptions, machine, guardrails
    W->>W: Recommend, score, estimate (all in the browser)
    W-->>U: Stack, reasons, dry-run preview
    U->>W: Download installer
    U->>S: Run as a dry run
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
        UI["index.html + styles.css<br/>matte paper UI, no framework"]
        LOGIC["app.js<br/>goal reader · recommender<br/>safety score · cost estimate"]
        GEN["Manifest + PowerShell generator"]
        UI --> LOGIC --> GEN
    end

    subgraph Output["What you download"]
        JSON[("agentready-setup.json")]
        PS1["agentready-setup.ps1 (Windows)<br/>agentready-setup.sh (macOS, Linux)"]
    end

    subgraph Laptop["Installed on your laptop"]
        WG["winget, Homebrew or the Linux package manager<br/>Git · Node.js · VS Code · GitHub CLI · Pandoc · Python · Ollama"]
        NPM["npm or the vendor's installer<br/>Claude Code · Codex CLI · Antigravity CLI"]
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
| Look | Flat matte surfaces with an inline SVG paper grain over a soft colour field | No images or fonts to download; cheap to paint on a budget laptop |
| Motion | CSS transitions on `transform` and `opacity`, one `IntersectionObserver` | Stays smooth on weak hardware; reduced-motion keeps the fades and drops the movement |
| Logic | Plain rule functions in `app.js` | Easy to read, easy to test in Node |
| Installer | Generated PowerShell (Windows) and plain shell (macOS, Linux) | Nothing to trust but a script you can read. The shell script needs no jq or Python |
| Packages | winget, Homebrew, apt / dnf / pacman / zypper, vendor installers and npm packages | Official sources only |
| Free agent | Antigravity CLI (`agy`) | Gemini CLI stopped serving free personal accounts on 18 June 2026 |
| Local AI | Ollama, model sized to RAM and graphics memory | Keeps low-spec and offline users working |

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

On macOS or Linux:

```bash
bash agentready-setup.sh --dry-run   # see every step, changes nothing
bash agentready-setup.sh --learn     # ask before each step
bash agentready-setup.sh --auto      # install everything
```

Tools that are already installed are skipped, and existing workspace files are never overwritten. If `winget` is not recognised on a Windows machine, the script re-registers App Installer first, and stops with instructions if that does not work.

## Project layout

```text
AgentReady/
├── index.html      # landing page and wizard
├── styles.css      # matte paper design system and motion
├── app.js          # goal reader, recommender, scoring, script generator
└── docs/
    └── hero.png
```

## Honest limits

- The goal reader and recommender are **rule-based**, not an ML model. Any goal is accepted, but the reader only recognises English keywords: a goal in another language, or one outside code, documents and data, gets the general setup with your words passed to the agent.
- The macOS and Linux script has **never run on a real Mac or Linux machine**. It was checked on Windows in Git Bash with the system faked: syntax, dry runs, and a real run against stub commands. Linux covers apt, dnf, pacman and zypper only, and VS Code on Linux needs snap.
- **Offline mode is chat-only.** No agent is installed, so the model cannot create files or run tools.
- The local model is always a Qwen coder model, also for goals that are not about code.
- The cost figure is a **rough estimate**. Provider limits change.
- The community skill pack step is **untested end to end**, and no full install has been run on a clean machine: the Windows script has only been verified with `-DryRun`, and the winget repair only as a simulated dry run.

## Roadmap

```mermaid
flowchart LR
    N["Now<br/>rule-based wizard, any goal<br/>Windows, macOS and Linux installers"] --> A["Next<br/>LLM goal understanding<br/>installers tested on clean machines"]
    A --> B["Then<br/>desktop companion that notices<br/>what you do by hand"]
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
