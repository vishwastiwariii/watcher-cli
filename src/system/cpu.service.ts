import { readFile } from "node:fs/promises";
import type { CpuSnapshot, ProcessCpuSnapshot } from "./cpu.types.js";
import type { ProcessInfo } from "../process/types.js";
import { getCpuSnapshotDarwin } from "./darwin/cpu.darwin.js";


export class CpuService {

    async getCpuSnapshot() : Promise<CpuSnapshot> {
        if (process.platform === "darwin") {
            return getCpuSnapshotDarwin()
        }

        const content = await readFile("/proc/stat", "utf-8")

        const cpuLine = content 
                .split("\n")
                .find((line) => line.startsWith("cpu "))

        if (!cpuLine) {
            throw new Error("Unable to read CPU statistics")
        }

        const values = cpuLine
            .trim()
            .split(/\s+/)
            .slice(1)
            .map(Number)

        const total = values.reduce(
            (sum, value) => sum + value, 
            0
        )

        const idle = values[3]! + values[4]!

        return {
            total, 
            idle
        }
    }

    async getCpuUsage() : Promise<number> {
        const firstSnapshot = await this.getCpuSnapshot()

        await new Promise((resolve) => setTimeout(resolve, 2000))

        const secondSnapshot = await this.getCpuSnapshot()

        const totalDifference = secondSnapshot.total - firstSnapshot.total

        const idleDifference = secondSnapshot.idle - firstSnapshot.idle
        
        if(totalDifference <= 0) {
            return 0
        }

        const usage = ((totalDifference - idleDifference) / totalDifference) * 100

        return usage
    }

    async getCpuProcessSnapshot(
        process: ProcessInfo
    ) : Promise<ProcessCpuSnapshot>{
        const systemSnapshot = await this.getCpuSnapshot()

        return {
            processTime: process.utime + process.stime,
            totalCpuTime: systemSnapshot.total
        }
    }

    calculateProcessCpuUsage(
        previous: ProcessCpuSnapshot,
        current: ProcessCpuSnapshot
    ) : number {
        const processDifference = current.processTime - previous.processTime

        const totalDifference = current.totalCpuTime - previous.totalCpuTime

        if(totalDifference <= 0 || processDifference < 0) {
            return 0
        }

        const usage = (processDifference / totalDifference) * 100

        return Number(usage.toFixed(2))
    }
}