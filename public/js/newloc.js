function test() {
	console.log("HELP")
	// gerer la localisation de force ICI
}

$(function () {
	$(document).ready(function() {
		console.log("1ere geoloc");
		getLocation(2);
		console.log(getLocation(2));
	});
});