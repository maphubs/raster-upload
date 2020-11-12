require('@babel/register')
const tiles = require('./lib/tiles')

const input = './data/out.mbtiles'

tiles.createTilesMBTiles(input).then((tileJSON) => {
  console.log(tileJSON)
  console.log('FINISHED')
  process.exit(1) // eslint-disable-line unicorn/no-process-exit
})
