import { Command } from "commander";
import { ProcessService } from "../../process/process.service.js";
import  Table  from "cli-table3";
import chalk from "chalk";


export const listCommand = new Command("list")
        .description("List of running processes")
        .action(async () => {
            const processService = new ProcessService()

            try {
                
                const processes = await processService.getAllProcesses()

                const table = new Table({
                head:[
                    chalk.cyan("PID"),
                    chalk.cyan("PPID"),
                    chalk.cyan("NAME"),
                    chalk.cyan("STATUS")
                ], 
                colWidths:[12, 12, 30, 15]
                })

                for (const proc of processes) {
                    table.push(
                        [
                            proc.pid,
                            proc.ppid,
                            proc.processName,
                            proc.state
                        ]
                    )
                }

                console.log(chalk.green(
                    `\nFound ${processes.length} processes`
                ))

                console.log(table.toString())
            } catch (error) {
                console.error(chalk.red("Failed to retrieve processes"), error)
                process.exitCode = 1
            }
        })