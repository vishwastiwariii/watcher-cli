import { cpus } from "node:os"
import type { CpuSnapshot } from "../cpu.types.js"

// os.cpus() reports milliseconds, /proc/stat reports clock ticks (100 per second).
// Converting keeps the numbers in the same unit as the Linux implementation.
const MS_PER_TICK = 10

export function getCpuSnapshotDarwin(): CpuSnapshot {
    let total = 0
    let idle = 0

    for (const { times } of cpus()) {
        total += times.user + times.nice + times.sys + times.idle + times.irq
        idle += times.idle
    }

    return {
        total: total / MS_PER_TICK,
        idle: idle / MS_PER_TICK
    }
}
