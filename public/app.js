$(document).ready(function () {
    $("p.alert").each(function(){
        if(!$(this).text().trim().length){
            $(".alert").addClass("hide");
        }
    })
});