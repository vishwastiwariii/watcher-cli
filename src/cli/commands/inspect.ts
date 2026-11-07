import chalk from "chalk";
import { Command } from "commander";
import { ProcessService } from "../../process/process.service.js";
import { getPageSize } from "../../utils/system-info.js";
import { formatMemory } from "../../utils/format.js";

function getProcessState(state: string) : string {
    const states: Record<string, string> = {
        R: "Running / Runnable",
        S: "Interruptible Sleep",
        D: "Uninterruptible Sleep",
        U: "Uninterruptible Sleep", // macOS
        T: "Stopped",
        t: "Tracing Stop",
        Z: "Zombie",
        I: "Idle"
    }

    return states[state] ?? "Unknown"
}


export const inspectCommand = new Command("inspect")
        .description("Inspect a process")
        .argument("<pid>", "Process Id")
        .action(async (pidArgument) => {
            const pid = Number(pidArgument)

            if(!Number.isSafeInteger(pid) || pid <= 0) {
                console.error(chalk.red("Invalid PID"))
                return
            }

            const processService = new ProcessService()

            try {
                const proc = await processService.getProcessById(pid)

                if(!proc) {
                    console.log(chalk.red(`PID: ${pid} doesn't exists`))
                    return
                }

                const pageSize = await getPageSize()

                const memoryBytes = proc.rss * pageSize

                console.log(chalk.bold.cyan("\n========== PROCESS DETAILS ==========\n"))

                console.log(`PID             : ${proc.pid}`)
                console.log(`PPID            : ${proc.ppid}`)
                console.log(`NAME            : ${proc.processName}`)
                console.log(`STATE           : ${getProcessState(proc.state)}`)
                console.log(`STATE CODE      : ${proc.state}`)
                console.log(`CPU USER TIME   : ${proc.utime} ticks`)
                console.log(`CPU SYSTEM TIME : ${proc.stime} ticks`)
                console.log(`MEMORY (RSS)    : ${formatMemory(memoryBytes)}`)
                console.log(`START TIME      : ${proc.startTimeTicks} ticks`)

                console.log(chalk.cyan("\n=====================================\n"))
            } catch (error) {
                console.error(chalk.red("Unable to inspect process"), error)
            }
        })