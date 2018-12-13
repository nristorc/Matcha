    function deleteTag(tag) {
        const delTag = tag.innerHTML.substring(1);

        var formData = {
            'tag': delTag,
            'submit': 'deleteTag'
        }

        $.ajax({
            type		: 'POST',
            url		: '/profil',
            data		: formData,
            dataType	: 'json',
            encode		: true
        })
            .done(function (data) {
                console.log('delete Pic data: ', data);
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


    function stockTag(tag, tagsTab) {
        sessionStorage.setItem("0", tag);
        // let tagsA = [];
        // console.log(tagsA);
        // console.log("salut");
        // tagsA = (addedTag);
        // $("#addTag").push($("#addTag"));
        // tagsA.push($("#addTag")[0].value);
        // tagsTab.push(tag);
        console.log("tab de tags", getItem("0"));
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
                    //console.log("Tabulation catch:" + k)
                    e.preventDefault()
                }
                if(/^(188|13)$/.test(k)) {
                    //console.log("Submit form:"+ $(this))
                    validFormTag();
                }
                var tagsTab = [];
                stockTag($("#addTag")[0].value, tagsTab);
            })
            const validFormTag = () => {
                // console.log("valeur : ", $("#addTag")[0].value);
                if ($('.hashtag').length < 6) {
                    //console.log("Submit call")
                    
                    var inputTag = $('#addTag')[0]
                    var addedTag = $("#addTag")[0].value;
                    var match = new RegExp('^[a-zA-Z]+$');

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
                        //             if(addedTag) $('#addTag').before('<a class="btn btn-primary hashtag" href="#" role="button" onclick="deleteTag(this)">#'+ addedTag +'</a>');
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