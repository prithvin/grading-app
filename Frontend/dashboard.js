$("#openaddclass").on("click", function () {
	$("#findclass").show();
});

$(".cancelbutton").on("click", function () {
	$(this).closest(".bigbox").hide();
	$("#errorenrollclass").html("")
});



$("#enrollinclassbutton").on("submit", function (ev) {
					ev.preventDefault()

	$.ajax({
		type: "POST",
		url: "http://104.131.135.237:3000/users/requestclass",
		data: {ClassroomId: $("#classidinptu").val()},
		success: function (response) {

			console.log(response);
			if (response == "Success") {
				$("#findclass").hide();
				promptBox("You will be automatically added to the class once the instructor accepts you.", "Enrollment Requested", "Ok", null, "https://upload.wikimedia.org/wikipedia/en/2/2f/Happy_face_high_res.JPG", function () {
					closePromptBox();
				}, null)
			}
			else {
				$(".addclasscard").addClass("loginerror").removeClass('loginerror',1000);

				$("#errorenrollclass").css("color", "red").html("Class Id does not exist.")
			}

		},
		xhrFields: {withCredentials: true},
		error:function(){
			console.log("ERROR");
		}
	});
});
$.ajax({
	type: "GET",
	url: "http://104.131.135.237:3000/users/insession",
	data: {},
	success: function (response) {
		if (parseInt(response) ==  -1 || parseInt(response) == 2) {
			$("#loginbox").show();
			$(".mainbackground").css("background-image", "url('https://upload.wikimedia.org/wikipedia/commons/1/1a/Code.jpg')");
			$("#myloginform").on("submit", function (ev) {
				ev.preventDefault()
				$.ajax({
					type: "POST",
					url: "http://104.131.135.237:3000/users/login",
					data: {Email: $("#usernamefield").val(), Password: $("#passwordfield").val()},
					success: function (response) {
						console.log(response);
						if (response == "Student account") {
							$("#loginbox").hide();
							doStuffStartingNow();
						}
						else {
							$("#loginshakebox").addClass("loginerror").removeClass('loginerror',1000);
						}

					},
					xhrFields: {withCredentials: true},
					error:function(){
						console.log("ERROR");
					}
				});
			});
		}
		else {
			doStuffStartingNow();
		}
	},
	xhrFields: {withCredentials: true},
	error:function(){
		console.log("ERROR");
	}
});

function doStuffStartingNow() {
	getClassList();
	getCurrentClass(getQueryVariable("classroomid"));
}

function getCurrentClass(classid) {
	if (classid == null)
		showBlockPage();
	if (getQueryVariable("name") != null) 
		$("#classroomname").html(getQueryVariable("name"))
	if (classid != null) {
		$.ajax({
			type: "GET",
			url: "http://104.131.135.237:3000/students/getclass",
			data: {ClassRoomId : classid},
			success: function (response) {
				if (isJson(response) == false && response.substring(0,4) == "ERR:") {
					promptBox(response, "An Error Occurred", "Ok", null, "/Images/sad dog.jpg", function () {
						closePromptBox();
						showBlockPage();
					});
				}
				else {
					console.log(response);
					// DO SOMETHING HERE WITH BULLITEN AND LOCKER
				}
			},
			xhrFields: {withCredentials: true},
			error:function(){
				console.log("ERROR");
			}
		});
	}
	
}
function showBlockPage() {
	$("#showBlockPage").show();
}

function isJson(str) {
    try {
        JSON.parse(JSON.stringify(str))
    } catch (e) {
        return false;
    }
   	if (String(str) == "[object Object]")
   		return true;
   	return false;
}

function getClassList () {
	$.ajax({
		type: "GET",
		url: "http://104.131.135.237:3000/students/classlist",
		data: {},
		success: function (response) {
			if (isJson(response) == false && response.substring(0,4) == "ERR:") {
				promptBox(response, "An Error Occurred", "Ok", null, "/Images/sad dog.jpg", function () {
					closePromptBox();
				});
			}
			else {
				var myclasslist = $("#myclasslist").html("");
				for (var x = 0; x < response.length; x++) {
					console.log(response);
					$("<a>").addClass("mdl-navigation__link").attr("href", "studentportal.html?classroomid="  + response[x]._id + "&name=" + response[x].Name).attr("data-id", response[x]._id).html(response[x].Name).appendTo(myclasslist);
				}
			}
		},
		xhrFields: {withCredentials: true},
		error:function(){
			console.log("ERROR");
		}
	});
}



function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
   	return null;
}



function promptBox (errormessage, textprompt, uploadyes, uploadno, bgimage, callbackyes, callbackno) {

	$("#uploadalertboxtext").html(errormessage); // The smaller text


	$("#textprompt").html(textprompt); // The bigger, (less length) text
	$("#uploadyes").html(uploadyes);
	if (uploadno == null)
		$("#uploadno").hide();
	else 
		$("#uploadno").html(uploadno);

	$(".mainbackground").css("background-image", "url('" + bgimage + "')");

	$("#uploadyes").on("click", function (ev) {
		$('#uploadyes').off('click');
		$('#uploadno').off('click');
		callbackyes();
	});
	$("#uploadno").on("click", function (ev) {
		$('#uploadyes').off('click');
		$('#uploadno').off('click');
		callbackno();
	});
	$("#uploadbox").show();
}

function closePromptBox () {
	$("#uploadbox").hide();
}
