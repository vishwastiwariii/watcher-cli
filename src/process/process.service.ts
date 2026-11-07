import { readdir, readFile } from "node:fs/promises"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { basename } from "node:path"
import type { ProcessInfo } from "./types.js"
import { parseProcessStat } from "./processParser.js"

const PROC_PATH = "/proc"
const execFileAsync = promisify(execFile)

// macOS has no /proc, so we read process info from `ps` instead
async function getProcessesFromPs (): Promise<ProcessInfo[]> {
    const { stdout } = await execFileAsync(
        "ps",
        ["-axo", "pid=,ppid=,state=,comm="],
        { maxBuffer: 10 * 1024 * 1024 }
    )

    const processes: ProcessInfo[] = []

    for (const line of stdout.split("\n")) {
        const match = line.match(/^\s*(\d+)\s+(\d+)\s+(\S+)\s+(.+)$/)
        if (!match) continue

        processes.push({
            pid: Number(match[1]),
            ppid: Number(match[2]),
            state: match[3]!.charAt(0),
            processName: basename(match[4]!.trim()),
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