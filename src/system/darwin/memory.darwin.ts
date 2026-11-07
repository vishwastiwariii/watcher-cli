import { execFile } from "node:child_process"
import { totalmem } from "node:os"
import { promisify } from "node:util"
import type { MemoryInfo } from "../memory.types.js"

const execFileAsync = promisify(execFile)

const BYTES_PER_KB = 1024

// Reads `vm_stat` and returns the page size plus the page count of each category,
// e.g. { pageSize: 16384, pages: { "Pages free": 1234, ... } }
async function readVmStat() {
    const { stdout } = await execFileAsync("vm_stat")

    const pageSize = Number(stdout.match(/page size of (\d+) bytes/)?.[1] ?? 4096)
    const pages: Record<string, number> = {}

    for (const line of stdout.split("\n")) {
        const match = line.match(/^(.+?):\s+(\d+)\.?$/)
        if (match) {
            pages[match[1]!] = Number(match[2])
        }
    }

    return { pageSize, pages }
}

// All values are in KB, same as the Linux implementation (/proc/meminfo).
export async function getMemoryInfoDarwin(): Promise<MemoryInfo> {
    const { pageSize, pages } = await readVmStat()

    const pagesToKb = (count: number) => (count * pageSize) / BYTES_PER_KB

    const total = totalmem() / BYTES_PER_KB
    const free = pagesToKb(pages["Pages free"] ?? 0)

    // macOS keeps reclaimable memory in "inactive" and "speculative" pages,
    // so they count as available even though they are not "free".
    const available = free + pagesToKb(
        (pages["Pages inactive"] ?? 0) + (pages["Pages speculative"] ?? 0)
    )

    const used = total - available
    const usagePercentage = total > 0 ? (used / total) * 100 : 0

    return { total, free, available, used, usagePercentage }
}
