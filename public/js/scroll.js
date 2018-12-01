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
            console.log(html);
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
console.log(window.location.pathname + window.location.search);

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
            $(location).attr("href", window.location.pathname + "?sort=" + $('#inputSort').val());
        })

        $('#inputFilter').click((event) => {
            // alert("kikou");
            $(location).attr("href", "/search?filter=" + "age" + valSlideAge + "pop" + valSlidePop + "loc" + valSlideLoc);
        })
    });
});