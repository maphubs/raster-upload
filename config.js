require('dotenv').config()
const getenv = require('getenv')
var path = require('path')

const config = {
  API_KEY: getenv('API_KEY'),
  CDN_URL: getenv('CDN_URL'),
  STORAGE_PATH: getenv('STORAGE_PATH', path.join(__dirname, '/temp/tiles')),
  UPLOAD_TEMP_PATH: getenv('UPLOAD_TEMP_PATH', path.join(__dirname, '/temp'))
}

module.exports = config
