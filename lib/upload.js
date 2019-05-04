// @flow
const tus = require('tus-node-server')
const EVENTS = require('tus-node-server').EVENTS
const express = require('express')
const log = require('@bit/kriscarle.maphubs-utils.maphubs-utils.log')
const config = require('../config')
const tiles = require('./tiles')

const UPLOAD_PATH = `/${config.UPLOAD_TEMP_PATH}`

const metadataStringToObject = (stringValue) => {
  const keyValuePairList = stringValue.split(',')

  const metadata = {}
  keyValuePairList.forEach((keyValuePair) => {
    let [key, base64Value] = keyValuePair.split(' ')
    metadata[key] = Buffer.from(base64Value, 'base64').toString('ascii')
  })

  return metadata
}

module.exports = function (app: any) {
  const server = new tus.Server()
  server.datastore = new tus.FileStore({
    path: UPLOAD_PATH
  })

  const uploadApp = express()
  uploadApp.all('*', server.handle.bind(server))

  server.on(EVENTS.EVENT_UPLOAD_COMPLETE, async (event) => {
    log.info(`Upload complete for file ${event.file.id}`)
    const metadata = metadataStringToObject(event.file.upload_metadata)
    log.info(metadata)
  })

  app.use('/upload/save', uploadApp)

  app.post('/upload/complete', async (req, res) => {
    const { uploadUrl, originalName } = req.body
    if (uploadUrl && originalName) {
      try {
        const uploadUrlParts = uploadUrl.split('/')
        const fileid = uploadUrlParts[uploadUrlParts.length - 1]
        const path = `${UPLOAD_PATH}/${fileid}`
        log.info(`upload path ${path}`)
        const origNameParts = originalName.split('.')
        const extension = origNameParts[origNameParts.length - 1]
        let tileJSON
        if (extension === 'tif' || extension === 'tiff') {
          log.info('GeoTiff Detected')
          tileJSON = await tiles.createTilesGeoTiff(path)
        } else if (extension === 'mbtiles') {
          log.info('MBtiles Detected')
          tileJSON = await tiles.createTilesMBTiles(path)
        } else {
          throw new Error(`Unsupported file type: ${extension}`)
        }
        log.info('Upload Complete')
        res.status(200).send(tileJSON)
      } catch (error) {
        log.error(error.message)
        res.status(500).send({ message: error.message })
      }
    } else {
      log.info('upload/complete endpoint missing required data')
      res.status(400).send({
        success: false,
        error: 'missing required data'
      })
    }
  })
}
