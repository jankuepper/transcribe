import {command} from './cli.js'
import { createReadStream, writeFileSync } from 'node:fs'

export async function processFile(path){
    command('cp', [path, '.'])
    command(`mv *.m2ts temp.m2ts`,[], {shell:true})
    command('ffmpeg', ['-i', 'temp.m2ts', 'temp.mp4'])
    command('ffmpeg', ['-i', 'temp.mp4', 'temp.mp3'])
    command('rm', ['temp.m2ts'])
    command('touch', ['text.txt'])
    
    const audio = createReadStream('temp.mp3')
    const data = new FormData()
    data.append('file', audio)
    data.append('model', 'whisper-1')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers:{
            'Authorization': `Bearer ${process.env.API_KEY}`,
            'Content-Type':'multipart/form-data'
        },
        body: data
    })
    const responseJson = await response.json()
    const transcription = responseJson?.text
    writeFileSync('text.txt', transcription)
    console.log('done')
}