import {command} from './cli.js'
import { createReadStream, readFileSync, writeFileSync } from 'node:fs'
import OpenAI from 'openai'

const openai = new OpenAI({apiKey: process.env.API_KEY})

export async function processFile(path){
    command('cp', [path, '.'])
    command(`mv *.m2ts temp.m2ts`, [], { shell: true })
    command('ffmpeg -hwaccel auto', [ '-device /dev/dri/renderD128', '-i', 'temp.m2ts', 'temp.mp4'])
    command('ffmpeg -hwaccel auto', [ '-device /dev/dri/renderD128', '-i', 'temp.mp4', 'temp.mp3'])
    command('rm', ['temp.m2ts'])
    command('touch', ['text.txt'])
    
    command('whisper', ['temp.mp3', '--model turbo', '--language en', '--task transcribe', '--output_format txt', '--device cpu'])
/*
    try{
        const result = await openai.audio.transcriptions.create({
            file: createReadStream('../temp.mp3'),
            model: 'whisper-1'
        })
        console.log(result) 

        if(result){
            writeFileSync('text.txt', result?.text)
        }
    }catch(e){
        console.log('Error: ', e)
    } */
    console.log('done')
}