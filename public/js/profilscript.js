function initAutocomplete() {
    var placeSearch, autocomplete;
      var option = {
          types: ['(regions)'],
          componentRestrictions: {country: "fr"}
      };
    autocomplete = new google.maps.places.Autocomplete(
       document.getElementById('autocomplete'), option);

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
              var latitude = place.geometry.location.lat();
              var longitude = place.geometry.location.lng();
              var data = {
                  'latitude': latitude,
                  'longitude': longitude,
                  'city': autocomplete.getPlace().vicinity,
                  'change': "Y"
              };
              $.ajax({
                  type : "POST",
                  url : "/profil",
                  data : data,
              })
              .done(function() {
                document.getElementById('autocomplete').blur();    
                setTimeout(function(){
                    document.getElementById('autocomplete').value = '';
                },10); 
              });
      });
  }

function deleteTag(tag) {
    const delTag = tag.innerHTML.substring(1);

    var formData = {
        'tag': delTag,
        'submit': 'deleteTag'
    };

    $.ajax({
        type		: 'POST',
        url		: '/profil',
        data		: formData,
        dataType	: 'json',
        encode		: true
    })
        .done(function (data) {
            if (data.errors) {
                if (document.getElementById('messages')) {
                    const flash = document.getElementsByClassName('alert');
                    flash[0].className = 'alert alert-warning alert-dismissible';
                    flash[0].innerHTML = data.errors;
                } else {
                    $('#container').prepend('<div id="messages"></div>');
                    $('#messages').append('<div class="alert alert-warning alert-dismissible">' + data.errors + '</div>')
                }
            } else if (data.message) {
                    tag.remove();
                    $('#addTag').show();
            }
        });
}

function deletePic(image) {
    const srcImg = image.previousElementSibling.children[0];

    console.log(srcImg.src);

    var formData = {
        'image': srcImg.src,
        'submit': 'deletePic'
    };

    $.ajax({
        type		: 'POST',
        url		: '/profil',
        data		: formData,
        dataType	: 'json',
        encode		: true
    })
        .done(function (data) {
            if (data.errors) {
                if (document.getElementById('messages')) {
                    const flash = document.getElementsByClassName(`alert alert-${data.type} alert-dismissible`);
                    if (flash.length > 0) {
                        flash[0].innerHTML = data.errors;
                    }
                } else {
                    $('#container').prepend('<div id="messages"></div>');
                    $('#messages').append(`<div class="alert alert-${data.type} alert-dismissible">${data.errors}</div>`)
                }
            }
            else if (data.message && data.image) {
                if (document.getElementById('messages')) {
                    const flash = document.getElementsByClassName(`alert alert-${data.type} alert-dismissible`);
                    if (flash.length > 0) {
                        flash[0].innerHTML = data.message;
                    }
                } else {
                    $('#container').prepend('<div id="messages"></div>');
                    $('#messages').append(`<div class="alert alert-${data.type} alert-dismissible">${data.message}</div>`)
                }
                if (data.image && data.flag === 'profil') {
                    const avatar = document.getElementById('avatarPic');
                    avatar.src = 'public/img/avatarDefault.png';
                }
                image.parentElement.remove();
                if (($('.img-thumbnail.carroussel').length) < 5) {
                    $('form[id=uploadPics]').show();
                }

            }
        });

}

function changePic(image) {
    event.preventDefault();
    const srcImg = image.children[0];

    var formData = {
        'image': srcImg.src,
        'submit': 'updateProfilPic'
    };

    $.ajax({
        type		: 'POST',
        url		: '/profil',
        data		: formData,
        dataType	: 'json',
        encode		: true
    })
        .done(function (data) {
            if (data.errors) {
                if (document.getElementById('messages')) {
                    const flash = document.getElementsByClassName(`alert alert-${data.type} alert-dismissible`);
                    if (flash.length > 0) {
                        flash[0].innerHTML = data.errors;
                    }
                } else {
                    $('#container').prepend('<div id="messages"></div>');
                    $('#messages').append(`<div class="alert alert-${data.type} alert-dismissible">${data.errors}</div>`)
                }
            } else if (data.message) {
                if (document.getElementById('messages')) {
                    const flash = document.getElementsByClassName(`alert alert-${data.type} alert-dismissible`);
                    if (flash.length > 0) {
                        flash[0].innerHTML = data.message;
                    }
                } else {
                    $('#container').prepend('<div id="messages"></div>');
                    $('#messages').append(`<div class="alert alert-${data.type} alert-dismissible">${data.message}</div>`)
                }
                if (data.image) {
                    const avatar = document.getElementById('avatarPic');
                    avatar.src = data.image;

                    for (var i = 0; i < document.getElementsByClassName('img-thumbnail').length; i++) {
                        if (document.getElementsByClassName('img-thumbnail')[i] !== srcImg) {
                            document.getElementsByClassName('img-thumbnail')[i].style.border = 'none';
                        }
                    }
                    srcImg.style = 'border: solid rgb(255, 0, 100) thick';
                }
            }

        });
}

