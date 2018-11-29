function openSearch() {
    const input = document.createElement('input');
    $('.navbar-nav').append(input);
    input.setAttribute('type', 'text');
    input.setAttribute('id', 'searchBox');
    input.setAttribute('placeholder', 'Recherche par username');
    input.setAttribute('onfocus', 'search()');
    $('#searchIcon').hide();
}

function search() {
    if ($('#divSearch').length === 0) {
        const div = document.createElement('div');
        $('.navbar-nav').append(div);
        div.id = 'divSearch';
    }

    $(document).on('keyup', function () {
        $('#accessProfil').remove();
        const query = $('#searchBox').val();
        // console.log('query', query);
        if (query.length > 1) {
            var formData = {
                'search': 1,
                'q': query // check si besoin de differencier les submit
            };
            $.ajax({
                type: 'POST',
                url: '/usersearch',
                data: formData,
                dataType: 'json',
                encode: true
            })
                .done(function (data) {

                    if ($('#response').length === 0) {
                        const ul = document.createElement('ul');
                        $('#divSearch').append(ul);
                        ul.setAttribute('id', 'response');
                        ul.setAttribute('style', 'position: absolute;');
                    }
                    $('#response').html(data.res);

                    $(document).on('click', 'li', function(){

                        var username = $(this).text();
                        if (username === 'No data found !') {
                            $('#response').html("");
                            $('ul').remove();
                        } else {
                            $('#searchBox').val(username);

                            $('#response').html("");
                            $('ul').remove();

                            if ($('#accessProfil').length === 0) {
                                const button = document.createElement('button');
                                $('#divSearch').append(button);
                                button.setAttribute('id', 'accessProfil');
                                button.setAttribute('class', 'btn btn-alert login-btn');
                                button.innerHTML = 'Accéder au profil';

                                console.log('data stick: ', data)

                                button.onclick = (elem) => {
                                    // console.log('length', data.userdata.length);
                                    // console.log('value searchbox: ', $('#searchBox').val());
                                    for (var i = 0; i < data.userdata.length; i++) {
                                        // console.log('data.userdata['+i+']',data.userdata[i])
                                        if ($('#searchBox').val() === data.userdata[i].username) {
                                            console.log('id', data.userdata[i].id)
                                            // $.ajax({
                                            //     type: 'GET',
                                            //     url: '/search',
                                            //     data: {userid: data.userdata[i].id},
                                            //     dataType: 'json',
                                            //     encode: true
                                            // })
                                        }
                                    }
                                }
                            }
                        }
                    });

                });
        } else {
            if (query.length <= 1) {
                $('ul').remove();
            }
        }
    });
}

// function profile(data) {
//     console.log(data)
// }