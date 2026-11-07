import type { ProcessInfo } from "../process/types.js";

export interface ProcessMonitorSnapshot {
    processTime: number,
    startTimeTicks: number
}

export interface MonitoredProcess extends ProcessInfo {
  cpuUsage: number;
}