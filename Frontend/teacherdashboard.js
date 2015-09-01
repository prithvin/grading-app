$("#openaddclass").on("click", function () {
	$("#findclass").show();
});

$(".cancelbutton").on("click", function () {
	$(this).closest(".bigbox").hide();
});

$("#createnewclass").on("submit", function (ev) {
					ev.preventDefault()

	$.ajax({
		type: "POST",
		url: "http://104.131.135.237:3000/teachers/createclass",
		data: {Name: $("#classnameinput").val()},
		success: function (response) {
			$("#findclass").hide();
			 getClassList ()
		},
		xhrFields: {withCredentials: true},
		error:function(){
			console.log("ERROR");
		}
	});
});


function getClassList () {
	$.ajax({
		type: "GET",
		url: "http://104.131.135.237:3000/teachers/getclasses",
		data: {},
		success: function (response) {
			if(isJson(response)) {
				var myclasslist = $("#myclasslist").html("");
				for (var x = 0; x < response.length; x++) 
					$("<a>").addClass("mdl-navigation__link").attr("href", "teacherportal.html?classroomid="  + response[x].Id + "&name=" + response[x].Name).attr("data-id", response[x].Id).html(response[x].Name).appendTo(myclasslist);
			}
			else 
				alert(response);
		},
		xhrFields: {withCredentials: true},
		error:function(){
			console.log("ERROR");
		}
	});
}

function isJson(str) {
    try {
        JSON.parse(JSON.stringify(str))
    } catch (e) {
        return false;
    }
    return true;
}


$.ajax({
	type: "GET",
	url: "http://104.131.135.237:3000/users/insession",
	data: {},
	success: function (response) {
		if (parseInt(response) != 2) {
			$("#loginbox").show();
			$(".mainbackground").css("background-image", "url('https://upload.wikimedia.org/wikipedia/commons/1/1a/Code.jpg')");
			$("#myloginform").on("submit", function (ev) {
				ev.preventDefault()
				$.ajax({
					type: "POST",
					url: "http://104.131.135.237:3000/teachers/login",
					data: {Email: $("#usernamefield").val(), Password: $("#passwordfield").val()},
					success: function (response) {
						if (response == "Teacher account") {
							
							 getClassList ()
							$("#loginbox").hide();
							if (getQueryVariable("classroomid") != null) {
								if ($(".activebuttonportal").html() == "Classroom") {
									getClassroomData(getQueryVariable("classroomid"));
								}
							}
							else {
								showBlockPage();
							}
							//refreshDirectory();
						//	updateDirectoryTop();
						}
						else {
							//console.log("HEY");
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
			 getClassList ()
			 if (getQueryVariable("classroomid") != null) {
				if ($(".activebuttonportal").html() == "Classroom") {
					getClassroomData(getQueryVariable("classroomid"));
				}
			}
			else {
				showBlockPage();
			}
			//refreshDirectory();
			//updateDirectoryTop();
		}
	},
	xhrFields: {withCredentials: true},
	error:function(){
		console.log("ERROR");
	}
});

function showBlockPage() {
	$("#showBlockPage").show();
}

function getClassroomData(classroomid) {
	if (getQueryVariable("name") != null) {
		$("#classroomname").html(getQueryVariable("name"))
	}
	$.ajax({
		type: "GET",
		url: "http://104.131.135.237:3000/teachers/doesownclass",
		data: {ClassroomId: classroomid},
		success: function (response) {
			console.log(response);
			if (response == "YES") {
				studentsWantingToEnroll(classroomid);
				studentsEnrolled(classroomid);
			}
			else {
				console.log("HERE?");
				showBlockPage();
			}
		},
		xhrFields: {withCredentials: true},
		error:function(){
			console.log("ERROR");
		}
	});
	
	// First check if teacher owns classroom

	// Then get students wanting to enroll
		// Add listeners to delete and accept for each student
			// Notification asking if they are sure they want to delete and etc. and confirmation message if they accept
			// Once delete or refresh, then refresh students wanting to enroll and students enrolled

	// Then get students who are enrolled
		// Add listeners to delete  for each student
			// Ask are you sure
			// Refresh once delete

	// Daily Bulliten
	// Class Locker
}

function studentsWantingToEnroll(classroomid) {
	$.ajax({
		type: "GET",
		url: "http://104.131.135.237:3000/teachers/studentswantingtojoin",
		data: {ClassroomId: classroomid},
		success: function (response) {
			console.log(response);
			var maindiv = $("#studentswhowantenroll").html("");
			for (var x = 0;x < response.length; x++) {
				var tr = $("<tr>").appendTo(maindiv);
					$("<td>").html(response[x].Name).appendTo(tr);
					$("<td>").html(response[x].StudentID).appendTo(tr);
					$("<td>").html(response[x].Email).appendTo(tr);
					var accept = $("<td>");
						var acceptbutton = $("<a>").appendTo(accept).attr("id", response[x]._id).addClass("acceptenrollee pure-button pure-button-primary").css("background-color", "green").html("<i class='fa fa-check'></i>");
					var decline = $("<td>");
						var declinebutton = $("<a>").appendTo(decline).attr("id", response[x]._id).addClass("acceptenrollee pure-button pure-button-primary").css("background-color", "green").html("<i class='fa fa-check'></i>");

			}
	

 
                                                       <td><a class="pure-button pure-button-primary" style="background-color:#96281B;" href="#"><i class="fa fa-close"></i></a></td>
		},
		xhrFields: {withCredentials: true},
		error:function(){
			console.log("ERROR");
		}
	});


}

promptBox("You will be automatically added to the class once the instructor accepts you.", "Enrollment Requested", "Ok", null, "https://upload.wikimedia.org/wikipedia/en/2/2f/Happy_face_high_res.JPG", function () {
					closePromptBox();
				}, null)


$(document).on("click", ".acceptenrollee" function () {
	$(this).attr("id");
});
function studentsEnrolled(classroomid) {
	$.ajax({
		type: "GET",
		url: "http://104.131.135.237:3000/teachers/studentsenrolled",
		data: {ClassroomId: classroomid},
		success: function (response) {
			console.log(response);
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

