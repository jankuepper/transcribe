import express from 'express'
import { processFile } from './pipeline.js'

const app = express()

app.get('/', (req, res) => {
    processFile('/mnt/Movies/backup/brseason2/THAT70SSHOW_S2D1/BDMV/STREAM/00000.m2ts', 'that70sshow')
    res.send('done')
})

app.listen(3000, () => {})