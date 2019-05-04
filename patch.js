var semver = require('semver')
var fs = require('fs')
var version = require('./version.json').version
var patch = semver.inc(version, 'patch')

fs.writeFile('./version.json', JSON.stringify({ 'version': patch }), (error) => {
  if (error) {
    console.error(error)
  } else {
    console.log(version + ' -> ' + patch)
  }
})
