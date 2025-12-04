import express from 'express';
import { existsSync, mkdirSync, readdirSync, renameSync, statSync } from 'node:fs';
import { command } from './cli.js'
import Openai from 'openai'
import { z } from "zod";

const openai = new Openai({
  apiKey: process.env['API_KEY']
})

const EpisodeInfo = z.object({
  episodenumber: z.number(),
  episodename: z.string(),
  season: z.number()
})

const app = express()

const GIBIBYTE = 1024 ** 3;
const MAX_SIZE = 2 * GIBIBYTE;

// :3000/?src=brseason3/THAT%2070S%20SHOW%20S3D1&dest=that70sshow/season_3/
// ?src=that70sshow/season_3/

app.get('/transcribe', (req, res) => {
  const sourcepath = '/mnt/media/shows/' + decodeURI(req.query.src)

  const dir = readdirSync(sourcepath)
  dir.forEach((file) => {
    const name = file.split('.')[0]
    if (!name.includes('_raw')) return
    command('ffmpeg', ['-i', sourcepath + file, '-vn', '-acodec', 'copy', name + '.mp3'])
    command('whisper', [name + '.mp3', '--model', 'turbo', '--language', 'en', '--task', 'transcribe', '--output_format', 'txt', '--device', 'cpu'])
  })

  const localDir = readdirSync('.')
  localDir.forEach(async (file) => {
    const [name, type] = file.split('.')
    if (!name.includes('_raw') || type !== 'txt') return
    const res = await openai.responses.parse({
      model: 'gpt-5',
      input: [
        { role: 'system', content: `You are given the transcript of an episode from that 70s show. Return the episodename and number in the season and the number of the season.` },
        { role: 'user', content: readFileSync(name + '.txt', 'utf-8') }
      ],
      tools: [
        { type: "web_search" },
      ],
      text: {
        format: zodTextFormat(EpisodeInfo, 'episode')
      }
    })
    const info = await res.output_parsed
    console.log({ info })
    renameSync(sourcepath + name, sourcepath + info.episodenumber)
  })

  res.send('done')
})

app.get('/copy', (req, res) => {
  const sourcepath = '/mnt/Movies/backup/' + decodeURI(req.query.src) + '/BDMV/STREAM/'  // '/mnt/Movies/backup/brseason3/THAT\ 70S\ SHOW\ S3D1/BDMV/STREAM/'
  const destpath = '/mnt/media/shows/' + decodeURI(req.query.dest)  // '/mnt/media/shows/that70sshow/season_3/'

  if (!existsSync(destpath)) {
    mkdirSync(destpath)
  }
  const offset = readdirSync(destpath).length
  let dir = readdirSync(sourcepath)

  dir = dir.filter(file => {
    const type = file.split('.')[1]
    if (type !== 'm2ts' || statSync(sourcepath + file).size < MAX_SIZE) return false;
    return true
  })

  dir.forEach((file, index) => {
    const name = file.split('.')[0]
    const num = index + offset
    command('ffmpeg', ['-i', sourcepath + name + '.m2ts', '-c:v', 'copy', '-c:a', 'libmp3lame', '-b:a', '192k', destpath + num + '_raw.mp4'])
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
