import { Command } from "commander";
import { ProcessManager, type ProcessSignal } from "../../process/process.manager.js";
import chalk from "chalk";

const allowedSignals: ProcessSignal[] = [
  "SIGTERM",
  "SIGKILL",
  "SIGSTOP",
  "SIGCONT",
  "SIGINT",
  "SIGHUP"
];

export const killCommand = new Command("kill")
    .description("Send a signal to process")
    .argument("<pid>", "Process Id")
    .option(
        "-s, --signal <signal>",
        "Signal to send", 
        "SIGTERM"
    )
    .action(async (pidArgument, options) => {
        const pid = Number(pidArgument)

        const signal = options.signal.toUpperCase() as ProcessSignal

        if(!Number.isSafeInteger(pid) || pid <= 1){
            console.error(chalk.red("Invalid or protected PID"))
            process.exitCode = 1
            return
        }

        if(!allowedSignals.includes(signal)) {
            console.error(
                chalk.red(`Unsupported signal. Allowed: ${allowedSignals.join(", ")}`)
            )

            process.exitCode = 1
            return
        }

        const manager = new ProcessManager()

        try {
            await manager.sendSignal(pid, signal)

            console.log(
                chalk.green(
                    `Successfully sent signal ${signal} to process ${pid}`
                )
            )
        } catch (error) {
            console.error(
                chalk.red(
                    `Couldn't send the signal`
                ), error
            )

            process.exitCode = 1
        }
    })