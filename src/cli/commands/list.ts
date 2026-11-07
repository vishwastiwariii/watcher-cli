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

                for (const process of processes) {
                    table.push(
                        [
                            process.pid,
                            process.ppid,
                            process.processName,
                            process.state
                        ]
                    )
                }

                console.log(chalk.green(
                    `\nFound ${processes.length} processes`
                ))

                console.log(table.toString())
            } catch (error) {
                chalk.red("Failed to retrieve processes"),
                error
            }
        })