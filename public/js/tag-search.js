var tags= [];

function deleteTag(tag) {
    $('#addTag').show();
    for(var i = 0; i < tags.length; i++){
        if ( tags[i] === tag.innerHTML.substring(1)) {
            tags.splice(i, 1);
        }
    }
    tag.remove();
}

$(function () {
    $(document).ready(function() {
        if ($(".hashtag").length === 6) {
            $("#addTag").hide();
        }

        $('#addTag').on('keydown', (e) => {
            var k = e.which || e.key
            if(/^(9)$/.test(k)) {
                $(this).value = ""
                // console.log("Tabulation catch:" + k)
                e.preventDefault()
            }
            if(/^(188|13)$/.test(k)) {
                console.log("Submit form:"+ $(this))
                validFormTag();
            }
            // var tagsTab = [];
            // stockTag($("#addTag")[0].value, tagsTab);
        })
        const validFormTag = () => {
            // console.log("valeur : ", $("#addTag")[0].value);
            if ($('.hashtag').length < 6) {
                //console.log("Submit call")
                
                var inputTag = $('#addTag')[0]
                var addedTag = $("#addTag")[0].value;
                var match = new RegExp('^[a-zA-Z]+$');

                if (addedTag != ""){
                    tags.push(addedTag);
                }
                console.log("TABS", tags);
                // addedTag.clear();
                console.log("inputTag.value before", inputTag.value);
                inputTag.value = tags;
                console.log("inputTag.value after", inputTag.value);


                if (match.test(addedTag) === true) {
                    const formData = {
                        'tag': addedTag,
                        'submit': 'addTag'
                    };

                    // $.ajax({
                    //     type		: 'POST',
                    //     url		: '/profil',
                    //     data		: formData,
                    //     dataType	: 'json',
                    //     encode		: true
                    // })
                    //     .done((data) => {
                    //         if (data.errors) {
                    //             if (document.getElementById('messages')) {
                    //                 const flash = document.getElementsByClassName('alert');
                    //                 // console.log('flash', flash);
                    //                 flash[0].className = 'alert alert-warning alert-dismissible';
                    //                 flash[0].innerHTML = data.errors;
                    //             } else {
                    //                 $('#container').prepend('<div id="messages"></div>');
                    //                 $('#messages').append('<div class="alert alert-warning alert-dismissible">' + data.errors + '</div>')
                    //             }
                    //         } else {
                    //             if (document.getElementById('messages')) {
                    //                 $('#messages').remove();
                    //             }
                    //             // console.log("Je dois ajouter un tag")
                    //             // console.log(addedTag)
                        if(addedTag) $('#addTag').before('<a class="btn btn-primary hashtag" href="#" role="button" onclick="deleteTag(this)">#'+ addedTag +'</a>');
                    //             inputTag.value = ""
                    //             inputTag.focus();
                    //         }
                    //         if ($(".hashtag").length === 6) {
                    //             $("#addTag").hide();
                    //         }
                    //     });
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

            }
        }
    });
});