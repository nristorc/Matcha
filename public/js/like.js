function like(id){
    event.preventDefault();
    document.getElementById(id).style.display = "none";
    document.getElementById("un"+id).style.display = "flex";
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
    var display = id.substring(2)
    console.log(display);
    document.getElementById(id).style.display = "none";
    document.getElementById(display).style.display = "flex";
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