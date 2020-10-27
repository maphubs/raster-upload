const express = require('express')
const cors = require('cors')
const upload = require('./lib/upload')
const bodyParser = require('body-parser')
const config = require('./config')

const PORT = 4008

const app = express()
app.enable('trust proxy')
app.disable('x-powered-by')
app.use('*', cors({ origin: '*' }))

app.use('/tiles', express.static(config.STORAGE_PATH))

// check if API key is present
app.use((request, response, next) => {
  if (request.headers.authorization) {
    const authParts = request.headers.authorization.split(' ')
    if (authParts && authParts.length === 2 &&
      authParts[0] === 'Bearer' &&
      authParts[1] === config.API_KEY) {
      next()
      return true
    }
  }
  response.status(401).send('API key required')
})

app.use(bodyParser.json({ limit: '250mb' }))
upload(app)

app.use((error, request, response, next) => {
  const statusCode = error.status || 500
  if (request.accepts('json')) {
    response.status(statusCode).send({
      error: error.message,
      url: request.url
    })
  } else {
    response.status(statusCode).send(error.message)
  }
})

// eslint-disable-next-line no-console
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
