import express from 'express'
import { readdirSync } from 'node:fs'
import { processFile } from './pipeline.js'


const app = express()

app.get('/', async (req, res) => {
    const dir = readdirSync('/mnt/Movies/backup/brseason2/THAT70SSHOW_S2D1/BDMV/STREAM/')
    console.log(dir)
    // await processFile('/mnt/Movies/backup/brseason2/THAT70SSHOW_S2D1/BDMV/STREAM/00000.m2ts', 'that70sshow')
    
    res.send(req.query)
})

app.listen(3000, () => {})