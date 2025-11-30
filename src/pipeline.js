import {command} from './cli.js'
import { createReadStream, readFileSync, writeFileSync } from 'node:fs'
import OpenAI from 'openai'
import { z } from 'zod'
import { zodTextFormat } from 'openai/helpers/zod.mjs'

const openai = new OpenAI({apiKey: process.env.API_KEY})

const EpisodeInfo = z.object({
    name: z.string(),
    number: z.number(),
    season: z.number()
})

export async function processFile(path, show){
    command('cp', [path, '.'])
    command(`mv *.m2ts temp.m2ts`, [], { shell: true })
    command('ffmpeg', ['-i', 'temp.m2ts', 'temp.mp4'])
    command('ffmpeg', ['-i', 'temp.mp4', 'temp.mp3'])
    command('rm', ['temp.m2ts'])
    
    if(!process.env.OPENAI_WHISPER){
        command('whisper', ['temp.mp3', '--model', 'turbo', '--language', 'en', '--task', 'transcribe', '--output_format', 'txt', '--device', 'cpu'])
    } else {
        const result = await openai.audio.transcriptions.create({
            file: createReadStream('../temp.mp3'),
            model: 'whisper-1'
        })
        console.log(result) 

        if(result){
            command('touch', ['temp.txt'])
            writeFileSync('temp.txt', result?.text)
        }
    }
    
    const res = await openai.responses.parse({
        model: 'gpt-5',
        input: [
            {role:'system', content: `You are given the transcription of an episode from ${show}. Return the episodes name and number in the season and the number of the season.`},
            {role: 'user', content: createReadStream('temp.txt')}
        ],
        text: {
            format: zodTextFormat(EpisodeInfo, 'episode')
        }
    })
    const info = res.output_parsed
    console.log(info)

    console.log('done')
}