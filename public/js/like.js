// function like(id){
//     var unlike = id.replace("ok", "un");
//     document.getElementById(id).style.display = "none";
//     document.getElementById(unlike).style.display = "flex";
//     var data = {
//         id_liked	: id,
//     };
//     $.ajax({
//         type        : 'POST',
//         url         : '/search',
//         data		: data,
//         dataType    : 'json',
//         encode		: true
//     })
//     .done(function(data) {
//         if (data.getMatches) {
//             var id_user = id.substring(13, id.length);
//             var match = "matched"+id_user;
//             var liked = "liked"+id_user;
//             var pop = "pop"+id_user;
//             for (var i = 0; i < data.getMatches.length; i++) {
//                 if (data.getMatches[i] == id_user) {
//                     document.getElementById(match).style.display = "flex";
//                     document.getElementById(liked).style.display = "none";
//                 }
//             }
//         }
//         document.getElementById(pop).innerHTML = data.updatePop + "%";
//     });
// }
//
// function unlike(id){
//     var like = id.replace("un", "ok");
//     document.getElementById(id).style.display = "none";
//     document.getElementById(like).style.display = "flex";
//         var data = {
//         id_liked	: id,
//     }
//     $.ajax({
//         type        : 'POST',
//         url         : '/search',
//         data		: data,
//         dataType    : 'json',
//         encode		: true
//     })
//     .done(function(data) {
//         if (data.getMatches) {
//             var id_user = id.substring(13, id.length);
//             var match = "matched"+id_user;
//             var liked = "liked"+id_user;
//             var pop = "pop"+id_user;
//             for (var i = 0; i < data.getMatches.length; i++) {
//                 if (data.getMatches[i] == id_user) {
//                     document.getElementById(match).style.display = "none";
//                     document.getElementById(liked).style.display = "flex";
//                 }
//             }
//         }
//         document.getElementById(pop).innerHTML = data.updatePop + "%";
//     });
// }