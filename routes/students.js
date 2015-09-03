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

router.get('/classlist', function (req, res) {
	isInSession(req.session.UserId, req.session.Teacher, function (data) {
		if (data == false)  {
			res.send("ERR: An error has occured. Please refresh the page and login again");
		}
		else  {
			classrooms.find({Students:  {$in: [req.session.UserId]}}, "Name _id" , function (err, results) {
				res.send(results);
			});
		}
	});
});

router.get('/getclass', function (req, res) {
	var classroomid = req.query.ClassRoomId;
	isInSession(req.session.UserId, req.session.Teacher, function (data) {
		if (data == false) 
			res.send("ERR: An error has occured. Please refresh the page and login again");
		else {
			isEnrolledInClass(req.session.UserId, classroomid, function (err, classroomdata) {
				if (err != null) 
					res.send(err);
				else {
					var obj = {
						ClassLocker: classroomdata.ClassLocker,
						Bulletin: classroomdata.Bulletin
					};
					res.send(obj);
				}
			});
		}
	});
});

router.get('/getprogramsinclass', function (req, res) {
	var classroomid = req.query.ClassRoomId;
	isInSession(req.session.UserId, req.session.Teacher, function (data) {
		if (data == false) 
			res.send("ERR: An error has occured. Please refresh the page and login again");
		else {
			isEnrolledInClass(req.session.UserId, classroomid, function (err, classroomdata) {
				if (err != null) 
					res.send(err);
				else {
					programsschem.find({ClassConnected: classroomid}, "Name Description DueDate Images _id", function (err, programdata) {
						res.send(programdata);
					});
				}
			});
		}
	});
});

router.get('/getprogramsinclassonlynames', function (req, res) {
	var classroomid = req.query.ClassRoomId;
	isInSession(req.session.UserId, req.session.Teacher, function (data) {
		if (data == false) 
			res.send("ERR: An error has occured. Please refresh the page and login again");
		else {
			isEnrolledInClass(req.session.UserId, classroomid, function (err, classroomdata) {
				if (err != null) 
					res.send(err);
				else {
					programsschem.find({ClassConnected: classroomid}, "Name _id DueDate Submissions", function (err, programdata) {
						var mydata = [];
						for (var y = 0; y < programdata.length; y++) {
							var numsubmissions = 0;
							for (var x in programdata[y].Submissions) {
								if (String(programdata[y].Submissions[x].StudentObjectId) == String(req.session.UserId)) {
									numsubmissions = programdata[y].Submissions[x].Entries.length;
								}
							}
							mydata.push( {
								Name: programdata[y].Name,
								_id: programdata[y]._id,
								DueDate: programdata[y].DueDate,
								NumSubmissions: numsubmissions
							});
						}
						
						res.send(mydata);
					});
				}
			});
		}
	});
});




// uploadsubmissiontorpgoram

// function to check if user is actually enrolled in class
module.exports = router;
