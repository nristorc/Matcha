function openSearch() {
    const div = document.createElement('div');
    div.setAttribute('style', 'display: grid');
    const input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('id', 'searchBox');
    input.setAttribute('placeholder', 'Recherche par username');
    input.setAttribute('onfocus', 'search()');
    div.append(input);
    $('.navbar-nav').append(div);
    $('#searchIcon').hide();
}

function search() {
    if ($('#divSearch').length === 0) {
        if (document.getElementById('errorSearch')) {
            document.getElementById('errorSearch').remove();
        }
        const div = document.createElement('div');
        $('.navbar-nav').append(div);
        div.id = 'divSearch';
    }

    $(document).on('keyup', function () {
        if (document.getElementById('errorSearch')) {
            document.getElementById('errorSearch').remove();
        }
        $('#accessProfil').remove();
        const query = $('#searchBox').val();
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

                    if (data.error) {
                        var small = document.createElement('small');
                        small.innerText = data.error;
                        small.id = 'errorSearch';
                        small.setAttribute('style', 'color: red');
                        document.getElementById('searchBox').insertAdjacentElement('afterend', small);
                        data.error = null;
                    }

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
                            $('#searchBox').val(username);

                            $('#response').html("");
                            $('ul').remove();

                            if ($('#accessProfil').length === 0) {
                                const button = document.createElement('button');
                                $('#divSearch').append(button);
                                button.setAttribute('id', 'accessProfil');
                                button.setAttribute('class', 'btn btn-alert login-btn');
                                button.innerHTML = 'Accéder au profil';

                                button.onclick = (elem) => {
                                    for (var i = 0; i < data.userdata.length; i++) {
                                        if ($('#searchBox').val() === data.userdata[i].username) {
                                            $(location).attr('href', '/user/' + data.userdata[i].id);
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