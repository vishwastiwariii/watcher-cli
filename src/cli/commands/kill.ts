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

export const killCommand = new Command()
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
            return
        }

        if(!allowedSignals.includes(signal)) {
            console.error(
                chalk.red("Unsupported Signal")
            )

            return
        }

        const manager = new ProcessManager()

        try {
            await manager.sendSignal(pid, signal)

            console.log(
                chalk.green(
                    `Successfully sent signal ${signal} to process ${process}`
                )
            )
        } catch (error) {
            console.error(
                chalk.red(
                    `Couldn't send the signal`
                ), error
            )
        }
    })