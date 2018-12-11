const ipstack = require('./index')

ipstack("8.8.8.8","",(err, response) => {
  console.log(response)
})