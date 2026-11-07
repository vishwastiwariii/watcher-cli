import { readFile } from "node:fs/promises";
import type { MemoryInfo } from "./memory.types.js";


export class MemoryService {
    async getMemoryInfo () : Promise<MemoryInfo> {
        const content = await readFile(
            "/proc/meminfo",
            "utf-8"
        )

        const values : Record<string, number> = {}

        for (const line of content.split("\n")) {
            const match = line.match(
                /^(\w+):\s+(\d+)/
            )

            if(match) {
                values[match[1]!] = Number([match[2]])
            }
        }

        const total = values.MemTotal ?? 0; 
        const free = values.MemFree ?? 0; 
        const available = values.MemAvailable ?? free

        const used = total - free

        const usagePercentage = total > 0 ? (used/total) * 100 : 0

        return {
            total, 
            free, 
            available,
            used,
            usagePercentage
        }
    }
}