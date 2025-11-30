import express from 'express'
import { readdirSync } from 'node:fs'
import { processFile } from './pipeline.js'


const app = express()

app.get('/', async (req, res) => {
    console.log(req.params)
    readdirSync('/mnt/Movies/backup/brseason2/THAT70SSHOW_S2D1/BDMV/STREAM/')
    // await processFile('/mnt/Movies/backup/brseason2/THAT70SSHOW_S2D1/BDMV/STREAM/00000.m2ts', 'that70sshow')
    
    res.send('done')
})

app.listen(3000, () => {})