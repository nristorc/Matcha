var x = document.getElementById("demo");

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else { 
        x.innerHTML = "Geolocation is not supported by this browser.";
    }
}

function showPosition(position) {
    x.innerHTML = "Latitude: " + position.coords.latitude + 
    "<br>Longitude: " + position.coords.longitude;
}

// <button onclick="getLocation()">Try It</button>
// <p id="demo"></p>


	// This example displays an address form, using the autocomplete feature
	// of the Google Places API to help users fill in the information.

	// This example requires the Places library. Include the libraries=places
	// parameter when you first load the API. For example:
	// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">

	var placeSearch, autocomplete;
	// var componentForm = {
	//   street_number: 'short_name',
	//   route: 'long_name',
	//   locality: 'long_name',
	//   administrative_area_level_1: 'short_name',
	//   country: 'long_name',
	//   postal_code: 'short_name'
	// };

	function initAutocomplete() {
	  // Create the autocomplete object, restricting the search to geographical
		// location types.
		var option = {
			types: ['(regions)'],
			componentRestrictions: {country: "fr"}
		};
	  autocomplete = new google.maps.places.Autocomplete(
	 	document.getElementById('autocomplete'), option);

	  // When the user selects an address from the dropdown, populate the address
	  // fields in the form.
		autocomplete.addListener('place_changed', function(){
			var place = autocomplete.getPlace();
        if (!place.geometry) {
          window.alert("Aucune correpondance trouvée pour : '" + place.name + "'");
          return;
				}
				if (autocomplete.getPlace().vicinity && !document.getElementById('localisation')) {
					$('#autocomplete').before('<p id="localisation">À '+autocomplete.getPlace().vicinity+'</p>');
				} else if (autocomplete.getPlace().vicinity && document.getElementById('localisation')) {
					document.getElementById("localisation").innerHTML = "À " + autocomplete.getPlace().vicinity;
				}
				console.log("place", place.address_components);
				console.log("LONG place", place.address_components[0].long_name);
				// console.log("SHORT place", place.address_components[0].short_name);
				var latitude = place.geometry.location.lat();
				var longitude = place.geometry.location.lng(); 
				console.log("latitude", latitude);
				console.log("longitude", longitude);
				console.log("autocomplete.getPlace()", autocomplete.getPlace().vicinity);
				var data = {
					'latitude': latitude,
					'longitude': longitude,
					'city': autocomplete.getPlace().vicinity
				};
				$.ajax({
					type : "POST",
					url : "/profil",
					data : data,
				});
		});
		// $('#autocomplete').val() = "";
	}
9
	// function fillInAddress() {
	//   // Get the place details from the autocomplete object.
	// 	var place = autocomplete.getPlace();
	// 	console.log("fillInAddress")

	//   for (var component in componentForm) {
	// 	document.getElementById(component).value = '';
	// 	document.getElementById(component).disabled = false;
	//   }

	//   // Get each component of the address from the place details
	//   // and fill the corresponding field on the form.
	//   for (var i = 0; i < place.address_components.length; i++) {
	// 	var addressType = place.address_components[i].types[0];
	// 	if (componentForm[addressType]) {
	// 	  var val = place.address_components[i][componentForm[addressType]];
	// 	  document.getElementById(addressType).value = val;
	// 	}
	//   }
	// }

	// Bias the autocomplete object to the user's geographical location,
	// as supplied by the browser's 'navigator.geolocation' object.
	function geolocate() {
		console.log("geolocate");
	  if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
		  var geolocation = {
			lat: position.coords.latitude,
			lng: position.coords.longitude
		  };
		  var circle = new google.maps.Circle({
			center: geolocation,
			radius: position.coords.accuracy
		  });
		  autocomplete.setBounds(circle.getBounds());
		});
	  }
	}

function test() {
	console.log("kikou");
	var address = $('#autocomplete').val();
	if(address) $('#autocomplete').before(" "+address+' ');
}

