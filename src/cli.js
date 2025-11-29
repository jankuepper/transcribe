import {spawnSync} from "node:child_process"

export function command(name, args = [], options = {}){
    const command = spawnSync(name,args, options)
    console.log({
        output: command['output']?.toString(),
        error: command['error']?.toString()
    })
    return command['output']?.toString()
}