// @flow
const tilelive = require('@mapbox/tilelive')
const GeoTIFF = require('geotiff')
const fs = require('fs')
require('@mapbox/tilelive-mapnik').registerProtocols(tilelive)
require('tilelive-raster')(tilelive)
require('tilelive-file').registerProtocols(tilelive)
const MBTiles = require('@mapbox/mbtiles')
const uuidv4 = require('uuid').v4
const SphericalMercator = require('@mapbox/sphericalmercator')
const log = require('@bit/kriscarle.maphubs-utils.maphubs-utils.log')
const config = require('../config')
const bboxPolygon = require('@turf/bbox-polygon').default
const turfArea = require('@turf/area').default

var sm = new SphericalMercator({
  size: 256
})

module.exports = {
  async createTilesGeoTiff (inputFile) {
    const bbox = await this.getBoundingBox(inputFile)
    console.log(bbox)
    const poly = bboxPolygon(bbox)
    const area = turfArea(poly) / 1000000
    console.log('raster area (km2):' + area)
    let maxzoom
    if (area <= 1000) {
      maxzoom = 14
    } else if (area <= 10000) {
      maxzoom = 12
    } else if (area <= 100000) {
      maxzoom = 9
    } else {
      maxzoom = 7
    }
    console.log('using maxzoom: ' + maxzoom)

    const options = { minzoom: 1, maxzoom }
    const srcuri = `raster+file://${inputFile}`
    const uuid = uuidv4()
    const dsturi = `file://${config.STORAGE_PATH}/gtu/${uuid}/`
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
      tiles: [
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
    await new Promise((resolve, reject) => {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.writeFile(`${config.STORAGE_PATH}/gtu/${uuid}/tile.json`, JSON.stringify(tileJSON), (error) => {
        if (error) reject(error)
        else resolve()
      })
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
        console.log(info)
        if (error) reject(error)
        resolve(info)
      })
    })
    const options = { minzoom: info.minzoom, maxzoom: info.maxzoom }
    const srcuri = `mbtiles://${inputFile}`
    const uuid = uuidv4()
    const dsturi = `file://${config.STORAGE_PATH}/gtu/${uuid}/?filetype=${info.format}`
    const tileJSON = {
      name: uuid,
      type: 'overlay',
      version: '1',
      format: info.format,
      minzoom: options.minzoom,
      maxzoom: options.maxzoom,
      scale: 1,
      generator: 'MapHubs',
      profile: 'mercator',
      scheme: 'xyz',
      bounds: info.bounds,
      tilejson: '2.0.0',
      tiles: [
        `${config.CDN_URL}/tiles/gtu/${uuid}/{z}/{x}/{y}.${info.format}`
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

    await new Promise((resolve, reject) => {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.writeFile(`${config.STORAGE_PATH}/gtu/${uuid}/tile.json`, JSON.stringify(tileJSON), (error) => {
        if (error) reject(error)
        else resolve()
      })
    })
    return tileJSON
  },

  async getBoundingBox (inputFile) {
    const tiff = await GeoTIFF.fromFile(inputFile)
    const image = await tiff.getImage()
    const epsg = image.geoKeys.ProjectedCSTypeGeoKey || image.geoKeys.GeographicTypeGeoKey
    log.info('epsg:' + epsg)
    if (epsg !== 4326 && epsg !== 3857) {
      throw new Error('unsupported SRS - epsg:' + epsg)
    }
    let bbox = image.getBoundingBox()

    if (epsg === 3857) {
      log.info('converting bounds to wgs84')
      bbox = sm.convert(bbox, 'WGS84')
    }
    log.info(bbox)
    return bbox
  }
}
