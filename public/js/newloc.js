function forceGeo() {
	console.log("FORCE GEOLOC")
	// const ipstack = require('ipstack')

	// ipstack("35.180.139.188","31f49d56e09d0468b0ac0349dfdb75fe",(err, response) => {
	// 	console.log(response)
	// });
	// gerer la localisation de force ICI
}

$(function () {
	$(document).ready(function() {
		console.log("1ere geoloc");
		getLocation(2);
		console.log(getLocation(2));
	});
});