var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');


function isInSession (userid, teacher, callback) {
	if (userid == null)
		callback(false);
	else if (teacher == "YES")
		callback(false); // Teacher
	else {
		users.findOne({_id: userid}, function (err, data) {
			if (data == null) 
				callback(false);
			else if (err != null)
				callback(false);
			else 
				callback(data);
		});
	}
}

function isEnrolledInClass(userid, classroomid, callback) {
	if (classroomid == null)
		callback("ERR: Classroom does not exist", null);
	else if (userid == null)
		callback("ERR: An error has occured. Please refresh the page and login again", null);
	else {
		classrooms.findOne({_id: classroomid}, function (err, data) {
			if (err != null)
				callback("ERR: Classroom does not exist. Please refresh the page and login again", null);
			else if (data == null)
				callback("ERR: No match. Classroom does not exist. Go back to home page.", null);
			else {
				if (data.Students.indexOf(userid) == -1) 
					callback("ERR: You are not enrolled in this class.", false)
				else 
					callback(null, data);
			}
		});
	}
}


router.post('/submitprogram', function (req, res) {
	var programid = req.body.ProgramId;
	var classroomid = req.body.ClassRoomId;
	var submission = req.body.Submission; // Basically a single 'entries'
	var studentcomments = req.body.StudentComments;
	console.log("NOT EVEN HERE");
	isInSession(req.session.UserId, req.session.Teacher, function (data) {
		if (data == false) 
			res.send("ERR: Sorry, an error occured. Please refresh the page and try again later :(");
		else {
			console.log("MAYBE BUGGED OUT HERE?");
			isEnrolledInClass(req.session.UserId, classroomid, function (err, classroomdata) {
				if (err != null)
					res.send(err);
				else {
					console.log("REACHED HERE");
					var flatty = flattifyFileSystem(data.FileSystem[classroomid].Data, ["FileSystem"]);
					for (var x = 0;x < submission.Files.length; x++) 
						submission.Files[x].DirectoryPosition = flatty[submission.Files[x].UnderscoreID];
					console.log("flatty is")
					console.log(submission);
					programsschem.findOne({_id : programid}, function (err, programdata) {
						if (programid == null || err != null || programdata == null)
							res.send("ERR: This program does not exist");
						else {
							console.log("HAHA");
							var submitobj = {
								StudentName: data.Name,
								StudentObjectId: data._id,
								StudentComments: studentcomments,
								Grade: "",
								TeacherComments: "",
								Entries: submission,
								StudentSavedVMCommands: [],
								StudentSavedRegCommands: []
							}
							for (var x = 0;x  < programdata.Submissions.length; x++) {
								if (String(programdata.Submissions[x].StudentObjectId) == String(req.session.UserId)) {
									submitobj = programdata.Submissions[x];
									submitobj.Entries.push(submission);
								}
							}
							console.log("DAMN STRAIGHT");
							programsschem.update({_id: programid}, { $pull: { Submissions: { StudentObjectId: req.session.UserId } } }, function (err, up) {
								programsschem.update({_id: programid}, { $push: { Submissions: submitobj} }, function (err, up) {
									res.send("DONE");
								});
							});
						}
					});
				}
			});
		}
	})
});

function mergeJSON (json1, json2){
	var merged = {};
	for(var i in json1) {
	    if (json1.hasOwnProperty(i))
	        merged[i] = json1[i];
	}
	for(var i in json2) {
	    if (json2.hasOwnProperty(i))
	        merged[i] = json2[i];
	}
	return merged;
}


function flattifyFileSystem (filesystemData, directory) {
	var arr = {};
	for (var x  in filesystemData) {
		if (filesystemData[x].Type == "File") {
			arr[filesystemData[x].File] = directory.slice();
		}
		else {
			var newdir = directory.slice();
			newdir.push(filesystemData[x].Name);
			arr = mergeJSON(flattifyFileSystem(filesystemData[x].Data, newdir), arr);

		}
	}
	return arr;
}

/*
	StudentName: String,
            StudentObjectId: Schema.Types.ObjectId,
            StudentComments: String,
            Grade: String,
            TeacherComments: String,
            Entries : [
                {
                    DateSubmitted: Date,
                    VMCommand: String,
                    RegCommand: {},
                    Files: [
                        {
                            UnderscoreID: Schema.Types.ObjectId,
                            DirectoryPosition: String,
                            RevisionNumber: Number // Number in the array, starts from 0
                        }
                    ],
                }
            ],
            StudentSavedVMCommands: [String], // Teacher cannot see
            StudentSavedRegCommands: [] // Teacher cannot see
            */
// Submit submission by program (make sure it fully fits schema)
	// User must be in classroom to submit program

// Get submission (choose which one to get)
	// User must be the submitter or the teacher of the classroom it was submitted in

// Get submissions for program
	// Only teacher --> get all submissions (basically date and name of person submitting) compared to a list of the class
		// Basically send entire class



// New method for running programs (both ways)

module.exports = router;
