var i=6;
var end = 0;

var slideAge = $("#slideAge").slider();
var slidePop = $("#slidePop").slider();
var slideLoc = $("#slideLoc").slider();
var valSlideAge = slideAge.slider('getValue');
var valSlidePop = slidePop.slider('getValue');
var valSlideLoc = slideLoc.slider('getValue');

$('#slideAge').change((event) => {
    valSlideAge = slideAge.slider('getValue');
    console.log("age : ", valSlideAge);
});

$('#slidePop').change((event) => {
    valSlidePop = slidePop.slider('getValue');
	console.log("pop : ", valSlidePop);
});

$('#slideLoc').change((event) => {
    valSlideLoc = slideLoc.slider('getValue');
	console.log("loc : ", valSlideLoc);
});

const   requestNextPage = () => {
    $.ajax({
        method: "GET",
        data: {
            index:i  
        },
        url: window.location.pathname + window.location.search,
        success: function(html) {
            $('.scroll').append(html);
            $('#loading').hide();
            if (html == ""){
                end = 1;
            }
        },
        error: function() {
            $('#loading').hide();
        },
        complete: function(jqXHR, status){
            $('#loading').hide();
        }
    });
}

$(function () {
    $(document).ready(function() {
        var win = $(window);
        win.scroll(function() {
            if ($(document).height() - win.height() == win.scrollTop() && end == 0) {
                $('#loading').show();
                requestNextPage()
                i=i+6;
            }
        });
        $('#inputSort').change((event) => {
			if (window.location.search && window.location.search.substring(1, 5) == "sort"){
				// alert("1");
				$(location).attr("href", window.location.pathname + "?sort=" + $('#inputSort').val());
			} else if (window.location.search && window.location.search.substring(1, 7) == "filter"){
				if (window.location.search.indexOf("&sort") != -1){
					$(location).attr("href", window.location.pathname + window.location.search.substring(0, window.location.search.indexOf("&sort")) + "&sort=" + $('#inputSort').val());
				} else {
					$(location).attr("href", window.location.pathname +  window.location.search + "&sort=" + $('#inputSort').val());
				}
			} else {
				// alert("4");
				$(location).attr("href", window.location.pathname + "?sort=" + $('#inputSort').val());
			}
        })

        $('#inputFilter').click((event) => {
            $(location).attr("href", "/search?filter=" + "age" + valSlideAge + "pop" + valSlidePop + "loc" + valSlideLoc);
        })
    });
});