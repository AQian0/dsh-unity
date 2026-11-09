# Install the CLI (if not already installed)

First check if the CLI is available:

```bash
which unity && unity --version
```

If not found, install it:

**macOS / Linux**
```bash
curl -fsSL https://unity.com/install.sh | bash
```

**Windows (PowerShell)**
```powershell
irm https://unity.com/install.ps1 | iex
```

After installing, open a new shell so `unity` is on PATH, then verify with `unity --version`. If the install script fails or the binary is still not found, tell the user and stop; if the command itself fails with a permissions error or crash, the installation may be broken — suggest re-running the install script.

---

# Getting help

Append `-h` or `--help` to any command or subcommand, at any level: `unity --help`, `unity projects create --help`.

Not sure which command? [Search, don't grep help](../SKILL.md#find-a-command-search-dont-grep-help). `unity --help` and the unknown-command error end with that pointer too. Each search ends by naming the source it skipped and the command that searches it (`data.hint` in JSON): follow it before concluding nothing exists.

# Find and install a missing editor

```bash
# 1. Check what's installed
unity editors --installed --format json

# 2. Browse available LTS versions
unity releases --lts --limit 5 --format json

# 3. Install
unity install 6000.0.47f1 --yes --accept-eula
```

# Debug the CLI

```bash
# Check auth + installed editors + recent errors in one command
unity doctor --format json

# Follow live logs during an install
unity logs --follow --level info
```

---
