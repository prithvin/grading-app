$("#openaddclass").on("click", function () {
	$("#findclass").show();
});

$(".cancelbutton").on("click", function () {
	$(this).closest(".bigbox").hide();
});

$(".mdl-navigation__link").on("click", function (ev) {
	ev.preventDefault();
	if ($(this).html() == "Classroom")
		window.location = "teacherportal.html" + window.location.search;
	if ($(this).html() == "Assignments")
		window.location = "teacherprograms.html" + window.location.search;
	if ($(this).html() == "Submissions")
		window.location = "teacherviewsubmission.html" + window.location.search;
	
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

$("#enrollmentcode").html("Enrollment Code: " + getQueryVariable("classroomid"))
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
									getClassroomData(getQueryVariable("classroomid"));
							
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
													getClassroomData(getQueryVariable("classroomid"));

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
	console.log("GETTING DATA");
	if (getQueryVariable("name") != null) {
		$("#classroomname").html(getQueryVariable("name"))
	}
	$.ajax({
		type: "GET",
		url: "http://104.131.135.237:3000/teachers/doesownclass",
		data: {ClassroomId: classroomid},
		success: function (response) {
			console.log(response);
			if (response == "YES" && ($(".activebuttonportal").html() == "Classroom")) {
				studentsWantingToEnroll(classroomid);
				studentsEnrolled(classroomid);
				dailyBulletin(classroomid);
			}
			else if (response == "YES" &&  $(".activebuttonportal").html() == "Assignments") {
				getPrograms(classroomid);
			}
			else if (response == "YES" &&  $(".activebuttonportal").html() == "Submissions") {
				teacherViewSubmissionGetProgram();
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
function getBulletinForDate(date, classroomid) {
	$.ajax({
		type: "GET",
		url: "http://104.131.135.237:3000/teachers/dailybulletin",
		data: {ClassroomId: classroomid, DateSelected: date},
		success: function (response) {
			console.log(response);
			CKEDITOR.instances.dailycalendar.setData(response);
		},
		xhrFields: {withCredentials: true},
		error:function(){
			console.log("ERROR");
		}
	});
}
function dailyBulletin (classroomid) {
	CKEDITOR.replace( 'dailycalendar' );

	$( "#datepicker" ).datepicker();
	var date = new Date();
	date.setHours(0,0,0,0)
	$("#datepicker").datepicker('setDate', date);
	$( "#datepicker" ).attr("data-default-date", date);

	getBulletinForDate(date, classroomid);

	$("#datepicker").on("change", function () {
		if ($("#updatebulletin").is(":visible") == true) {
			promptBox("You haven't saved your changes. Sure you want to continue?", "View Another Day", "Yes", "No", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/February_calendar.jpg/1280px-February_calendar.jpg", function () {
				closePromptBox();
				$( "#datepicker" ).attr("data-default-date", $("#datepicker").datepicker( "getDate" ));
				getBulletinForDate($("#datepicker").datepicker( "getDate" ), classroomid);
			}, function () {
				$("#datepicker").datepicker('setDate', new Date($( "#datepicker" ).attr("data-default-date")));
				closePromptBox();
			});
		}
		else {
			getBulletinForDate($("#datepicker").datepicker( "getDate" ), classroomid);
		}
	});

	$("#updatebulletin").on("click", function () {
		$.ajax({
			type: "POST",
			url: "http://104.131.135.237:3000/teachers/newbulletin",
			data: {ClassroomId: classroomid, DateSelected: $("#datepicker").datepicker( "getDate" ), Bulletin: CKEDITOR.instances.dailycalendar.getData()},
			success: function (response) {
				promptBox("", "Date Updated", "Ok", null, "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/February_calendar.jpg/1280px-February_calendar.jpg", function () {
					closePromptBox();
				});
			},
			xhrFields: {withCredentials: true},
			error:function(){
				console.log("ERROR");
			}
		});
	});
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
					var accept = $("<td>").appendTo(tr);
						var acceptbutton = $("<a>").appendTo(accept).attr("id", response[x]._id).addClass("acceptenrollee pure-button pure-button-primary").css("background-color", "green").html("<i class='fa fa-check'></i>");
					var decline = $("<td>").appendTo(tr);
						var declinebutton = $("<a>").appendTo(decline).attr("id", response[x]._id).addClass("declineenrollee pure-button pure-button-primary").css("background-color", "96281B").html("<i class='fa fa-close'></i>");

			}
		},
		xhrFields: {withCredentials: true},
		error:function(){
			console.log("ERROR");
		}
	});


}

function studentsEnrolled(classroomid) {
	$.ajax({
		type: "GET",
		url: "http://104.131.135.237:3000/teachers/studentsenrolled",
		data: {ClassroomId: classroomid},
		success: function (response) {
			var maindiv = $("#studentsenrolled").html("");
			for (var x = 0;x < response.length; x++) {
				var tr = $("<tr>").appendTo(maindiv);
					$("<td>").html(response[x].Name).appendTo(tr);
					$("<td>").html(response[x].StudentID).appendTo(tr);
					$("<td>").html(response[x].Email).appendTo(tr);
					var decline = $("<td>").appendTo(tr);
						var declinebutton = $("<a>").appendTo(decline).attr("id", response[x]._id).addClass("dropstudentfromclass pure-button pure-button-primary").css("background-color", "96281B").html("<i class='fa fa-close'></i>");

			}
		},
		xhrFields: {withCredentials: true},
		error:function(){
			console.log("ERROR");
		}
	});
}


$(document).on("click", ".dropstudentfromclass", function () {
	var id = $(this).attr("id");// Add Enrollee
	promptBox("Are you sure you want to drop this student from your class?", "Drop Student", "Yes", "No", "https://upload.wikimedia.org/wikipedia/en/2/2f/Happy_face_high_res.JPG", function () {
		// Delete student from list
		$.ajax({
			type: "GET",
			url: "http://104.131.135.237:3000/teachers/removestudentfromclass",
			data: {ClassroomId: getQueryVariable("classroomid"), StudentSchemaId: id},
			success: function (response) {
				closePromptBox();
				studentsEnrolled(getQueryVariable("classroomid"))
			},
			xhrFields: {withCredentials: true},
			error:function(){
				console.log("ERROR");
			}
		});

	}, function () {
		closePromptBox();
	})
});

$(document).on("click", ".acceptenrollee", function () {
	var id = $(this).attr("id");// Add Enrollee
	$.ajax({
		type: "GET",
		url: "http://104.131.135.237:3000/teachers/addstudenttoclass",
		data: {ClassroomId: getQueryVariable("classroomid"), StudentSchemaId: id},
		success: function (response) {
			if (response == "Done") {
				promptBox("Student has been enrolled", "Enrollment Requested", "Yes", null, "https://upload.wikimedia.org/wikipedia/en/2/2f/Happy_face_high_res.JPG", function () {
					closePromptBox();
					studentsWantingToEnroll(getQueryVariable("classroomid"))
					studentsEnrolled(getQueryVariable("classroomid"))
				});
			}
		},
		xhrFields: {withCredentials: true},
		error:function(){
			console.log("ERROR");
		}
	});

});
$(document).on("click", ".declineenrollee", function () {
	var id = $(this).attr("id");// Add Enrollee
	promptBox("Are you sure you want to decline the student enrollment?", "Enrollment Requested", "Yes", "No", "https://upload.wikimedia.org/wikipedia/en/2/2f/Happy_face_high_res.JPG", function () {
		// Delete student from list
		$.ajax({
			type: "GET",
			url: "http://104.131.135.237:3000/teachers/addstudenttoclass",
			data: {ClassroomId: getQueryVariable("classroomid"), StudentSchemaId: id, RemoveStudent: "YES"},
			success: function (response) {
				closePromptBox();
				studentsWantingToEnroll(getQueryVariable("classroomid"))
			},
			xhrFields: {withCredentials: true},
			error:function(){
				console.log("ERROR");
			}
		});

	}, function () {
		closePromptBox();
	})
});




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


	$("#errorbox").find("#textprompt").html(textprompt); // The bigger, (less length) text
	$("#errorbox").find("#uploadyes").html(uploadyes);
	if (uploadno == null)
		$("#errorbox").find("#uploadno").hide();
	else  {
		$("#errorbox").find("#uploadno").show();
		$("#errorbox").find("#uploadno").html(uploadno);
	}

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

