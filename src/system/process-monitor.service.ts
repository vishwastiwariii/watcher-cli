import type { ProcessInfo } from "../process/types.js";
import type { MonitoredProcess, ProcessMonitorSnapshot } from "./process-monitor.types.js";


export class ProcessMonitorService {
    private previousSnapshots = new Map<number, ProcessMonitorSnapshot>()

    calculateProcessUsage(
        processes: ProcessInfo[],
        totalCpuDifference: number,
        cpuCores: number
    ) : MonitoredProcess[] {
        const currentSnapshots = new Map<number, ProcessMonitorSnapshot>()
        const monitoredProcesses : MonitoredProcess[] = []

        for (const process of processes) {
            const currentProcessTime = process.utime + process.stime
            const previous = this.previousSnapshots.get(process.pid)

            let cpuUsage = 0

            // Only compare with the previous snapshot when it is the same process:
            // a PID can be reused, so the start time must match too.
            const isSameProcess = previous?.startTimeTicks === process.startTimeTicks

            if (previous && isSameProcess && totalCpuDifference > 0) {
                const processDifference = currentProcessTime - previous.processTime

                if (processDifference >= 0) {
                    cpuUsage = (processDifference / totalCpuDifference) * cpuCores * 100
                }
            }

            currentSnapshots.set(process.pid, {
                processTime: currentProcessTime,
                startTimeTicks: process.startTimeTicks
            })

            monitoredProcesses.push({
                ...process,
                cpuUsage: Number(cpuUsage.toFixed(2))
            })
        }

        this.previousSnapshots = currentSnapshots

        return monitoredProcesses
    }

    reset() : void {
        this.previousSnapshots.clear()
    }
}
