import express from 'express'
import { readdirSync, statSync } from 'node:fs'
import { processFile } from './pipeline.js'


const app = express()

const GIBIBYTE = 1024 ** 3;
const MAX_SIZE = 2 * GIBIBYTE;

app.get('/', async (req, res) => {
    const dir = readdirSync('/mnt/Movies/backup/'+req.query.path)
    console.log(dir)
    dir.forEach(async file => {
        const stats = statSync(`/mnt/Movies/backup/${req.query.path}/${file}`)
        if(stats.size < MAX_SIZE) return;
        await processFile(`/mnt/Movies/backup/${req.query.path}/${file}`, req.query.show)
    })
    res.send('done')
})

app.listen(3000, () => {})