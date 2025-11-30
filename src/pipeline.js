import {command} from './cli.js'
import { createReadStream, readFileSync, writeFileSync } from 'node:fs'
import OpenAI from 'openai'
import { z } from 'zod'
import { zodTextFormat } from 'openai/helpers/zod.mjs'

const openai = new OpenAI({apiKey: process.env.API_KEY})

const EpisodeInfo = z.object({
    episodename: z.string(),
    episodenumber: z.number(),
    season: z.number()
})

export async function processFile(path, show){
    command('cp', [path, '.'])
    command(`mv *.m2ts temp.m2ts`, [], { shell: true })
    command('ffmpeg', ['-i', 'temp.m2ts', '-c', 'copy', 'temp.mp4'])
    command('ffmpeg', ['-i', 'temp.mp4', '-c', 'copy', 'temp.mp3'])
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
            {role:'system', content: `You are given the transcript of an episode from ${show}. Return the episodename and number in the season and the number of the season.`},
            {role: 'user', content: readFileSync('temp.txt', 'utf-8')}
        ],
        tools: [
            { type: "web_search" },
        ],
        text: {
            format: zodTextFormat(EpisodeInfo, 'episode')
        }
    })
    const info = res.output_parsed
    console.log(info)

    command(`mv temp.mp4 ${show}_S${info.season}E${info.episodenumber}.mp4`, [], { shell: true })
    command('cp', [`${show}_S${info.season}E${info.episodenumber}.mp4`, `/mnt/media/shows/${show}/season_${info.season}/`])
    console.log('done')
}