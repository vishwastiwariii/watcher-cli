import { Command } from "commander";
import chalk from "chalk";
import Table from "cli-table3";

import { ProcessService } from "../../process/process.service.js";
import { CpuService } from "../../system/cpu.service.js";
import { MemoryService } from "../../system/memory.service.js";
import { ProcessMonitorService } from "../../system/process-monitor.service.js";

import { formatMemory } from "../../utils/format.js";

import {
    getPageSize,
    getCpuCoreCount
} from "../../utils/system-info.js";


export const monitorCommand = new Command("monitor")
    .description("Monitor system resources in real time")
    .option("-i, --interval <seconds>", "Refresh interval", "1")
    .option(
        "-s, --sort <field>",
        "Sort processes by cpu or memory",
        "cpu"
    )
    .action(async (options) => {
        const interval = Number(options.interval);
        const sortBy = options.sort;

        if (!Number.isFinite(interval) || interval < 0.5) {
            console.error("Interval must be at least 0.5 seconds");
            return;
        }

        if (!["cpu", "memory"].includes(sortBy)) {
            console.error("Sort must be cpu or memory");
            return;
        }

        const processService = new ProcessService();
        const cpuService = new CpuService();
        const memoryService = new MemoryService();
        const processMonitor = new ProcessMonitorService();

        const pageSize = await getPageSize();
        const cpuCores = getCpuCoreCount();

        let previousCpuSnapshot = await cpuService.getCpuSnapshot();
        let running = true;
        let timer: NodeJS.Timeout | undefined;

        // Hide the cursor while the dashboard is running
        process.stdout.write("\x1B[?25l");

        const shutdown = () => {
            if (!running) return;

            running = false;

            if (timer) {
                clearTimeout(timer);
            }

            // Show the cursor again
            process.stdout.write("\x1B[?25h");

            console.log(chalk.yellow("\nWatcher stopped.\n"));
        };

        process.on("SIGINT", shutdown);

        async function refreshDashboard(): Promise<void> {
            if (!running) return;

            try {
                const [
                    processes,
                    memoryInfo,
                    currentCpuSnapshot
                ] = await Promise.all([
                    processService.getAllProcesses(),
                    memoryService.getMemoryInfo(),
                    cpuService.getCpuSnapshot()
                ]);

                const totalCpuDifference =
                    currentCpuSnapshot.total - previousCpuSnapshot.total;

                const systemCpuUsage = cpuService.calculateCpuUsage(
                    previousCpuSnapshot,
                    currentCpuSnapshot
                );

                previousCpuSnapshot = currentCpuSnapshot;

                const monitoredProcesses = processMonitor.calculateProcessUsage(
                    processes,
                    totalCpuDifference,
                    cpuCores
                );

                // Sort processes
                monitoredProcesses.sort((a, b) => {
                    if (sortBy === "cpu") {
                        return b.cpuUsage - a.cpuUsage;
                    }

                    return b.rss - a.rss;
                });

                // Clear terminal
                console.clear();

                console.log(
                    chalk.bold.cyan("=============== WATCHER ===============\n")
                );

                console.log(chalk.yellow("SYSTEM INFORMATION"));
                console.log("-----------------------------------------");

                console.log(`CPU Usage       : ${chalk.green(systemCpuUsage.toFixed(2) + "%")}`);
                console.log(`Memory Usage    : ${chalk.green(memoryInfo.usagePercentage.toFixed(2) + "%")}`);
                console.log(`Total Memory    : ${formatMemory(memoryInfo.total * 1024)}`);
                console.log(`Used Memory     : ${formatMemory(memoryInfo.used * 1024)}`);
                console.log(`Available Memory: ${formatMemory(memoryInfo.available * 1024)}`);
                console.log(`CPU Cores       : ${cpuCores}`);

                console.log("\n" + chalk.yellow("PROCESS INFORMATION"));

                const table = new Table({
                    head: ["PID", "NAME", "STATE", "CPU %", "MEMORY"],
                    colWidths: [12, 25, 10, 12, 15]
                });

                for (const proc of monitoredProcesses.slice(0, 15)) {
                    const memoryBytes = proc.rss * pageSize;

                    table.push([
                        proc.pid,
                        proc.processName,
                        proc.state,
                        proc.cpuUsage.toFixed(2) + "%",
                        formatMemory(memoryBytes)
                    ]);
                }

                console.log(table.toString());

                console.log(chalk.gray(`\nTotal Processes: ${processes.length}`));
                console.log(
                    chalk.gray(`Refreshing every ${interval} seconds | Sorted by ${sortBy}`)
                );
                console.log(chalk.gray("Press Ctrl+C to exit"));
            } catch (error) {
                console.error(chalk.red("Monitoring error:"), error);
            }

            if (running) {
                // Schedule the next refresh after this refresh completes
                timer = setTimeout(refreshDashboard, interval * 1000);
            }
        }

        await refreshDashboard();
    });
