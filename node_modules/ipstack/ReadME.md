## Ipstack api wrapper for nodejs

Simple ip geolocation api based on ipstack.com

### Install

You need to get you're api key from here: https://ipstack.com/signup/free and you'll get 10k free requests/month

```
npm install --save ipstack
```

### Usage

```js

const ipstack = require('ipstack')

ipstack("8.8.8.8","<your ipstack api key>",(err, response) => {
  console.log(response)
})
```

#### Example output

```json
{ ip: '8.8.8.8',
  type: 'ipv4',
  continent_code: 'NA',
  continent_name: 'North America',
  country_code: 'US',
  country_name: 'United States',
  region_code: null,
  region_name: null,
  city: null,
  zip: null,
  latitude: 37.751,
  longitude: -97.822,
  location:
   { geoname_id: null,
     capital: 'Washington D.C.',
     languages: [ [Object] ],
     country_flag: 'http://assets.ipstack.com/flags/us.svg',
     country_flag_emoji: '🇺🇸',
     country_flag_emoji_unicode: 'U+1F1FA U+1F1F8',
     calling_code: '1',
     is_eu: false } }
```