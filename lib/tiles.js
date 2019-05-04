// @flow
const tilelive = require('@mapbox/tilelive')
const GeoTIFF = require('geotiff')
const AWS = require('aws-sdk')
require('@mapbox/tilelive-mapnik').registerProtocols(tilelive)
require('tilelive-raster')(tilelive)
const MBTiles = require('@mapbox/mbtiles')
const uuidv4 = require('uuid/v4')
const SphericalMercator = require('@mapbox/sphericalmercator')
const log = require('@bit/kriscarle.maphubs-utils.maphubs-utils.log')
const config = require('../config')

var sm = new SphericalMercator({
  size: 256
})

module.exports = {
  async createTilesGeoTiff (inputFile) {
    const bbox = await this.getBoundingBox(inputFile)
    const options = { minzoom: 1, maxzoom: 12 }
    const srcuri = `raster+file://${inputFile}`
    const uuid = uuidv4()
    const dsturi = `s3://${config.S3_BUCKET}/tiles/gtu/${uuid}/{z}/{x}/{y}.png`
    const tileJSON = {
      name: uuid,
      type: 'overlay',
      version: '1',
      format: 'png',
      minzoom: options.minzoom,
      maxzoom: options.maxzoom,
      scale: 1,
      generator: 'MapHubs',
      profile: 'mercator',
      scheme: 'xyz',
      bounds: bbox,
      tilejson: '2.0.0',
      'tiles': [
        `${config.CDN_URL}/tiles/gtu/${uuid}/{z}/{x}/{y}.png`
      ]
    }

    log.info(srcuri)
    log.info(dsturi)

    await new Promise((resolve, reject) => {
      tilelive.copy(srcuri, dsturi, options, (error) => {
        if (error) reject(error)
        log.info('tile copy complete')
        resolve()
      })
    })

    const s3 = new AWS.S3()
    await new Promise((resolve, reject) => {
      s3.putObject({
        Bucket: config.S3_BUCKET,
        Key: 'tiles/gtu/' + uuid + '/tile.json',
        Body: JSON.stringify(tileJSON),
        ContentType: 'application/json'
      },
      (error, data) => {
        if (error) reject(error)
        log.info('saved tilejson to s3')
        resolve()
      }
      )
    })
    return tileJSON
  },

  async createTilesMBTiles (inputFile) {
    const mbtiles = await new Promise((resolve, reject) => {
      // eslint-disable-next-line no-new
      new MBTiles(inputFile, (error, mbtiles) => {
        if (error) reject(error)
        resolve(mbtiles)
      })
    })
    const info = await new Promise((resolve, reject) => {
      mbtiles.getInfo((error, info) => {
        if (error) reject(error)
        resolve(info)
      })
    })
    const options = { minzoom: info.minzoom, maxzoom: info.maxzoom }
    const srcuri = `mbtiles://${inputFile}`
    const uuid = uuidv4()
    const dsturi = `s3://${config.S3_BUCKET}/tiles/gtu/${uuid}/{z}/{x}/{y}.png`
    const tileJSON = {
      name: uuid,
      type: 'overlay',
      version: '1',
      format: 'png',
      minzoom: options.minzoom,
      maxzoom: options.maxzoom,
      scale: 1,
      generator: 'MapHubs',
      profile: 'mercator',
      scheme: 'xyz',
      bounds: info.bounds,
      tilejson: '2.0.0',
      'tiles': [
        `${config.CDN_URL}/tiles/gtu/${uuid}/{z}/{x}/{y}.png`
      ]
    }

    log.info(srcuri)
    log.info(dsturi)

    await new Promise((resolve, reject) => {
      tilelive.copy(srcuri, dsturi, options, (error) => {
        if (error) reject(error)
        log.info('tile copy complete')
        resolve()
      })
    })

    const s3 = new AWS.S3()
    await new Promise((resolve, reject) => {
      s3.putObject({
        Bucket: config.S3_BUCKET,
        Key: 'tiles/gtu/' + uuid + '/tile.json',
        Body: JSON.stringify(tileJSON),
        ContentType: 'application/json'
      },
      (error, data) => {
        if (error) reject(error)
        log.info('saved tilejson to s3')
        resolve()
      }
      )
    })
    return tileJSON
  },

  async getBoundingBox (inputFile) {
    const tiff = await GeoTIFF.fromFile(inputFile)
    const image = await tiff.getImage()
    const epsg = image.geoKeys.ProjectedCSTypeGeoKey || image.geoKeys.GeographicTypeGeoKey
    log.info('epsg:' + epsg)
    let bbox = image.getBoundingBox()

    if (epsg === 3857) {
      log.info('converting bounds to wgs84')
      bbox = sm.convert(bbox, 'WGS84')
    }
    log.info(bbox)
    return bbox
  }
}
