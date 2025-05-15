#!/usr/bin/env bun

import {argv} from "bun";
import {create} from "../commands/create.ts";

const [, , command, ...rest] = argv;

switch (command) {
    case "create":
        await create();
        break;
    default:
        console.log(`Unknown command: ${command}`);
        console.log(`Usage: ngspark create`);
}