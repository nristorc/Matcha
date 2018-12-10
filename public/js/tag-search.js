function tagSearch() {
    // console.log("je test");
    if ($('#divTagSearch').length === 0) {
        const div = document.createElement('div');
        $('.navbar-nav').append(div);
        div.id = 'divTagSearch';
    }

    $(document).on('keyup', function () {
        // $('#accessProfil').remove();
        const query = $('#searchTag').val();
        if (query.length > 1) {
            var formData = {
                'search': 1,
                'q': query
            };
            $.ajax({
                type: 'POST',
                url: '/search',
                data: formData,
                dataType: 'json',
                encode: true
            })
                .done(function (data) {


                    console.log('data', data)
                    console.log('length', $('#response').length);

                    if (data.res == ''){
                        console.log('pas de match')
                    }

                    if ($('#response').length === 0 && data.res != '') {
                        const ul = document.createElement('ul');
                        $('#divTagSearch').append(ul);
                        ul.setAttribute('id', 'response');
                        ul.setAttribute('style', 'position: absolute;');
                    }
                    $('#response').html(data.res);

                    $(document).on('click', 'li', function(){

                        var username = $(this).text();
                            console.log('data', data.userdata);
                            $('#searchTag').val(username);

                            $('#response').html("");
                            $('ul').remove();

                            if ($('#accessProfil').length === 0) {

                                console.log('data', data.userdata);


                                const button = document.createElement('button');
                                $('#divTagSearch').append(button);
                                button.setAttribute('id', 'accessProfil');
                                button.setAttribute('class', 'btn btn-alert login-btn');
                                button.innerHTML = 'Accéder au profil';

                                button.onclick = (elem) => {
                                    console.log('userdata', data.userdata.length)
                                    for (var i = 0; i < data.userdata.length; i++) {
                                        if ($('#searchTag').val() === data.userdata[i].username) {
                                            $(location).attr('href', '/user/' + data.userdata[i].id);
                                        }
                                    }
                                }
                            }
                        // }
                    });

                });
        } else {
            if (query.length <= 1) {
                $('ul').remove();
            }
        }
    });
}

// function deleteTag(tag) {
//     const delTag = tag.innerHTML.substring(1);

//     var formData = {
//         'tag': delTag,
//         'submit': 'deleteTag'
//     }

//     $.ajax({
//         type		: 'POST',
//         url		: '/profil',
//         data		: formData,
//         dataType	: 'json',
//         encode		: true
//     })
//         .done(function (data) {
//             console.log('delete Pic data: ', data);
//             if (data.errors) {
//                 if (document.getElementById('messages')) {
//                     const flash = document.getElementsByClassName('alert');
//                     flash[0].className = 'alert alert-warning alert-dismissible';
//                     flash[0].innerHTML = data.errors;
//                 } else {
//                     $('#container').prepend('<div id="messages"></div>');
//                     $('#messages').append('<div class="alert alert-warning alert-dismissible">' + data.errors + '</div>')
//                 }
//             } else if (data.message) {
//                     tag.remove();
//                     $('#addTag').show();
//             }
//         });
//     }


// $(function () {

// 	$(document).ready(function() {
// 		$('#addTag').on('keydown', (e) => {
// 			var k = e.which || e.key
// 			if(/^(9)$/.test(k)) {
// 				$(this).value = ""
// 				//console.log("Tabulation catch:" + k)
// 				e.preventDefault()
// 			}
// 			if(/^(188|13)$/.test(k)) {
// 				//console.log("Submit form:"+ $(this))
// 				validFormTag();
// 			}
// 		})

// 		const validFormTag = () => {
// 			//console.log($("#addTag")[0].value);
// 			if ($('.hashtag').length < 6) {
// 				//console.log("Submit call")

// 				var inputTag = $('#addTag')[0]
// 				var addedTag = $("#addTag")[0].value;
// 				var match = new RegExp('^[a-zA-Z]+$');

// 				if (match.test(addedTag) === true) {
// 					const formData = {
// 						'tag': addedTag,
// 						'submit': 'addTag'
// 					};

// 					$.ajax({
// 						type		: 'POST',
// 						url		: '/profil',
// 						data		: formData,
// 						dataType	: 'json',
// 						encode		: true
// 					})
// 						.done((data) => {
// 							if (data.errors) {
// 								if (document.getElementById('messages')) {
// 									const flash = document.getElementsByClassName('alert');
// 									// console.log('flash', flash);
// 									flash[0].className = 'alert alert-warning alert-dismissible';
// 									flash[0].innerHTML = data.errors;
// 								} else {
// 									$('#container').prepend('<div id="messages"></div>');
// 									$('#messages').append('<div class="alert alert-warning alert-dismissible">' + data.errors + '</div>')
// 								}
// 							} else {
// 								if (document.getElementById('messages')) {
// 									$('#messages').remove();
// 								}
// 								// console.log("Je dois ajouter un tag")
// 								// console.log(addedTag)
// 								if(addedTag) $('#addTag').before('<a class="btn btn-primary hashtag" href="#" role="button" onclick="deleteTag(this)">#'+ addedTag +'</a>');
// 								inputTag.value = ""
// 								inputTag.focus();
// 							}
// 							if ($(".hashtag").length === 6) {
// 								$("#addTag").hide();
// 							}
// 						});
// 				} else {
// 					if (document.getElementById('messages')) {
// 						const flash = document.getElementsByClassName('alert');
// 						// console.log('flash', flash);
// 						flash[0].className = 'alert alert-warning alert-dismissible';
// 						flash[0].innerHTML = "Mauvais format de tag";
// 					} else {
// 						$('#container').prepend('<div id="messages"></div>');
// 						$('#messages').append('<div class="alert alert-warning alert-dismissible">Mauvais format de tag JQUERY</div>')
// 					}
// 				}

// 			}
// 		}
// 	});
// });