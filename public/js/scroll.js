var i=12;
var end = 0;

	// Initilaize sliders

var slideAge = $("#slideAge").slider();
var slidePop = $("#slidePop").slider();
var slideLoc = $("#slideLoc").slider();
var valSlideAge = slideAge.slider('getValue');
var valSlidePop = slidePop.slider('getValue');
var valSlideLoc = slideLoc.slider('getValue');

$('#slideAge').change((event) => {
    valSlideAge = slideAge.slider('getValue');
});

$('#slidePop').change((event) => {
    valSlidePop = slidePop.slider('getValue');
});

$('#slideLoc').change((event) => {
    valSlideLoc = slideLoc.slider('getValue');
});

    // Scroll fuction

const   requestNextPage = () => {
    $.ajax({
        method: "GET",
        data: {
            index:i,
        },
        url: window.location.pathname + window.location.search,
        success: function(html) {
			$('#container').append(html);
            $('#loading').hide();
            if (typeof html == typeof {}){
                end = 1;
            }
        },
        error: function() {
            $('#loading').hide();
        },
        complete: function(){
            $('#loading').hide();
        }
    });
}

	// Scripts for search page

$(function () {
    $(document).ready(function() {
        var win = $(window);
        win.scroll(function() {
            if ($(document).height() - win.height() == win.scrollTop() && end == 0) {
                $('#loading').show();
                requestNextPage();
                i=i+12;
            }
        });

        $('#inputSort').change((event) => {
			if (window.location.search && window.location.search.substring(1, 5) == "sort"){
                $(location).attr("href", window.location.pathname + "?sort=" + $('#inputSort').val());
			} else if (window.location.search && window.location.search.substring(1, 7) == "filter"){
                if (window.location.search.indexOf("&sort") != -1){
                    $(location).attr("href", window.location.pathname + window.location.search.substring(0, window.location.search.indexOf("&sort")) + "&sort=" + $('#inputSort').val());
				} else {
                    $(location).attr("href", window.location.pathname +  window.location.search + "&sort=" + $('#inputSort').val());
				}
			} else {
                $(location).attr("href", window.location.pathname + "?sort=" + $('#inputSort').val());
            }            
        })

        $('#inputFilter').click((event) => {
            if (1){
                $(location).attr("href", "/search?filter=" + "age" + valSlideAge + "pop" + valSlidePop + "loc" + valSlideLoc + "tag" + tags);
            } else {
                $(location).attr("href", "/search?filter=" + "age" + valSlideAge + "pop" + valSlidePop + "loc" + valSlideLoc);
            }
		})
    });
});