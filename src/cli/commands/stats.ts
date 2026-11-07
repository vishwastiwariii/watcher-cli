import { Command } from "commander";
import { MemoryService } from "../../system/memory.service.js";
import { CpuService } from "../../system/cpu.service.js";
import chalk from "chalk";
import { formatMemory } from "../../utils/format.js";


export const statCommand = new Command("stats")
        .description("Display system and cpu statistics")
        .action(async () => {
            const cpuService = new CpuService()
            const memoryService = new MemoryService()

            try {
                console.log(chalk.yellow("\n Collecting system statistics ..."))

                const [cpuUsage, memoryInfo] = await Promise.all(
                    [
                        cpuService.getCpuUsage(), 
                        memoryService.getMemoryInfo()
                    ]
                )

                console.log(chalk.cyan("===== WATCHER STATS =====\n"))

                console.log(chalk.green("CPU Information"))

                console.log(`CPU Usage: ${cpuUsage.toFixed(2)}%`)

                console.log("\n" + chalk.green("Memory Information"))

                console.log(`Total Memory: ${formatMemory(memoryInfo.total * 1024)}`)
                console.log(`Used Memory: ${formatMemory(memoryInfo.used * 1024)}`)
                console.log(`Free Memory: ${formatMemory(memoryInfo.free * 1024)}`)
                console.log(`Available: ${formatMemory(memoryInfo.available * 1024)}`)

                console.log(
                    `Memory Usage : ${memoryInfo.usagePercentage.toFixed(2)}%`
                )

                console.log(chalk.cyan("===================\n"))
            } catch (error) {
                console.error(chalk.red("Unable to retrieve system statistics"), error)
            }
        })