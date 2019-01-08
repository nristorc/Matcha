var tags= [];

function deleteTag(tag) {
	$('#addTag').show();
    for(var i = 0; i < tags.length; i++){
        if (tags[i] === tag.innerHTML.substring(1)) {
			tags.splice(i, 1);
        }
    }
	tag.remove();
}

const	validTag = (tag) => {
	var i = document.getElementById('addTag');
	if (i == null)
		return
	i.value = tag
	validFormTag()
	var tagDiv = document.getElementById('resultTag')
	if (tagDiv == null)
		return
	tagDiv.innerHTML = ""
}

const validFormTag = () => {
	if ($('.hashtag').length < 6) {
		var inputTag = $('#addTag')[0]
		var addedTag = $("#addTag")[0].value;
		var match = new RegExp('^[a-zA-Z]+$');

		if (addedTag != "" && tags.length < 6){
			tags.push(addedTag);
		}
		if (match.test(addedTag) === true) {
			const formData = {
				'tag': addedTag,
				'submit': 'addTag'
			};
		if ($('.hashtag').length >= 5) {
			$("#addTag").hide();
		}
		if(addedTag) $('#addTag').before('<a class="btn btn-primary hashtag" href="#" role="button" onclick="deleteTag(this)">#'+ addedTag +'</a>');
			inputTag.value = "";
			addedTag = "";
			inputTag.focus();

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
};


$(function () {
    $(document).ready(function() {
		if ($('#previousTag').val() != ""){
			tags = $('#previousTag').val().split(",");
		}

        $('#addTag').on('keydown', (e) => {
            var k = e.which || e.key;
            if(/^(9)$/.test(k)) {
                $(this).value = "";
                e.preventDefault()
            }
		});
		
		$('#addTag').keyup(function(){
            if (document.getElementById('errorSearch')) {
                document.getElementById('errorSearch').remove();
            }
			$('ul').remove();
			var inputVal = $(this).val();
			var data = 'tagSearch=' + inputVal;
			if (inputVal.length > 1){
				$.ajax({
					type : "POST",
					url : "/tagsearch",
					data : data,
					success : function(server_response){

					    if (server_response.error) {
                            var small = document.createElement('small');
                            small.innerText = server_response.error;
                            small.id = 'errorSearch';
                            small.setAttribute('style', 'color: red');

                            document.getElementById('addTag').insertAdjacentElement('afterend', small);
                            server_response.error = null;
                        }

						var tagDiv = document.getElementById('resultTag');
						if (tagDiv == null)
							return;
						tagDiv.innerHTML = "";
						$('#resultTag').html(server_response);
					}
				})
			}
		});       
    });
});