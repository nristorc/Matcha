function forceGeo() {
	// console.log("FORCE GEOLOC")
}

$(function () {
	$(document).ready(function() {
		console.log("1ere geoloc");
		getLocation(2);
		console.log(getLocation(2));
	});
});