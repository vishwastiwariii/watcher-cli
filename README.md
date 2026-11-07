# Watcher

A small, dependency-light **process and system monitoring CLI** for **Linux and macOS**, written in TypeScript.

Watcher lists running processes, shows CPU and memory statistics, inspects a single process in detail, and offers a live, `top`-style dashboard, all from one command.

## Features

| Command | What it does |
|---|---|
| `watcher hello` | Quick check that the CLI is installed and working |
| `watcher list` | Table of every running process (PID, PPID, name, state) |
| `watcher stats` | System CPU usage and memory (total, used, free, available) |
| `watcher inspect <pid>` | Details for one process: parent, state, CPU times, memory, start time |
| `watcher monitor` | Live dashboard: system CPU/memory plus the top 15 processes |

## Requirements

- **Node.js 20 or later** (Watcher uses `os.availableParallelism()`)
- **Linux** or **macOS**. Windows is not supported.

## Installation

Watcher is not published to npm yet, so install it from source:

```bash
git clone https://github.com/vishwastiwariii/watcher-cli.git
cd watcher-cli
npm install
npm run build
```

Run it directly:

```bash
node dist/index.js list
```

Or link it globally so the `watcher` command is available everywhere:

```bash
npm link
watcher list
```

### Development (no build step)

```bash
npm run dev -- list
npm run dev -- inspect 1
```

The `--` is required: it tells npm to pass the arguments to Watcher instead of reading them itself.

## Usage

### `watcher list`

```
Found 470 processes
┌────────────┬────────────┬──────────────────────────────┬───────────────┐
│ PID        │ PPID       │ NAME                         │ STATUS        │
├────────────┼────────────┼──────────────────────────────┼───────────────┤
│ 1          │ 0          │ launchd                      │ S             │
```

### `watcher stats`

```
CPU Information
CPU Usage: 16.24%

Memory Information
Total Memory: 8.00 GB
Used Memory: 6.49 GB
Free Memory: 67.59 MB
Available: 1.51 GB
Memory Usage : 81.08%
```

CPU usage is measured over a 2-second sample, so the command takes about two seconds to finish.

### `watcher inspect <pid>`

```
========== PROCESS DETAILS ==========

PID             : 4242
PPID            : 1
NAME            : zsh
STATE           : Interruptible Sleep
STATE CODE      : S
CPU USER TIME   : 12 ticks
CPU SYSTEM TIME : 8 ticks
MEMORY (RSS)    : 2.00 MB
START TIME      : 8/11/2026, 1:39:30 am
```

Exits with code `1` if the PID is invalid or does not exist.

### `watcher monitor`

A live dashboard that refreshes in place. Press `Ctrl+C` to exit.

| Option | Default | Description |
|---|---|---|
| `-i, --interval <seconds>` | `1` | Refresh interval. Minimum `0.5`. |
| `-s, --sort <field>` | `cpu` | Sort processes by `cpu` or `memory`. |

```bash
watcher monitor                      # refresh every second, sort by CPU
watcher monitor -i 2 -s memory       # every 2 seconds, sort by memory
```

Per-process CPU % is relative to one core, like `top`, so a process using two full cores shows about 200%.

### Exit codes

Every command exits with `0` on success and `1` on invalid input or failure, so Watcher is safe to use in scripts.

## How it works

Watcher reads process and system data differently on each platform and hides the difference behind the same services.

| Data | Linux | macOS |
|---|---|---|
| Processes | `/proc/<pid>/stat` | `ps -axo pid,ppid,state,rss,utime,stime,lstart,comm` |
| System CPU | `/proc/stat` | `os.cpus()` |
| Memory | `/proc/meminfo` | `os.totalmem()` plus `vm_stat` |
| Start time | boot time (`/proc/stat`) plus ticks since boot | ticks since 1970, from `ps lstart` |

Internally, CPU times are expressed in clock ticks (100 per second) and memory in KB or pages. Values are converted to bytes only when displayed.

### Notes and limitations

- Without root, macOS may hide some processes, so counts can differ slightly from `ps -ax`.
- On macOS, "Used memory" is **total minus available**, where available includes inactive and speculative pages. On Linux it is **total minus free**, as in `/proc/meminfo`.
- Linux process names come from the kernel and are truncated to 15 characters.
- CPU percentages can differ slightly from `top` because the sampling windows are not identical.
- The Linux code paths have been tested in a Linux container (Node 22), not on a range of distributions.

## Project structure

```
src/
├── index.ts                      # CLI entry point, registers commands
├── cli/commands/                 # One file per command
│   ├── list.ts
│   ├── stats.ts
│   ├── inspect.ts
│   └── monitor.ts
├── process/
│   ├── process.service.ts        # Reads processes (Linux /proc, macOS ps)
│   ├── processParser.ts          # Parses /proc/<pid>/stat
│   └── types.ts
├── system/
│   ├── cpu.service.ts            # CPU snapshots and usage
│   ├── memory.service.ts         # Memory info
│   ├── process-monitor.service.ts# Per-process CPU % between refreshes
│   └── darwin/                   # macOS implementations
└── utils/
    ├── format.ts                 # Memory formatting
    └── system-info.ts            # Page size, core count, start time
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev -- <command>` | Run from TypeScript source with `tsx` |
| `npm run build` | Compile to `dist/` |
| `npm start -- <command>` | Run the compiled build |

## Testing

There is no automated test suite yet. Before each release, the commands are checked by hand on macOS and in a Linux container:

```bash
npx tsc --noEmit                        # type check

docker run --rm -v "$PWD":/app -v /app/node_modules -w /app node:22 \
  sh -c "npm install && npx tsx src/index.ts list"
```

Adding unit tests for `parseProcessStat` and the `ps` output parser would be a valuable contribution.

## Contributing

Contributions are welcome.

1. Fork the repository and create a branch: `git checkout -b feature/my-change`
2. Make your change and make sure `npx tsc --noEmit` passes
3. Check the commands you touched on your platform
4. Open a pull request describing what changed and why

Please keep changes focused, and match the existing code style (4-space indentation, no external dependency unless it is clearly needed).

## License

ISC. See `package.json`. Add a `LICENSE` file before publishing.
