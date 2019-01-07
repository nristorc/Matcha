var x=document.getElementById("localisation");

function getLocation(flag){
	if (flag == 1){
		if (navigator.geolocation){
			navigator.geolocation.getCurrentPosition(showPosition,showError1);
		} else {
			x.innerHTML="Geolocation is not supported by this browser.";
		}
	} else if (flag == 2) {
		if (navigator.geolocation){
			navigator.geolocation.getCurrentPosition(showPosition,showError2);
		} else {
			x.innerHTML="Geolocation is not supported by this browser.";
		}
	} else {
		if (navigator.geolocation){
			navigator.geolocation.getCurrentPosition(showPosition,showError);
		} else {
			x.innerHTML="Geolocation is not supported by this browser.";
		}
	}
}

function showPosition(position){
    lat=position.coords.latitude;
    lon=position.coords.longitude;
    displayLocation(lat,lon);
}

function showError(error){
    switch(error.code){
        case error.PERMISSION_DENIED:
			x.innerHTML="Localisation non renseignée";
        break;
        case error.POSITION_UNAVAILABLE:
            x.innerHTML="Location information is unavailable."
        break;
        case error.TIMEOUT:
            x.innerHTML="The request to get user location timed out."
        break;
        case error.UNKNOWN_ERROR:
            x.innerHTML="An unknown error occurred."
        break;
    }
}

function showError1(error){
	switch(error.code){
			case error.PERMISSION_DENIED:
				alert("Veuillez autoriser la géolocalisation de votre appareil.");
			break;
			case error.POSITION_UNAVAILABLE:
					x.innerHTML="Location information is unavailable."
			break;
			case error.TIMEOUT:
					x.innerHTML="The request to get user location timed out."
			break;
			case error.UNKNOWN_ERROR:
					x.innerHTML="An unknown error occurred."
			break;
	}
}

function showError2(error){
	switch(error.code){
			case error.PERMISSION_DENIED:
				x.innerHTML="Localisation non renseignée";
			break;
			case error.POSITION_UNAVAILABLE:
					x.innerHTML="Location information is unavailable."
			break;
			case error.TIMEOUT:
					x.innerHTML="The request to get user location timed out."
			break;
			case error.UNKNOWN_ERROR:
					x.innerHTML="An unknown error occurred."
			break;
	}
}

function displayLocation(latitude,longitude){
    var geocoder;
    geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(latitude, longitude);

    geocoder.geocode(
        {'latLng': latlng}, 
        function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
								if (results[0]) {
									// choose from console whatever you need.
									var city = results[0].address_components[3].short_name;
									x.innerHTML = "À " + city;
									var data = {
										'latitude': latitude,
										'longitude': longitude,
										'city': city,
										'change': "N"
									};
									$.ajax({
											type : "POST",
											url : "/profil",
											data : data,
									});	
								}
                else  {
                    x.innerHTML = "address not found";
                }
            }
            else {
                x.innerHTML = "Geocoder failed due to: " + status;
            }
        }
    );
}