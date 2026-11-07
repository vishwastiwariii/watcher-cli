import type { ProcessInfo } from "./types.js";

export function parseProcessStat (
    stat: string
) : ProcessInfo | null {
    const firstBracket = stat.indexOf("(");
    const lastBracket = stat.lastIndexOf(")");

    if (firstBracket === - 1 || lastBracket === -1) {
        return null
    }

    const pid = Number(stat.slice(0, firstBracket).trim())

    const processName = stat.slice(firstBracket + 1, lastBracket)

    const remainingFields = stat.slice(lastBracket + 1).trim().split(/\s+/)

    if(remainingFields.length < 2 || !Number.isInteger(pid)) {
        return null
    }

    const state = remainingFields[0]

    // parent pid
    const ppid = Number(remainingFields[1])

    if(!Number.isInteger(ppid) || !state) {
        return null
    }

    return {
        pid,
        ppid,
        processName,
        state
    }
}