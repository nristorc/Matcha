function like(id){
    event.preventDefault();
    var unlike = id.replace("ok", "un");
    document.getElementById(id).style.display = "none";
    document.getElementById(unlike).style.display = "flex";
    var data = {
        id_liked	: id,
    }
    $.ajax({
        type        : 'POST',
        url         : '/search',
        data		: data,
        dataType    : 'json',
        encode		: true
    })
}

function unlike(id){
    event.preventDefault();
    var like = id.replace("un", "ok");
    document.getElementById(id).style.display = "none";
    document.getElementById(like).style.display = "flex";
    var data = {
        id_liked	: id,
    }
    $.ajax({
        type        : 'POST',
        url         : '/search',
        data		: data,
        dataType    : 'json',
        encode		: true
    })
}