import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";

const execFileAsync = promisify(execFile);

export async function getPageSize(): Promise<number> {

  const { stdout } = await execFileAsync(
    "getconf",
    ["PAGESIZE"]
  );

  const pageSize = Number(stdout.trim());

  if (!Number.isFinite(pageSize) || pageSize <= 0) {
    throw new Error("Unable to determine system page size");
  }

  return pageSize;
}

export function getCpuCoreCount(): number {
  return os.availableParallelism();
}

const CLOCK_TICKS_PER_SECOND = 100;

// Converts a process's startTimeTicks into a real date.
// macOS: ticks since 1970 (set by our `ps` provider).
// Linux: ticks since boot (/proc/<pid>/stat), so we add the boot time from /proc/stat.
export async function getProcessStartDate(startTimeTicks: number): Promise<Date> {
  if (process.platform === "darwin") {
    return new Date((startTimeTicks / CLOCK_TICKS_PER_SECOND) * 1000);
  }

  const stat = await readFile("/proc/stat", "utf-8");
  const bootTimeSeconds = Number(stat.match(/^btime\s+(\d+)/m)?.[1]);

  if (!Number.isFinite(bootTimeSeconds)) {
    throw new Error("Unable to determine system boot time");
  }

  return new Date((bootTimeSeconds + startTimeTicks / CLOCK_TICKS_PER_SECOND) * 1000);
}
