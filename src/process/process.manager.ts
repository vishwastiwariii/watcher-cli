import { ProcessService } from "./process.service.js";

export type ProcessSignal =
  | "SIGTERM"
  | "SIGKILL"
  | "SIGSTOP"
  | "SIGCONT"
  | "SIGINT"
  | "SIGHUP";


export class ProcessManager {
    private processService = new ProcessService()

    async sendSignal (
        pid: number,
        signal: ProcessSignal
    ) : Promise<void> {
        if(!Number.isSafeInteger(pid) || pid <= 1) {
            throw new Error("Invalid or protected PID")
        }

        if(pid === process.pid){
            throw new Error("Watcher cannot signal itself")
        }

        const target = await this.processService.getProcessById(pid)

        if(!target) {
            throw new Error(`Process with PID: ${pid} doesn't exists`)
        }

        process.kill(pid, signal)
    }
}