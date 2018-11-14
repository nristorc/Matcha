$(function () {
		$(document).ready(function() {

			document.getElementById("sort-age").addEventListener("click", sortAge);;
			document.getElementById("sort-loc").addEventListener("click", sortLoc);;
			document.getElementById("sort-pop").addEventListener("click", sortPop);;

			
			function sortAge(){
				$.ajax({
					method: "GET",
					data: {
						sort: "ORDER by age"
					},
					// url: 'search',
				});
			}
			function sortLoc(){
				$.ajax({
					method: "GET",
					data: {
						sort: "ORDER by loc"
					},
					// url: 'search',
				});
			}

			function sortPop(){
				$.ajax({
					method: "GET",
					data: {
						sort: " ORDER by `popularity`"
					},
					// url: 'search',
				});
			}



			// age.onclick(function() {

				// if ($(document).height() - win.height() == win.scrollTop() && end == 0) {
				// 	$('#loading').show();
				// 	i=i+6;
				// }
			// });
		});
});
