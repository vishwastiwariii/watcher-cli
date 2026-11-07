import { readdir, readFile } from "node:fs/promises"
import type { ProcessInfo } from "./types.js"
import { parseProcessStat } from "./processParser.js"

const PROC_PATH = "/proc"

export class ProcessService {

    async getAllProcesses () : Promise<ProcessInfo[]> {
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