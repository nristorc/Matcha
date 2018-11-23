$(function () {
    $(document).ready(function() {
        var i=6;
        var win = $(window);
        var end = 0;
        win.scroll(function() {
            if ($(document).height() - win.height() == win.scrollTop() && end == 0) {
                $('#loading').show();
                $.ajax({
                    method: "GET",
                    data: {
                        index:i
                    },
                    url: 'search',
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
                i=i+6;
            }
        });
    });
});