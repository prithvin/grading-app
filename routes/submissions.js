var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var fs = require('fs-extra');



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

function isTeacherOwnerOfClassroom (classid, teacherid, callback) {

	teachermod.findOne({_id: teacherid}, function (err, user) {
		console.log(teacherid);
		console.log(user);
		if (user == null || teacherid == null) {
			callback(false);
		}
		else {
			var classrooms = user.Classrooms;
			var own = false;
			for (var x = 0; x < classrooms.length; x++) {
				console.log(classrooms[x].Id);
				console.log(classid);
				console.log(String(classrooms[x].Id) == String(classid));
				if (String(classrooms[x].Id) == String(classid))  
					own = true;
			}
			if (own == true)
				callback(true);
			else
				callback(false);
		}
	});
}


router.post('/submitprogram', function (req, res) {
	var programid = req.body.ProgramId;
	var classroomid = req.body.ClassRoomId;
	var submission = req.body.Submission; // Basically a single 'entries'
	submission.DateSubmitted = new Date();
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
							submitobj.StudentComments = studentcomments; 
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


router.get('/getstudentsubmission', function (req, res) {
	var id = req.query.StudentUnderscoreId;
	var classid = req.query.ClassId;
 	var programid = req.query.ProgramId;
 	var whichsubmission = req.query.DateOfSubmission;
 	isTeacherOwnerOfClassroom(classid, req.session.UserId, function (isowner) {
 		if (isowner) { 
			programsschem.findOne({_id: programid}, "Submissions _id", function (err, data) {
 				if (err != null || data == null)
 					res.send("ERR: Program not found. Refresh page and try again");
 				else {
 					var returndata = "ERR: Submission was not found. Refresh page and try again";



 					var submissions = data.Submissions;
 					for (var x = 0;x < submissions.length; x++) {
 						if (String(submissions[x].StudentObjectId) == String(id)) {

 							returndata = {
 								StudentObjectId: submissions[x].StudentObjectId,
 								StudentComments: submissions[x].StudentComments,
 								Grade: submissions[x].Grade,
 								TeacherComments: submissions[x].TeacherComments,
 							};

 							var fileids = [];
 							for (var y = 0; y < submissions[x].Entries.length; y++) {
 								if (new Date(submissions[x].Entries[y].DateSubmitted).getTime() == new Date(whichsubmission).getTime()) {
 									returndata.Entries = submissions[x].Entries[y];
 									for (var z = 0; z < returndata.Entries.Files.length; z++) {
 										fileids.push(returndata.Entries.Files[z].UnderscoreID);
 									}
 								}
 							}

 							filesc.find({_id: {$in: fileids}}, "Name  _id", function (err, filenames) {
 								var hashnames = {};
 								returndata = JSON.parse(JSON.stringify(returndata));
 								for (var m = 0; m < filenames.length; m++) {
 									hashnames[filenames[m]._id] = filenames[m].Name;
 								}

 								for (var z = 0; z < returndata.Entries.Files.length; z++) {
									returndata.Entries.Files[z]["Name"] =  hashnames[returndata.Entries.Files[z].UnderscoreID];
									console.log(returndata.Entries.Files[z]["Name"])
								}
								console.log(returndata);
								res.send(returndata);
 							});
 							x = submissions.length +1;
 						}
 					}
 					if (returndata == "ERR: Submission was not found. Refresh page and try again")
 						res.send(returndata);
 				}
 			});
 		}
 		else {
 			res.send("ERR: ERROR. Refresh the page and login again")
 		}
 	});
});



 router.get('/forteachersgetstudentsubmissions', function (req, res) {
 	var classid = req.query.ClassId;
 	var programid = req.query.ProgramId;
 	isTeacherOwnerOfClassroom(classid, req.session.UserId, function (isowner) {
 		if (isowner) { 
 			classrooms.findOne({_id: classid}, function (err, classroomdata) {
 				if (err != null || classroomdata == null)
 					res.send("ERR: Refresh page and try again");
 				else {
 					users.find({_id: {$in: classroomdata.Students}}, "Name  _id", function (err, studentdata) {
						var hashid = {};
						for (var x = 0;x < studentdata.length; x++) {
							hashid[studentdata[x]._id] = {
								Name: studentdata[x].Name,
								Entries: null
							};
						}
						programsschem.findOne({_id: programid}, "Submissions _id", function (err, data) {
			 				if (err != null || data == null)
			 					res.send("ERR: Program not found. Refresh page and try again");
			 				else {
			 					var submissions = data.Submissions;
			 					for (var x =0; x < submissions.length; x++) {
			 						hashid[submissions[x].StudentObjectId] = {
			 							Name: submissions[x].StudentName,
			 							Entries: []
			 						};
			 						for (var y = 0; y < submissions[x].Entries.length; y++) {
			 							hashid[submissions[x].StudentObjectId].Entries.push(submissions[x].Entries[y].DateSubmitted);
			 						}
			 					}
			 					res.send(hashid);
			 				}
			 			});
					});
 				}	
 			});
 		
 		}
 		else {
 			res.send("ERR: ERROR. Refresh the page and login again")
 		}
 	});
 });


router.get('/getfile', function (req, res) {
	var fileid = req.query.FileId;
	var student = req.query.StudentUnderscoreId;
	var revisionrequested = parseInt(req.query.RevisionRequested);
	var classid = req.query.ClassId;

	if (fileid == null && student != null && revisionrequested != null ) {
		res.send("ERR:Please send all required parameters");
	}
	else {
		isTeacherOwnerOfClassroom(classid, req.session.UserId, function (isowner) {
			if (isowner) { 
				classrooms.findOne({_id: classid}, function (err, classroomdata) {
					if (err != null || classroomdata == null)
 						res.send("ERR: Refresh page and try again");
 					else {
 						if (classroomdata.Students.indexOf(student) != -1) {
							filesc.findOne({_id: fileid}, function (err, filedata) {
								if (filedata == null || err != null) {
									res.send("ERR: The revision you requested is not available");
								}
								else {
									if (revisionrequested == -1)
									revisionrequested = filedata.Data.length - 1; // Latets revision
									var filedata = filedata.Data[revisionrequested];
									
									users.findOne({_id: student}, "FileSystemRoot", function (err, data) {
										if (data == null || err != null)
											res.send("ERR: Student no more exists");
										else {
											var pathd = "StudentFiles/" + data.FileSystemRoot + "/" + filedata.FileName;
											fs.readFile(pathd, 'utf8', function (err, data) {
												res.send({
													Data: data,
													FileId: fileid
												});
											})
										}
									});
								}
								
								
							});
 						}
 						else {
 							res.send("ERR: You do not have permission to access file");
 						}
 					}
				});
			}
			else {
				res.send("ERR: ERROR. Refresh the page and login again")
			}
		});
	}
});


router.get('/getrevisions', function (req, res) {
	var fileid = req.query.FileId;
	var student = req.query.StudentUnderscoreId;
	var classid = req.query.ClassId;

	if (fileid == null && student != null) {
		res.send("ERR:Please send all required parameters");
	}
	else {
		isTeacherOwnerOfClassroom(classid, req.session.UserId, function (isowner) {
			if (isowner) { 
				classrooms.findOne({_id: classid}, function (err, classroomdata) {
					if (err != null || classroomdata == null)
 						res.send("ERR: Refresh page and try again");
 					else {
 						if (classroomdata.Students.indexOf(student) != -1) {
							filesc.findOne({_id: fileid}, function (err, filedata) {
								if (filedata == null) {
									res.send("ERR: Could not find file")
								}
								else {
									var results = [];

									for (var x  =0;x < filedata.Data.length; x++) {
										results.push({
											DatePosted: filedata.Data[x].DatePosted,
											IPAddress: filedata.Data[x].IPAddress
										});
									}
									res.send(results)
								}
							});
 						}
 						else {
 							res.send("ERR: You do not have permission to access file");
 						}
 					}
				});
			}
			else {
				res.send("ERR: ERROR. Refresh the page and login again")
			}
		});
	}
});



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
