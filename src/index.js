import express from 'express';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { command } from './cli.js'


const app = express()

const GIBIBYTE = 1024 ** 3;
const MAX_SIZE = 2 * GIBIBYTE;

// http://192.168.178.44:3000/?show=that70sshow&path=brseason2/THAT70SSHOW_S2D1/BDMV/STREAM/

app.get('/test', (req, res) => {
  const sourcepath = '/mnt/Movies/backup/brseason3/THAT70SSHOW_S3D1/BDMV/STREAM/'
  const destpath = '/mnt/media/shows/that70sshow/season_3/'

  const offset = readdirSync(destpath).length

  if (!existsSync(destpath)) {
    mkdirSync(destpath)
    console.log('test')
  }
  const dir = readdirSync(sourcepath)

  dir = dir.filter(file => {
    const type = file.split('.')[1]
    if (type !== 'm2ts' || statSync(sourcepath + file).size < MAX_SIZE) return false;
    return true
  })

  dir.forEach((file, index) => {
    const name = file.split('.')[0]
    command('ffmpeg', ['-i', sourcepath + name + '.m2ts', '-c:v', 'copy', '-c:a', 'libmp3lame', '-b:a', '192k', destpath + index + offset + '_raw.mp4'])
  })
  res.send('done')
})

app.get('/', async (req, res) => {
  res.send('done')
  return;
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
