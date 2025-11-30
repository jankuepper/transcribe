import {spawnSync} from "node:child_process"

export function command(name, args = [], options = {}){
    const command = spawnSync(name,args, options)
    console.log({
        output: command.stdout?.toString(),
        error: command.stderr?.toString()
    })
    return command.stdout?.toString()
}