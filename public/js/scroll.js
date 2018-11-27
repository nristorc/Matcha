var i=6;
var end = 0;

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
            $(location).attr("href", "/search?sort=" + $('#inputSort').val());
        })
    });
});