import { readdir, readFile } from "node:fs/promises"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { basename } from "node:path"
import type { ProcessInfo } from "./types.js"
import { parseProcessStat } from "./processParser.js"
import { getPageSize } from "../utils/system-info.js"

const PROC_PATH = "/proc"
const execFileAsync = promisify(execFile)

// "1:02.50" / "1:02:03.10" / "1-02:03:04" -> clock ticks (100/sec, same unit as /proc)
function parsePsTime (value: string): number {
    const [days, rest] = value.includes("-") ? value.split("-") as [string, string] : ["0", value]
    const parts = rest.split(":").map(Number)
    let seconds = 0
    for (const part of parts) seconds = seconds * 60 + (Number.isFinite(part) ? part : 0)
    return Math.round((Number(days) * 86400 + seconds) * 100)
}

// `ps -o lstart` prints e.g. "Sat Nov  8 10:00:00 2026" -> clock ticks since epoch
function parsePsStartTime (value: string): number {
    return Math.round(new Date(value).getTime() / 10)
}

// macOS has no /proc, so we read process info from `ps` instead
async function getProcessesFromPs (): Promise<ProcessInfo[]> {
    const { stdout } = await execFileAsync(
        "ps",
        ["-axo", "pid=,ppid=,state=,rss=,utime=,stime=,lstart=,comm="],
        { maxBuffer: 10 * 1024 * 1024 }
    )

    const pageSize = await getPageSize()
    const processes: ProcessInfo[] = []

    for (const line of stdout.split("\n")) {
        const match = line.match(/^\s*(\d+)\s+(\d+)\s+(\S+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(\w{3}\s+\w{3}\s+\d+\s+[\d:]+\s+\d{4})\s+(.+)$/)
        if (!match) continue

        processes.push({
            pid: Number(match[1]),
            ppid: Number(match[2]),
            state: match[3]!.charAt(0),
            processName: basename(match[8]!.trim()),
            utime: parsePsTime(match[5]!),
            stime: parsePsTime(match[6]!),
            rss: Math.round((Number(match[4]) * 1024) / pageSize), // KB -> pages, like /proc
            startTimeTicks: parsePsStartTime(match[7]!),
        })
    }

    return processes
}

export class ProcessService {

    async getAllProcesses () : Promise<ProcessInfo[]> {
        if (process.platform === "darwin") {
            return getProcessesFromPs()
        }

        const entries = await readdir(PROC_PATH)

        const pids = entries
                        .filter((entry: any) => /^\d+$/.test(entry))
                        .map(Number)
        
        const processes : ProcessInfo[] = []

        for (const pid of pids) {

            try {
                const statPath = `${PROC_PATH}/${pid}/stat`

                const statContent = await readFile(
                    statPath,
                    "utf-8"
                )

                const processInfo = parseProcessStat(statContent)

                if(processInfo) {
                    processes.push(processInfo)
                }
            } catch (error) {
                continue
            }
        }

        return processes
    }

    async getProcessById (processId: number) : Promise<ProcessInfo | null> {
        if (process.platform === "darwin") {
            const all = await getProcessesFromPs()
            return all.find(p => p.pid === processId) ?? null
        }

        try {
            const statPath = `${PROC_PATH}/${processId}/stat`

            const statContent = await readFile(
                statPath,
                "utf-8"
            )

            const processInfo = parseProcessStat(statContent)

            return processInfo
        } catch (error) {
            return null
        }
    }
}