$(function () {

    $(document).ready(function() {

        if ($(".hashtag").length === 6) {
            $("#addTag").hide();
        }

        for (var i = 0; i < document.getElementsByClassName('img-thumbnail carroussel').length; i++){
            if (document.getElementsByClassName('img-thumbnail carroussel')[i].src === document.getElementById('avatarPic').src) {
                document.getElementsByClassName('img-thumbnail carroussel')[i].style = 'border: solid rgb(225, 0, 100) thick';
            }
        }

        $("#inputFile").change(function() {
            $("#uploadPics").submit();
        });

        if (($('.img-thumbnail.carroussel').length) === 5) {
            $('form[id=uploadPics]').hide();
        }

        $('#exampleModalCenter').modal('show');

        if ($('#birthdate').val()) {
            let now = new Date($('#birthdate').val());
            let options = {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
            };
            $("#birthdate").attr("value", now.toLocaleString('en-GB', options));
        }

        if ($('#birth').val()) {
            let now = new Date($('#birth').val());
            let options = {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
            };
            $("#birth").attr("value", now.toLocaleString('en-GB', options));
        }

        $('form[id=saveProfile]').submit(function(event) {

            $('.form-group').removeClass('has-error'); // remove the error class
            $('.help-block').remove(); // remove the error text

            // get the form data
            // there are many ways to get this data using jQuery (you can use the class or id also)
            var formData = {
                'gender'              : $('select[name=gender]').val(),
                'birthdate'             : $('input[name=birthdate]').val(),
                'orientation'    : $('select[name=orientation]').val(),
                'description'    : $('textarea[name=description]').val(),
                'submit': 'createProfile'
            };

            // process the form
            $.ajax({
                type        : 'POST', // define the type of HTTP verb we want to use (POST for our form)
                url         : '/profil', // the url where we want to POST
                data        : formData, // our data object
                dataType    : 'json', // what type of data do we expect back from the server
                encode		: true
            })
            // using the done promise callback
                .done(function(data) {
                    // here we will handle errors and validation messages
                    if (data.errors) {
                        for (var i = 0; i < data.errors.length; i++) {
                            $('#modal-body1').addClass('has-error'); // add the error class to show red input
                            $('#modal-body1').prepend('<div class="help-block alert alert-warning">' + data.errors[i].msg + '</div>'); // add the actual error message under our input
                        }
                    } else {
                        if (data.user) {

                            $('#exampleModalCenter').modal('hide');
                            const genderOrientation = document.getElementById('genderOrientation');
                            const description = document.getElementById('desc');
                            const birthdate = document.getElementById('displayAge');
                            genderOrientation.innerHTML = data.user.gender + ', ' + data.user.orientation;
                            description.innerHTML = data.user.description;

                            var date = new Date(data.user.birth);
                            var year = date.getFullYear();
                            var month = date.getMonth();
                            var day = date.getDate();
                            var today = new Date();

                            var age = today.getFullYear() - year;
                            if (today.getMonth() < month || (today.getMonth() === month && today.getDate() < day)) {
                                age--;
                            }

                            birthdate.innerHTML = age + ' ans';

                            if (document.getElementById('messages')) {
                                const flash = document.getElementsByClassName('alert');
                                flash[0].className = 'alert alert-dark alert-dismissible';
                                flash[0].innerHTML = 'Votre profil RoooCool a été créé avec succès';
                            } else {
                                $('#container').prepend('<div id="messages"></div>');
                                $('#messages').append('<div class="alert alert-dark alert-dismissible">Votre profil RoooCool a été créé avec succès</div>')
                            }

                            let options = {
                                year: 'numeric',
                                month: 'numeric',
                                day: 'numeric',
                            };
                            $("#birth").attr("value", date.toLocaleString('en-GB', options));

                            document.getElementById("editDescription").value = data.user.description;
                            document.getElementById("editDescription").innerHTML = document.getElementById("editDescription").value;


                            //Update dans profil de Orientation + Genre
                            document.getElementById('editOrientation').value = data.user.orientation;

                            document.getElementById('editGender').value = data.user.gender;

                        }
                    }
                });
            event.preventDefault();
        });



        function getCookie(cname) {
            var name = cname + "=";
            var decodedCookie = decodeURIComponent(document.cookie);
            var ca = decodedCookie.split(';');
            for(var i = 0; i <ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
        }

        function setCookie(cname, cvalue, exdays) {
            var d = new Date();
            d.setTime(d.getTime() + (exdays*24*60*60*1000));
            var expires = "expires="+ d.toUTCString();
            document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
        }

        $('form[id=modifyParams]').submit(function(event) {

            $('.form-group').removeClass('has-error'); // remove the error class
            $('.help-block').remove(); // remove the error text

            // get the form data
            // there are many ways to get this data using jQuery (you can use the class or id also)
            var formData = {
                'firstname'              : $('input[name=firstname]').val(),
                'lastname'              : $('input[name=lastname]').val(),
                'email'              : $('input[name=email]').val(),
                'username'              : $('input[name=username]').val(),
                'birthdate'             : $('input[name=birth]').val(),
                'currentPassword': $('input[name=currentPassword]').val(),
                'newPassword': $('input[name=newPass]').val(),
                'confirmNewPass': $('input[name=confirmNewPass]').val(),
                'submit': 'modifyParams'
            };

            // process the form
            $.ajax({
                type        : 'POST',
                url         : '/profil',
                data        : formData,
                dataType    : 'json',
                encode		: true
            })

                .done(function(data) {

                    // here we will handle errors and validation messages
                    if (data.errors) {
                        for (var i = 0; i < data.errors.length; i++) {
                            $('#modal-body2').addClass('has-error');
                            if (data.errors[i].msg) {
                                $('#modal-body2').prepend('<div class="help-block alert alert-warning">' + data.errors[i].msg + '</div>');
                            } else if (data.errors[i].errorMsg) {
                                $('#modal-body2').prepend('<div class="help-block alert alert-warning">' + data.errors[i].errorMsg + '</div>');
                            }
                        }
                    } else {
                        if (data.user) {

                            setCookie('token', data.token, {
                                expiresIn: 9000000
                            });

                            $('#accountParam').modal('hide');
                            const userDetails = document.getElementById('userDetails');
                            const birthdate = document.getElementById('displayAge');

                            userDetails.innerHTML = data.user.username + " (" + data.user.firstname + " " + data.user.lastname + ")";

                            var date = new Date(data.user.birth);
                            var year = date.getFullYear();
                            var month = date.getMonth();
                            var day = date.getDate();
                            var today = new Date();

                            var age = today.getFullYear() - year;
                            if (today.getMonth() < month || (today.getMonth() === month && today.getDate() < day)) {
                                age--;
                            }

                            birthdate.innerHTML = age + ' ans';

                            if (document.getElementById('messages')) {
                                const flash = document.getElementsByClassName('alert alert-dark alert-dismissible');
                                flash[0].innerHTML = 'Vos paramètres ont bien été mis à jour';
                            } else {
                                $('#container').prepend('<div id="messages"></div>');
                                $('#messages').append('<div class="alert alert-dark alert-dismissible">Vos paramètres ont bien été mis à jour</div>')
                            }
                        }
                    }
                });
            event.preventDefault();
        });

        $('form[id=modifyProfile]').submit(function(event) {

            $('.form-group').removeClass('has-error');
            $('.help-block').remove();

            var formData = {
                'gender'         : $('select[name=editGender]').val(),
                'orientation'    : $('select[name=editOrientation]').val(),
                'description'    : $('textarea[name=editDescription]').val(),
                'submit': 'modifyProfile'
            };

            $.ajax({
                type        : 'POST',
                url         : '/profil',
                data        : formData,
                dataType    : 'json',
                encode		: true
            })
                .done(function(data) {

                    if (data.errors) {

                        for (var i = 0; i < data.errors.length; i++) {
                            $('#modal-body3').addClass('has-error');
                            $('#modal-body3').prepend('<div class="help-block alert alert-warning">' + data.errors[i].msg + '</div>');
                        }
                    } else {
                        if (data.user) {

                            $('#editProfil').modal('hide');
                            const genderOrientation = document.getElementById('genderOrientation');
                            const description = document.getElementById('desc');
                            genderOrientation.innerHTML = data.user.gender + ', ' + data.user.orientation;
                            description.innerHTML = data.user.description;

                            if (document.getElementById('messages')) {
                                const flash = document.getElementsByClassName('alert alert-dark alert-dismissible');
                                flash[0].innerHTML = 'Votre profil RoooCool a été mis à jour avec succès';
                            } else {
                                $('#container').prepend('<div id="messages"></div>');
                                $('#messages').append('<div class="alert alert-dark alert-dismissible">Votre profil RoooCool a été mis à jour avec succès</div>')
                            }

                        }
                    }
                });
            event.preventDefault();
        });

        $('form[id=uploadPics]').submit(function (event) {

            var form = $('#uploadPics').get(0);
            var formData = new FormData(form);
            $.ajax({
                type		: 'POST',
                url		: '/profil',
                data		: formData,
                dataType	: 'json',
                processData: false,
                contentType: false,
                encode		: true
            })
                .done(function (data) {
                    if (data.errors) {
                        if (document.getElementById('messages')) {
                            const flash = document.getElementsByClassName(`alert alert-${data.type} alert-dismissible`);
                            if (flash.length > 0) {
                                flash[0].innerHTML = data.errors;
                            }
                        } else {
                            $('#container').prepend('<div id="messages"></div>');
                            $('#messages').append(`<div class="alert alert-${data.type} alert-dismissible">${data.errors}</div>`)
                        }
                    } else {
                        if (data.file) {
                            if (($('.img-thumbnail.carroussel').length) < 5) {
                                if (data.flag === 0) {
                                    $('#rowPic').prepend('<div class="col-sm profil-gal">' +
                                        '<button type="button" class="photos" style="background: none; border: none;"onclick="changePic(this)">' +
                                        '<img src="' + data.file + '" class="img-thumbnail carroussel" style="border: solid rgb(255, 0, 100) thick" alt="...">' +
                                        '</button>' +
                                        '<button type="button" class="close" aria-label="Close" onclick="deletePic(this)">\n' +
                                        '  <span aria-hidden="true" style="position: absolute; top: -9px; right: 12px;"><i class="fas fa-times-circle"></i></span>\n' +
                                        '</button>' +
                                        '</div>');
                                    const avatar = document.getElementById('avatarPic');
                                    avatar.src = data.file;
                                    avatar.style = 'border-radius: 50%';
                                } else {
                                    $('#rowPic').prepend('<div class="col-sm profil-gal">' +
                                        '<button type="button" class="photos" style="background: none; border: none;" onclick="changePic(this)">' +
                                        '<img src="' + data.file + '" class="img-thumbnail carroussel" alt="...">' +
                                        '</button>' +
                                        '<button type="button" class="close" aria-label="Close" onclick="deletePic(this)">\n' +
                                        '  <span aria-hidden="true" style="position: absolute; top: -9px; right: 12px;"><i class="fas fa-times-circle"></i></span>\n' +
                                        '</button>' +
                                        '</div>');
                                }
                                if (($('.img-thumbnail.carroussel').length) === 5) {
                                    $('form[id=uploadPics]').hide();
                                }
                            }
                        }
                    }
                });
            event.preventDefault();
        });

        $('#addTag').on('keydown', (e) => {
            var k = e.which || e.key
            if(/^(9)$/.test(k)) {
                $(this).value = ""
                e.preventDefault()
            }
            if(/^(188|13)$/.test(k)) {
                validFormTag();
            }
        })

        const validFormTag = () => {
            if ($('.hashtag').length < 6) {

                var inputTag = $('#addTag')[0];
                var addedTag = $("#addTag")[0].value;
                var match = new RegExp('^[a-zA-Z]+$');

                if (match.test(addedTag) === true) {
                    const formData = {
                        'tag': addedTag,
                        'submit': 'addTag'
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
                                if(addedTag) $('#addTag').before('<a class="btn btn-primary hashtag" href="#" role="button" onclick="deleteTag(this)">#'+ addedTag.toLowerCase() +'</a>');
                                inputTag.value = "";
                                inputTag.focus();
                            }
                            if ($(".hashtag").length === 6) {
                                $("#addTag").hide();
                            }
                        });
                } else {
                    if (document.getElementById('messages')) {
                        const flash = document.getElementsByClassName('alert');
                        flash[0].className = 'alert alert-warning alert-dismissible';
                        flash[0].innerHTML = "Le format de votre tag est incorrect";
                    } else {
                        $('#container').prepend('<div id="messages"></div>');
                        $('#messages').append('<div class="alert alert-warning alert-dismissible">Le format de votre tag est incorrect</div>')
                    }
                }

            }
        }
    });
});