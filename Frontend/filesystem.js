

$.ajax({
	type: "GET",
	url: "http://104.131.135.237:3000/users/insession",
	data: {},
	success: function (response) {
		if (parseInt(response) ==  -1) {
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
							refreshDirectory();
							updateDirectoryTop();
						}
						else {
							console.log("HEY");
							$("#loginshakebox").removeClass("loginerror");
							$("#loginshakebox").addClass("loginerror");
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
			refreshDirectory();
			updateDirectoryTop();
		}
	},
	xhrFields: {withCredentials: true},
	error:function(){
		console.log("ERROR");
	}
});





var ignorechangesofeditor = false;

function getSelectedPoints () {
	var selected = [];
	var selections = $(".mdl-checkbox__input");
	for (var x = 1; x < selections.length; x++) {
	    if (selections[x].checked == true) {
	    	selected.push($($(".mdl-checkbox__input")[x]).closest("tr").find(".filename").html());
	    }
	}
	return selected;
}

$("#delete").on("click", function (ev) {
	var selectedPoints = getSelectedPoints();
	if (selectedPoints.length == 0)
		badBox("Please select some files or folders to delete");
	startRecursiveDelete(selectedPoints, 0);
});

$("#openineditor").on("click", function (ev) {
	var selectedPoints = getSelectedPoints();
	if (selectedPoints.length == 0)
		badBox("Please select some files to open in the editor");
	startRecursiveEditorOpen(selectedPoints, 0);
});

