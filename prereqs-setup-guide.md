# Prerequisites Setup Guide

Follow these steps in order. Check first — if the command prints a version, skip to the next step.

---

## Step 1 — Git

```bash
git --version
```

If not installed:

| macOS | Windows | Linux |
|---|---|---|
| `brew install git` | `winget install Git.Git` | `sudo apt install git` |

---

## Step 2 — Python 3.13

```bash
python3.13 --version
```

If not installed:

| macOS | Windows | Linux |
|---|---|---|
| `brew install python@3.13` | Download from [python.org/downloads](https://www.python.org/downloads/) — check **"Add Python to PATH"** | `sudo apt install python3.13 python3.13-venv python3.13-pip` |

---

## Step 3 — Node.js 20+

```bash
node --version && npm --version
```

If not installed:

| macOS / Linux | Windows |
|---|---|
| `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh \| bash` then `nvm install 20 && nvm use 20` | `winget install OpenJS.NodeJS.LTS` |

---

## Step 4 — Docker Desktop

```bash
docker --version
```

If not installed, download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/). Once installed, open Docker Desktop and keep it running.

> **Linux:** Docker Engine works fine without Docker Desktop.

---

## Step 5 — GitHub account

Sign up at [github.com](https://github.com) if you don't have one, then:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

---

## Step 6 — Gemini API key

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with any Google account
3. Click **Create API key** and copy it

---

## Step 7 — Clone the repo and install dependencies

```bash
git clone <repo-url>
cd <project-folder>
cp .env.example .env
```

Open `.env` and paste your key:
```
GEMINI_API_KEY=your_key_here
```

**Backend:**
```bash
cd backend
python3.13 -m venv venv
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows
pip install -r requirements.txt
```

**Frontend:**
```bash
cd ../frontend && npm install
```

---

## Final check

```bash
git --version && python3.13 --version && node --version && npm --version && docker --version
```

All five print versions? You're ready.
