function searchTag() {
    if ($('#divSearch').length === 0) {
        const div = document.createElement('div');
        $('.navbar-nav').append(div);
        div.id = 'divSearch';
    }

    $(document).on('keyup', function () {
        $('#accessProfil').remove();
        const query = $('#searchTag').val();
        if (query.length > 1) {
            var formData = {
                'search': 1,
                'q': query
            };
            $.ajax({
                type: 'POST',
                url: '/usersearch',
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
                        $('#divSearch').append(ul);
                        ul.setAttribute('id', 'response');
                        ul.setAttribute('style', 'position: absolute;');
                    }
                    $('#response').html(data.res);

                    $(document).on('click', 'li', function(){

                        var username = $(this).text();
                        // if (username === 'No data found !') {
                        //     $('#response').html("");
                        //     $('ul').remove();
                        // } else {
                            console.log('data', data.userdata);
                            $('#searchTag').val(username);

                            $('#response').html("");
                            $('ul').remove();

                            if ($('#accessProfil').length === 0) {

                                console.log('data', data.userdata);


                                const button = document.createElement('button');
                                $('#divSearch').append(button);
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