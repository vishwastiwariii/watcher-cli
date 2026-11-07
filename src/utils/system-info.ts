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