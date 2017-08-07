$("#openaddclass").on("click", function () {
	$("#findclass").show();
});

$(".cancelbutton").on("click", function () {
	$(this).closest(".bigbox").hide();
	$("#errorenrollclass").html("")
});


$(".mdl-navigation__link").on("click", function (ev) {
	ev.preventDefault();
	if ($(this).html() == "Classroom") 
		window.location = "studentportal.html" + window.location.search;
	if ($(this).html() == "My Files") 
		window.location = "test.html" + window.location.search;
	if ($(this).html() == "Assignments") 
		window.location = "studentviewsubmission.html" + window.location.search;
	
});

$("#enrollinclassbutton").on("submit", function (ev) {
					ev.preventDefault()

	$.ajax({
		type: "POST",
		url: "http://104.131.135.237:3000/users/requestclass",
		data: {ClassroomId: $("#classidinptu").val()},
		success: function (response) {
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
$( document ).ready(function() {
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
});

function doStuffStartingNow() {
	if (getQueryVariable("classroomid") == null)
		showBlockPage();
	if (getQueryVariable("name") != null) 
		$("#classroomname").html(getQueryVariable("name"))

			getClassList();
	if ($(".activebuttonportal").html() == "Classroom") {
		getCurrentClass(getQueryVariable("classroomid"));
	}
	else if ($(".activebuttonportal").html() == "Assignments") {
		getAssignments();
	}
	else if ($(".activebuttonportal").html() == "My Files") {
		refreshDirectory();
		updateDirectoryTop();
	}


			
}

function sadBoxError(response, callback) {
	if (isJson(response) == false) {
		if (response.substring(0,4) == "ERR:") {
			promptBox(response, "An Error Occurred", "Ok", null, "/Images/sad dog.jpg", function () {
				closePromptBox();
				showBlockPage();
			});
		}
		else if(callback != null){
			callback();
		}
	}
	else if(callback != null) {
		callback();
	}
}

  function getFormattedDate (d) {
                     return [(d.getMonth()+1).padLeft(),d.getDate().padLeft(),d.getFullYear()].join('/') ;
               }

               	 Number.prototype.padLeft = function(base,chr){
                    var  len = (String(base || 10).length - String(this).length)+1;
                    return len > 0? new Array(len).join(chr || '0')+this : this;
               }

function getCurrentClass(classid) {

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
					var maindiv = $("#contentgoeshere");
					for (var x = 0;x < response.Bulletin.length; x++){ 
						var div1 = $("<div>").addClass("mdl-card mdl-shadow--2dp").css("min-height", "0px").css("margin", "50px").appendTo(maindiv);

						var title = $("<div>").appendTo(div1).addClass("mdl-card__supporting-text").css("padding-bottom", "0px").html("<h4 class='mld-card_title-text'>" + getFormattedDate(new Date(response.Bulletin[x].DateOf)) + "</h4><hr>")
						var content = $("<div>").appendTo(div1).addClass("mdl-card__supporting-text").css("padding-bottom", "30px").html(response.Bulletin[x].TextDesc);

					}
	


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

function createNewAccount(teacher, email, password, studentid, name) {
	if (teacher == false) {
		$.ajax({
			type: "POST",
			url: "http://104.131.135.237:3000/users/createaccount",
			data: {Email: email, Password:  password, StudentID: studentid, Name: name},
			success: function (response) {
				console.log(response);
			},
			xhrFields: {withCredentials: true},
			error:function(){
				console.log("ERROR");
			}
		});
	}
	else {
		$.ajax({
			type: "POST",
			url: "http://104.131.135.237:3000/teachers/createaccount",
			data: {Email: email, Password: password},
			success: function (response) {
				console.log(response);
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
    if (Object.prototype.toString.call(str)) {
    	if (typeof str == "object")
    		return true;
    	return false;
    } 
    	
    return true;
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

	$("#errorbox").find("#uploadalertboxtext").html(errormessage); // The smaller text


	$("#errorbox").find("#textprompt").html(textprompt); // The bigger, (less length) text
	$("#errorbox").find("#uploadyes").html(uploadyes);
	if (uploadno == null)
		$("#errorbox").find("#uploadno").hide();
	else 
		$("#errorbox").find("#uploadno").show();
		$("#errorbox").find("#uploadno").html(uploadno);

	$(".mainbackground").css("background-image", "url('" + bgimage + "')");

	$("#errorbox").find("#uploadyes").on("click", function (ev) {
		$("#errorbox").find('#uploadyes').off('click');
		$("#errorbox").find('#uploadno').off('click');
		callbackyes();
	});
	$("#errorbox").find("#uploadno").on("click", function (ev) {
		$("#errorbox").find('#uploadyes').off('click');
		$("#errorbox").find('#uploadno').off('click');
		callbackno();
	});
	$("#errorbox").show();
}

function closePromptBox () {
	$("#errorbox").hide();
}
