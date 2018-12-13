var i=6;
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

	// Tag function

	const validFormTag = () => {
		console.log("i'm lost");
		// if ($('.hashtag').length < 6) {
			//console.log("Submit call")

			var inputTag = $('#searchTag')[0]
			var addedTag = $("#searchTag")[0].value;
			var match = new RegExp('^[a-zA-Z]+$');

			if (match.test(addedTag) === true) {
				const formData = {
					'tag': addedTag,
					'submit': 'searchTag'
				};

				$.ajax({
					type		: 'POST',
					url		: '/profil',
					data		: formData,
					dataType	: 'json',
					encode		: true
				})
					.done((data) => {
						if (data.errors) {
							if (document.getElementById('messages')) {
								const flash = document.getElementsByClassName('alert');
								// console.log('flash', flash);
								flash[0].className = 'alert alert-warning alert-dismissible';
								flash[0].innerHTML = data.errors;
							} else {
								$('#container').prepend('<div id="messages"></div>');
								$('#messages').append('<div class="alert alert-warning alert-dismissible">' + data.errors + '</div>')
							}
						} else {
							if (document.getElementById('messages')) {
								$('#messages').remove();
							}
							// console.log("Je dois ajouter un tag")
							// console.log(addedTag)
							if(addedTag) $('#searchTag').before('<a class="btn btn-primary hashtag" href="#" role="button" onclick="deleteTag(this)">#'+ addedTag +'</a>');
							inputTag.value = ""
							inputTag.focus();
						}
						if ($(".hashtag").length === 6) {
							$("#searchTag").hide();
						}
					});
			} else {
				if (document.getElementById('messages')) {
					const flash = document.getElementsByClassName('alert');
					// console.log('flash', flash);
					flash[0].className = 'alert alert-warning alert-dismissible';
					flash[0].innerHTML = "Mauvais format de tag";
				} else {
					$('#container').prepend('<div id="messages"></div>');
					$('#messages').append('<div class="alert alert-warning alert-dismissible">Mauvais format de tag JQUERY</div>')
				}
			}

		// }
	}

	// Scripts for search page

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
                $(location).attr("href", "/search?filter=" + "age" + valSlideAge + "pop" + valSlidePop + "loc" + valSlideLoc + "tag" + $('#addTag').val());
                // console.log($('#searchTag').val());
                // console.log("salut la compagnie");
            } else {
                $(location).attr("href", "/search?filter=" + "age" + valSlideAge + "pop" + valSlidePop + "loc" + valSlideLoc);
            }
		})
		
		// $('#searchTag').on('keydown', (e) => {
		// 	var k = e.which || e.key
		// 	if(/^(9)$/.test(k)) {
		// 		$(this).value = ""
		// 		//console.log("Tabulation catch:" + k)
		// 		e.preventDefault()
		// 	}
		// 	if(/^(188|13)$/.test(k)) {
		// 		//console.log("Submit form:"+ $(this))
		// 		validFormTag();
		// 	}
		// })
    });
});