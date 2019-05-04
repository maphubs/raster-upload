require('@babel/register')
const tiles = require('./lib/tiles')

const input = './data/test.mbtiles'
const output = 's1test'

tiles.createTilesMBTiles(input, output).then((tileJSON) => {
  console.log(tileJSON)
  console.log('FINISHED')
  process.exit(1) // eslint-disable-line unicorn/no-process-exit
})
