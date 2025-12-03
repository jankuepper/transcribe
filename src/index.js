import express from 'express';
import { readdirSync, statSync } from 'node:fs';
import { command } from './cli.js'


const app = express()

const GIBIBYTE = 1024 ** 3;
const MAX_SIZE = 2 * GIBIBYTE;

// http://192.168.178.44:3000/?show=that70sshow&path=brseason2/THAT70SSHOW_S2D1/BDMV/STREAM/

function cleanUp(file) {
  const name = file.split('.')[0]
  command('rm', [name + '.mp3'])
  command('rm', [name + '.mp4'])
  command('rm', [name + '.txt'])
  command('rm', [name + '.m2ts'])
}

function prep(file, path) {
  const name = file.split('.')[0]
  command('cp', [path, '.'])
  command(`mv *.m2ts ${name}.m2ts`, [], { shell: true })
  command('ffmpeg', ['-i', name + '.m2ts', '-c:v', 'copy', '-c:a', 'libmp3lame', '-b:a', '192k', name + '.mp4'])
  command('ffmpeg', ['-i', name + '.mp4', name + '.mp3'])
}

app.get('/test', (req, res) => {
  const path = '/mnt/Movies/backup/brseason2/THAT70SSHOW_S2D1/BDMV/STREAM/'
  const dir = readdirSync(path)
  dir.forEach(file => {
    if (file.split('.')[1] !== 'm2ts' || statSync(path + file).size < MAX_SIZE) return;
    const name = file.split('.')[0]
    command('ffmpeg', ['-i', path + name + '.m2ts', '-c:v', 'copy', '-c:a', 'libmp3lame', '-b:a', '192k', '/mnt/media/shows/that70sshow/season_2/' + Number(name) + '.mp4'])
    //    command('cp', [name + '.mp4', '/mnt/media/shows/that70sshow/season_2/'])
  })
  res.send('done')
})

app.get('/', async (req, res) => {
  console.log('Starting')
  const unfiltereddir = readdirSync('/mnt/Movies/backup/' + req.query.path)
  const dir = unfiltereddir.filter(file => statSync('/mnt/Movies/backup/' + req.query.path + file).size > MAX_SIZE)
  console.log(dir)

  dir.forEach(file => cleanUp(file))

  dir.forEach(file => prep(file, '/mnt/Movies/backup/' + req.query.path + file))

  dir.forEach(file => {
    const name = file.split('.')[0]
    command('whisper', [name + '.mp3', '--model', 'turbo', '--language', 'en', '--task', 'transcribe', '--output_format', 'txt', '--device', 'cpu'])
  })

  dir.forEach(async file => {
    const name = file.split('.')[0]
    const res = await openai.responses.parse({
      model: 'gpt-5',
      input: [
        { role: 'system', content: `You are given the transcript of an episode from ${show}. Return the episodename and number in the season and the number of the season.` },
        { role: 'user', content: readFileSync(name + '.txt', 'utf-8') }
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

    command(`mv ${name}.mp4 ${show}_S${info.season}E${info.episodenumber}.mp4`, [], { shell: true })
    command('cp', [`${show}_S${info.season}E${info.episodenumber}.mp4`, `/mnt/media/shows/${show}/season_${info.season}/`])
  })

  dir.forEach(file => cleanUp(file))
})

app.listen(3000, () => { })
