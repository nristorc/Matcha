# ip-validator
Super simple IP Address validator for ipv4 &amp; ipv6

```javascript
var validate = require('ip-validator');

var ipv4 = "212.212.100.110"
var ipv6 = "0000:0000:0000:0000:0000:0000:0000:0001"

validate.ipv4(ipv4); // true
validate.ipv4(ipv6); // false

validate.ipv6(ipv4); // false
validate.ipv6(ipv6); // true

validate.ip(ipv4); // true
validate.ip(ipv6); // true

```
