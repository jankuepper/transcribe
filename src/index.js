import express from 'express'
import { readdirSync } from 'node:fs'
import { processFile } from './pipeline.js'


const app = express()

app.get('/', async (req, res) => {
    const dir = readdirSync('/mnt/Movies/backup/'+req.query.path)
    console.log(dir)
    dir.forEach(async file => {
        await processFile(`/mnt/Movies/backup/${req.query.path}/${file}`, req.query.show)
    })
    res.send('done')
})

app.listen(3000, () => {})