$("#compile").on("click", function (ev) {
	if ($("ul li.redbottom").length != 0) {
		badBox("Please save (or close and reopen) all files before compiling!", null, "Don't forget!", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Hand_Stop_Sign_1724.jpg/1280px-Hand_Stop_Sign_1724.jpg");
	}
	else {
		console.log("HEYYYY");
		var obj = [];
		for (var x =0; x < $(".tabnotactive").length; x++) {
			obj.push({
				UnderscoreID: $($(".tabnotactive")[x]).attr("data-underscoreid"),
				RevisionNumber: $($(".tabnotactive")[x]).attr("data-revision-num")
			});
		}
		if (obj.length == 0)
			badBox("Make sure to open a few files that you want to compile before compiling!", null, "Hold up there!", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Hand_Stop_Sign_1724.jpg/1280px-Hand_Stop_Sign_1724.jpg");
		else {
			$("#newprogrambox").show();
			$("#runvirtualmachine").on("click", function (ev) {
				$("#loadingbox").show();
				$.ajax({
					type: "POST",
					url: "http://104.131.135.237:3000/programrun/openvmemulator",
					data: {DirectoryData: obj, RunData: $("#inputvmtext").val().split("\n").join(" && "), ClassRoomId: "666f6f2d6261722d71757578"},
					success: function (response) {
						$("#loadingbox").hide();
						console.log(response);
						$("#runvmhere").attr("href", "http://104.131.135.237/novnc.html?port=" + response).html("Click here to run VM").attr("target", "_blank");
					},
					xhrFields: {withCredentials: true},
					error:function(){
						console.log("ERROR");
					}
				});
			})
		}
	}
});


function startRecursiveEditorOpen (selectedPoints, x) {
	if (x != selectedPoints.length ) {
		$.ajax({
			type: "GET",
			url: "http://104.131.135.237:3000/files/getfilecontents",
			data: {Directory: directory, FileName: selectedPoints[x], ClassRoomId: "666f6f2d6261722d71757578"},
			success: function (response) {

	          if (response["Data"] == null) {
	          	badBox(response, function () {
					startRecursiveEditorOpen(selectedPoints, (x+1));
				});
	          }
	          else {
	          	var editorpane = $("#tabbarpane");
	          	if ($("." + response.FileId).length !=  0) {
	          		badBox(selectedPoints[x] + " is already open in the editor", function () {
						startRecursiveEditorOpen(selectedPoints, (x+1));
					});
	          	}
	          	else {
	          		var tab = $("<li>").attr("role" ,"presentation").addClass("tabnotactive " + response.FileId).appendTo(editorpane);
	          		var a = $("<a>").html(selectedPoints[x] + "   ").appendTo(tab);
	          		var close = $("<i>").addClass("fa fa-close").appendTo(a);
	          		var dir = "";
	          		for (var y = 0; y< directory.length; y++) {
	          			if (dir != 0)
	          				dir += " - " + directory[y];
	          			else 
	          				dir += "Directory : "  + directory[y];
	          		}
	          		tab.attr("data-directory", dir);
	          		tab.attr("data-underscoreid", response.FileId);
	          		tab.attr("data-response" , response.Data);
	          		$(tab).attr("data-revision-num", "-1");
	          		$(tab).on("click", function (ev) {
	          			ignorechangesofeditor = true;
	          			if ($(this).attr("data-revision") == null) {
	          				$("#revisionnumber").html("")
	          				
	          			}
	          			else {
	          				$("#revisionnumber").html($(this).attr("data-revision"));

	          			}
	          			$(".active").attr("data-response", editor.getValue());
	          			editor.setValue($(this).attr("data-response"), -1)
	          			$(".tabnotactive").removeClass("active");
	          			$("#directoryofeditor").html(tab.attr("data-directory"));
	          			$(this).addClass("active")
	          			ignorechangesofeditor= false;

	          			getRevisionHistory(tab.attr("data-underscoreid"));
	          		});
	          		$(close).on("click", function (ev) {
	          			createYesNoBox(this, "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Hand_Stop_Sign_1724.jpg/1280px-Hand_Stop_Sign_1724.jpg", "Would you like to continue?", "Your file has not yet been saved. All changes will be lost if you close the file.", function (div) {
		          			$("#loadingbox").hide();
		          			if ($(div).closest("li").hasClass("active")) {
		          				ignorechangesofeditor = true;
		          				editor.setValue("//Click on file", 1)
		          				$("#revisionnumber").html("");
		          						ignorechangesofeditor= false;
		          			}
		          			$(div).closest("li").remove();
		          			$("#getrevisions").html("");
		          		});
	          		});
	          		startRecursiveEditorOpen(selectedPoints, (x+1));
	          	}
	          }
	        },
			xhrFields: {withCredentials: true},
			error:function(){
				console.log("ERROR");
			}
		});
	}
	else {
		refreshDirectory();
	}
}

function getRevisionHistory (fileid) {
	$.ajax({
		type: "GET",
		url: "http://104.131.135.237:3000/files/getrevisions",
		data: {FileId: fileid, ClassRoomId: "666f6f2d6261722d71757578"},
		success: function (revhist) {
			var maindiv = $("#getrevisions").html("");
			for (var x = 0; x < revhist.length; x++) {
				var li = $("<li>").addClass("mdl-menu__item").html("Revision " + x + " - " + (new Date(revhist[x].DatePosted).toLocaleDateString() + " "  +formatAMPM(new Date(revhist[x].DatePosted)))).appendTo(maindiv);
				$(li).attr("data-id", fileid);
				$(li).attr("data-filenum", x);
				$(li).on("click", function (ev) {
					createYesNoBox(this, "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Hand_Stop_Sign_1724.jpg/1280px-Hand_Stop_Sign_1724.jpg", "Would you like to continue?", "Opening a file revision will delete all unsaved changes associated with that file.", function (div) {
						$.ajax({
							type: "GET",
							url: "http://104.131.135.237:3000/files/getfilecontentsbyid",
							data: {FileId: $(div).attr("data-id"), RevisionNumber: $(div).attr("data-filenum"), ClassRoomId: "666f6f2d6261722d71757578"},
							success: function (response) {
								$("#loadingbox").hide();
								$("#revisionnumber").html("You are editing " + $(div).html());
								$(".active").attr("data-revision", "You are editing " + $(div).html());
								$(".active").attr("data-revision-num", $(div).attr("data-filenum"));
								if (response["Data"] == null) {
									badBox(response);
								}
								else {
									ignorechangesofeditor = true;
									$(".active").attr("data-response", response["Data"]);
									editor.setValue(response["Data"], -1)
									ignorechangesofeditor = false;
								}
							},
							xhrFields: {withCredentials: true},
							error:function(){
								console.log("ERROR");
							}
						});
					});
				});
			}
        },
		xhrFields: {withCredentials: true},
		error:function(){
			console.log("ERROR");
		}
	});
}

function createYesNoBox(div, backgroundimage, prompt, subtext, yescallback, showbox) {
	console.log(showbox);
		$("#uploadalertboxtext").html(subtext);
		$("#textprompt").html(prompt);
		$(".mainbackground").css("background-image", "url('" +  backgroundimage + "')");
		$("#uploadyes").one("click", function (ev) {
			$("#uploadbox").hide();
			$("#loadingbox").show();
			$("ul li.active").removeClass("redbottom")
			yescallback(div);
		});
		$("#uploadno").one("click", function (ev) {
			$("#uploadbox").hide();
		});
		if ($("ul li.active").hasClass("redbottom")) {
			$("#uploadbox").show();
		}
		else if(showbox != null && showbox) {
			$("#uploadbox").show();
		}
		else {
			yescallback(div);
		}
		
}

function startRecursiveDelete(selectedPoints, x) {
	if (x != selectedPoints.length) {
		$("#uploadalertboxtext").html(selectedPoints[x]);
		$("#textprompt").html("Would you like to delete: ");
		$(".mainbackground").css("background-image", "url('https://upload.wikimedia.org/wikipedia/commons/0/01/WWCC_240_litre_Recycling,_Green_waste_and_Garbage_bins.jpg')");
		$("#uploadyes").one("click", function (ev) {
			$("#uploadbox").hide();
			$("#loadingbox").show();
			deleteFile(selectedPoints[x], function (response) {
				$("#loadingbox").hide();
				if (response != "File successfully deleted") {
					badBox(response, function () {
						startRecursiveDelete(selectedPoints, (x+1));
					});
				}
				else {
					startRecursiveDelete(selectedPoints, (x+1));
				}
			});
		});
		$("#uploadno").one("click", function (ev) {
			$("#uploadbox").hide();
			startRecursiveDelete(selectedPoints, (x+1));
		});
		$("#uploadbox").show();
	}
	else {
		refreshDirectory();
	}
}

function deleteFile(filename, callback) {
	$.ajax({
		type: "POST",
		url: "http://104.131.135.237:3000/files/deletefile",
		data: {Directory: directory, FileName: filename, ClassRoomId: "666f6f2d6261722d71757578"},
		success: function (data) {
           callback(data);
        },
		xhrFields: {withCredentials: true},
		error:function(){
			console.log("ERROR");
		}
	})
}

$("#savefile").click(function() {
	if ($("ul > li.active").length != 0) {
		if ($("ul > li.active").hasClass("redbottom")) {
			$.ajax({
				type: "POST",
				url: "http://104.131.135.237:3000/files/saverevision",
				data: {FileUnderscoreID: $("ul > li.active").attr("data-underscoreid"), UpdatedFile: editor.getValue()},
				success: function (data) {
					if (data != "Complete") {
						badBox(data);
					}
					else {
						$("ul > li.active").attr("data-response", editor.getValue());
						$("ul > li.active").removeClass("redbottom");
						$("#revisionnumber").html("");
						$("ul > li.active").attr("data-revision-num", "-1");
						$("ul > li.active").attr("data-revision", "");
						getRevisionHistory($("ul > li.active").attr("data-underscoreid"));
					}
		        },
				xhrFields: {withCredentials: true},
				error:function(){
					console.log("ERROR");
				}
			})
		}
		else {
			badBox("Don't worry! You do not need to save yet....Make some edits to your file first!", null, "Hold Up!", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Hand_Stop_Sign_1724.jpg/1280px-Hand_Stop_Sign_1724.jpg");
		}
	}
	else {
		badBox("Please open a file to save a revision", null, "Hold Up!", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Hand_Stop_Sign_1724.jpg/1280px-Hand_Stop_Sign_1724.jpg");
	}
});

$("#addfolder").click(function() {
	$(".mainbackground").css("background-image", "url('Images/folder.jpg')");
	$("#textview").show();
	$("#textprompt").html("New Folder");
	$("#uploadyes").one("click", function (ev) {
		$("#uploadbox").hide();
		$("#loadingbox").show();
		uploadFolder($("#foldername").val())
	});
	$("#uploadno").one("click", function (ev) {
		$("#uploadbox").hide();
			$("#uploadalertboxtext").show();
					$("#textview").hide();
	});
		$("#uploadalertboxtext").hide();
		$("#uploadbox").show();

});


$("#addnewfile").click(function() {
	$(".mainbackground").css("background-image", "url('Images/folder.jpg')");
	$("#textview").show();
	$("#textprompt").html("New File");
	$("#uploadyes").one("click", function (ev) {
		$("#uploadbox").hide();
		$("#loadingbox").show();
		uploadNewFile($("#foldername").val())
	});
	$("#uploadno").one("click", function (ev) {
		$("#uploadbox").hide();
			$("#uploadalertboxtext").show();
					$("#textview").hide();
	});
		$("#uploadalertboxtext").hide();
		$("#uploadbox").show();

});


function updateDirectoryTop() {
	var dir = getDir()
	var div = $("#directory").html("<span style='padding-right:10px;'>Directory: </span>")

	for (var x = 0; x < dir.length; x++) {
		var button = $("<button>").addClass("mdl-button mdl-js-button mdl-js-ripple-effect").html(dir[x]).appendTo(div);

		if (x != dir.length - 1);
			$("<span>").html("-").appendTo(div);
		$(button).one("click", function (ev) {
			if (directory.indexOf($(this).html()) + 1 != 0) {
					directory.length =  directory.indexOf($(this).html()) + 1;
			updateDirectoryTop();
			refreshDirectory();
			}
		
		});
	}
}

function uploadFolder(text) {
	$("#loadingbox").hide();
	if (text.trim() == "") {
		badBox("Folder names must be greater than 0 characters")
	}
	else {
		var dir = getDir();
		dir.push(text)
		$.ajax({
			type: "POST",
			url: "http://104.131.135.237:3000/files/newfolder",
			data: {Directory: dir,ClassRoomId: "666f6f2d6261722d71757578"},
			success: function (data) {
					$("#uploadalertboxtext").show();
					$("#textview").hide();
		       if (data != "New folder created")
		       		badBox(data);
		       	else {
		       		refreshDirectory();
		       	}
		    },
			xhrFields: {withCredentials: true},
			error:function(){
				console.log("ERROR");
			}
		});
	}
}


function uploadNewFile(text) {
	if (text.trim() == "") {
		badBox("Folder names must be greater than 0 characters")
	}
	else {
		$.ajax({
			type: "POST",
			url: "http://104.131.135.237:3000/files/upload",
			data: {
				Files : "// New file created on " + new Date() + " using the Java Grading Application",
				Name: text,
				Directory: getDir(),
				ClassRoomId: "666f6f2d6261722d71757578"
			},
			success: function (data) {
				   $("#loadingbox").hide();
				   				$("#uploadalertboxtext").show();
					$("#textview").hide();
				if (data != "File uploaded") {
					badBox(data);
				}
	       		else {
	       			refreshDirectory();
	       		}
	        },
			xhrFields: {withCredentials: true},
			error:function(){
				console.log("ERROR");
			}
		});
	}
}

function badBox (error, callback, title, bgimage) {

	$("#uploadalertboxtext").html(error);
	$("#textprompt").html("Looks like an error occured...");
	$("#uploadyes").html("Ok");
	$("#uploadno").hide();
	

	if (title != null)
		$("#textprompt").html(title);
	if (bgimage != null) 
		$(".mainbackground").css("background-image", "url('" + bgimage + "')");
	else {
		$(".mainbackground").css("background-image", "url('Images/sad dog.jpg')");
	}
	$("#uploadyes").one("click", function (ev) {
		$("#uploadbox").hide();
		$("#uploadyes").html("Yes");
		$("#uploadno").show();
	});
	$("#uploadbox").show();

	if (callback != null) {
		callback();
	}
}
$('#addfile').click(function(){
    $('#fileInput').click();
});

var directory = ["FileSystem"];
function getDir() {
	return directory.slice(0);;
}
function addDir (text) {
	directory.push(text);
}

function refreshDirectory () {
	$.ajax({
		type: "GET",
		url: "http://104.131.135.237:3000/files/myfiles",
		data: {Directory: getDir(),ClassRoomId: "666f6f2d6261722d71757578"},
		success: function (data) {
	       createFiles(data);
	    },
		xhrFields: {withCredentials: true},
		error:function(){
			console.log("ERROR");
		}
	});
}

function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}


function createFiles (data) {
	var  realmaindiv = $("#filesgohere").html("");


	var mydiv = $("<table>").addClass("mdl-data-table mdl-js-data-table mdl-data-table--selectable mdl-shadow--2dp");
  	var thead = $("<thead>").appendTo(mydiv);
  		var tr = $("<tr>").appendTo(thead);
  			var th = $("<th>").addClass("mdl-data-table__cell--non-numeric").appendTo(tr);
  			var th1 = $("<th>").appendTo(tr);
  			var th2 = $("<th>").appendTo(tr);
  	var maindiv = $("<tbody>").appendTo(mydiv);


   var rows = [];
    for (var x = 0; x < data.length; x++) {
    	var tr = $("<tr>").appendTo(maindiv).addClass("traboveselected");
    		var name = $("<td>").addClass("mdl-data-table__cell--non-numeric").appendTo(tr).attr("name", data[x].Name)
    		var dateuploaded = $("<td>").appendTo(tr).attr("name", data[x].Name);
    		var dateaccessed = $("<td>").appendTo(tr).attr("name", data[x].Name);
    		if (data[x].Type == "File") {
    			name.html( "<span class='filename'>" +  data[x].Name + "</span>");
    			dateuploaded.html(new Date(data[x].DateUploaded).toLocaleDateString() + " "  +formatAMPM(new Date(data[x].DateUploaded)));
    			dateaccessed.html(new Date(data[x].DateLastRevised).toLocaleDateString() + " "  +formatAMPM(new Date(data[x].DateLastRevised)));
    		}
    		else {
    			name.html("<i class='fa fa-folder-open'></i> " + "<span class='filename'>" +  data[x].Name + "</span>");
    			$(name).one("click", function (ev) {
    				addDir($(this).attr("name"));
    				refreshDirectory();
					updateDirectoryTop();
    			});
    		}	 
    	rows.push(tr);
    }
    componentHandler.upgradeElement($(mydiv)[0],'MaterialDataTable');
    for (var x =0;x < rows.length; x++) {
    	$(realmaindiv).append(rows[x]);
    }



}


var omg;
$('#fileInput').change(function () {
	var file  = this.files[0];
		$('#fileInput').val("");
	$("#uploadalertboxtext").html(file.name);
	$("#textprompt").html("Would you like to upload: ");
	$(".mainbackground").css("background-image", "url('https://upload.wikimedia.org/wikipedia/commons/e/e6/Upload.svg')");
	$("#uploadyes").one("click", function (ev) {
		$("#uploadbox").hide();
		$("#loadingbox").show();
		sendFile(file);
	});
	$("#uploadno").one("click", function (ev) {
		$("#uploadbox").hide();
	});
	$("#uploadbox").show();
});

function sendFile(file) {
	var reader = new FileReader();
	reader.readAsText(file, 'UTF-8');
	reader.onload = function (data) {
		$.ajax({
			type: "POST",
			url: "http://104.131.135.237:3000/files/upload",
			data: {
				Files : data.target.result,
				Name: file.name,
				Directory: getDir(),
				ClassRoomId: "666f6f2d6261722d71757578"
			},
			success: function (data) {
				   $("#loadingbox").hide();

				if (data != "File uploaded") {
					badBox(data);


				}
	       		else {
	       			refreshDirectory();
	       		}
	        },
			xhrFields: {withCredentials: true},
			error:function(){
				console.log("ERROR");
			}
		});
	}
}