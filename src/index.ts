#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
import { listCommand } from "./cli/commands/list.js";

const program = new Command()

program 
    .name("Watcher")
    .description("A linux process monitoring CLI")
    .version("1.0.0")


program
    .command("hello")
    .description("Check if WATCHER is working")
    .action(() => {
        console.log(chalk.green("\n WATCHER is watching!!"))
        console.log(chalk.red("Process monitoring starts here. \n"))
    })

program.addCommand(listCommand)

program.parseAsync(process.argv);