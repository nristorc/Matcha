const http = require('http')

const ipstack = (ip, token, callback) => {
  if(callback === null){
    console.error("Please provide a callback!")
    return
  }
  http.get({
    hostname: 'api.ipstack.com',
    port: 80,
    path: `/${ip}?access_key=${token}`,
    agent: false  
  }, (res) => {
    var body = ""
    res.on('data', data => {
      body +=data
    })
    res.on('end', () => {
      body = JSON.parse(body)
      let {error} = body
      if(error !== undefined){
        callback(error, null)
      } else {
        callback(null, body)
      }
    })
    res.on('error', err => {
      callback(err, null)
    })
    
  });
}

module.exports = ipstack
