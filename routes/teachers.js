var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');

router.post('/createaccount', function (req, res) {
	if (req.body.Email == null || req.body.Password == null) {
		res.send("Please fill out all required fields to create a student account.")
	}
	else {
		bcrypt.genSalt(10, function(err, salt) {
		    bcrypt.hash(req.body.Password, salt, function(err, hash) {
		        var useraccount = new teachermod ({
					Email: req.body.Email,
					Password: hash,
					Classrooms: []
				});
				useraccount.pre("save", function (next) {
					teachermod.findOne({Email: req.body.Email}, function (err, result) {
						if (result == null)
							next();
						else if (req.body.Email == result.Email) {
							res.send("Email already in use. Ask teacher for help")
						}
					});
				});
				useraccount.save(function (err) {
					res.send("Teacher account successfully created");
				});
		    });
		});
	}
});

router.post('/createclass', function (req, res) {
	if (req.session.Teacher == "YES") {
		 var newroom = new classrooms ({
			Name: req.body.Name,
			Students: [], 
			StudentsWantingToJoin: [],  // Make sure to remove students from here once they are accepted
			ClassLocker: [],
			Bulletin: [],
			Submissions: [],
			Discussion: []
		});
		newroom.pre("save", function (next) {
			teachermod.findOne({_id: req.session.UserId}, function (err, data) {
				if (err != null)
					res.send(err);
				else if (data == null || req.session.UserId == null) {
					res.send("You dont exist");
				}
				else {
					next();
				}
			});
		});
		newroom.save(function (err) {
			var obj = {
				Name: req.body.Name,
				Id: newroom._id
			}
			teachermod.update({_id: req.session.UserId}, {$push: {Classrooms: obj}}, function (err, update) {
				console.log(err);
				res.send(obj);
			});

		});
	}
	else {
		res.send("Only teachers can create classrooms");
	}
});

router.get('/getclasses', function (req, res) {
	if (req.session.Teacher == "YES") {
		 teachermod.findOne({_id: req.session.UserId}, function (err, data) {
		 	if (err != null)
		 		res.send(err);
		 	else if (data == null || req.session.UserId == null)
		 		res.send("You don't exist");
		 	else 
		 		res.send(data.Classrooms);
		 });
	}
	else {
		res.send("You are not a teacher...");
	}
});

router.get('/studentswantingtojoin', function (req, res) {
	var classid = req.query.ClassroomId;
	teachermod.findOne({_id: req.session.UserId}, function (err, user) {
		if (user == null) {
			res.send("LOGIN");
		}
		else {
			var classroomarr = user.Classrooms;
			var own = false;
			for (var x = 0; x < classroomarr.length; x++) {
				if (String(classroomarr[x].Id) == String(classid))  
					own = true;
			}
			if (own) {
				classrooms.findOne({_id: classid}, function (err, data) {
					if (data == null) {
						res.send("Classroom does not exist");
					}
					else {
						users.find({_id: {$in: data.StudentsWantingToJoin}}, "Email Name StudentID _id", function (err, students) {
							res.send(students);
						});
					}
				});
			}
		}
	});
});

router.get('/addstudenttoclass', function (req, res) {
	var classid = req.query.ClassroomId;
		var studentid = req.query.StudentSchemaId;
	var removestudent = req.query.RemoveStudent;
	teachermod.findOne({_id: req.session.UserId}, function (err, user) {
		if (user == null || req.session.UserId == null) {
			res.send("LOGIN");
		}
		else {
			var classroomarr = user.Classrooms;
			var own = false;
			for (var x = 0; x < classroomarr.length; x++) {
				if (String(classroomarr[x].Id) == String(classid))  
					own = true;
			}
			if (own) {
				classrooms.update({_id : classid}, {$pull: {StudentsWantingToJoin: studentid}}, function (err, update) {
					console.log(err);
				});
				if (removestudent != "YES") {
					classrooms.update({_id : classid}, {$addToSet: {Students: studentid}}, function (err, update) {
						console.log(err);
					});
					users.update({_id: studentid}, {$addToSet: {Classrooms: classid}}, function (err, update) {
						console.log(err);
					});
				}
				
				res.send("Done");
			}
		}
	});
});
router.get('/removestudentfromclass', function (req, res) {
	var classid = req.query.ClassroomId;
		var studentid = req.query.StudentSchemaId;
	teachermod.findOne({_id: req.session.UserId}, function (err, user) {
		if (user == null || req.session.UserId == null) {
			res.send("LOGIN");
		}
		else {
			var classroomarr = user.Classrooms;
			var own = false;
			for (var x = 0; x < classroomarr.length; x++) {
				if (String(classroomarr[x].Id) == String(classid))  
					own = true;
			}
			if (own) {

				classrooms.update({_id : classid}, {$pull: {Students: studentid}}, function (err, update) {
					console.log(err);
				});
				users.update({_id: studentid}, {$pull: {Classrooms: classid}}, function (err, update) {
					console.log(err);
				});
	
				
				res.send("Done");
			}
		}
	});
});

router.get('/studentsenrolled', function (req, res) {
	var classid = req.query.ClassroomId;
	teachermod.findOne({_id: req.session.UserId}, function (err, user) {
		if (user == null || req.session.UserId == null) {
			res.send("LOGIN");
		}
		else {
			var classroomarr = user.Classrooms;
			var own = false;
			for (var x = 0; x < classroomarr.length; x++) {
				if (String(classroomarr[x].Id) == String(classid))  
					own = true;
			}
			if (own) {
				classrooms.findOne({_id: classid}, function (err, data) {
					if (data == null) {
						res.send("Classroom does not exist");
					}
					else {
						users.find({_id: {$in: data.Students}}, "Email Name StudentID _id", function (err, students) {
							res.send(students);
						});
					}
				});
			}
		}
	});
});

router.get('/doesownclass', function (req, res) {
	var classid = req.query.ClassroomId;
	teachermod.findOne({_id: req.session.UserId}, function (err, user) {
		if (user == null || req.session.UserId == null) {
			res.send("LOGIN");
		}
		else {
			var classrooms = user.Classrooms;
			var own = false;
			for (var x = 0; x < classrooms.length; x++) {
				console.log(String(classrooms[x].Id) == String(classid));
				if (String(classrooms[x].Id) == String(classid))  {
					console.log("IN HERE NEVER");
					own = true;
				}
			}
			if (own == true)
				res.send("YES");
			else
				res.send("NO");
		}
	});
});


router.post('/login', function (req, res) {
	if (req.body.Email == null || req.body.Password == null) {
		res.send("Email or password missing. Please fill out all required fields");
	}
	else {
		teachermod.findOne({Email: req.body.Email}, 'Password _id' , function (err, user) {
			if (user == null) {
				res.send("Sorry, username does not exist");
			}
			else {
				bcrypt.compare(req.body.Password, user.Password, function(err, correctpassword) {
				    if (correctpassword) {
				    	req.session.UserId = user._id;
						req.session.Teacher = "YES";
						req.session.save(function () {
							res.send("Teacher account");
						}); 
				    }
				    	
				    else 
				    	res.send("Wrong password");
				});
			}
		});
	}
});

router.get('/dailybulletin', function (req, res) {
	var date = req.query.DateSelected;
	var classid = req.query.ClassroomId;
	teachermod.findOne({_id: req.session.UserId}, function (err, user) {
		if (user == null || req.session.UserId == null) {
			res.send("Uh Oh. A problem occurred. Refresh page and login");
		}
		else {
			var classroomsch = user.Classrooms;
			var own = false;
			for (var x = 0; x < classroomsch.length; x++) {
				console.log(String(classroomsch[x].Id) == String(classid));
				if (String(classroomsch[x].Id) == String(classid))  {
					own = true;
				}
			}
			if (own == true) {
				classrooms.findOne({_id: classid}, function (err, data) {
					var posts = data.Bulletin;
					var found = "<p>No Post for this day. Create one!</p>";
					for (var x = 0 ; x < posts.length; x++) {
						console.log(new Date(posts[x].DateOf) === new Date(date));
						console.log(new Date(posts[x].DateOf));
						console.log(new Date(date));
						if (new Date(posts[x].DateOf).getTime() == new Date(date).getTime()) {
							console.log("WHY YOU NO COME HERE");
							found = posts[x].TextDesc;
						}
					}
					res.send(found);
				});
				
			}
			else {
				res.send("Not your own class");
			}
		}
	});
});

 
 router.get('/getprograms', function (req, res) {
 	var classid = req.query.ClassId;
 	isTeacherOwnerOfClassroom(classid, req.session.UserId, function (isowner) {
 		if (isowner) { 
 			programsschem.find({ClassConnected: classid}, "Name Description DueDate Images _id", function (err, data) {
 				res.send(data);
 			});
 		}
 		else {
 			res.send("ERROR. Refresh the page and login again")
 		}
 	});
 });

 router.get('/getprogramsbynameandid', function (req, res) {
 	var classid = req.query.ClassId;
 	isTeacherOwnerOfClassroom(classid, req.session.UserId, function (isowner) {
 		if (isowner) { 
 			programsschem.find({ClassConnected: classid}, "Name _id", function (err, data) {
 				res.send(data);
 			});
 		}
 		else {
 			res.send("ERROR. Refresh the page and login again")
 		}
 	});
 });

router.post('/updateprogram', function (req, res) {
	var name = req.body.Name;
	var description = req.body.Description;
	var duedate = req.body.DueDate;
	var images = req.body.Images;
	var programid = req.body.ProgramId;
	var classid = req.body.ClassId;
	isTeacherOwnerOfClassroom(classid, req.session.UserId, function (isowner) {
		if (isowner) {
			programsschem.findOne({_id: programid}, function (err, program) {

				if (program == null || programid == null) {
					var newprogram = new programsschem ({
						Name: name,
						Description: description, 
						DueDate: duedate,  // Make sure to remove students from here once they are accepted
						Images: images,
						ClassConnected: classid,
						Submissions: [],
					 	SavedVMCommands: [],
						SavedRegCommands: []
					});
					newprogram.pre("save", function (next) {
						next();
					});
					newprogram.save(function (err) {
						res.send("DONE" + String(newprogram._id));
					});
				}
				else if (String(program.ClassConnected) != String(classid)) {
					res.send("This program is no more part of this classroom");
				}
				else {
					programsschem.update({_id: programid}, {$set: {Name: name, Description: description, DueDate: duedate, Images: images}}, function (err, up) {
						res.send("DONE" + String(programid));
					});
				}
			});
		}
		else {
			res.send("ERROR. Refresh the page and login again");
		}
	});
});

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



router.post('/newbulletin', function (req, res) {
	var date = req.body.DateSelected;
	var classid = req.body.ClassroomId;
	var text = req.body.Bulletin;
	teachermod.findOne({_id: req.session.UserId}, function (err, user) {
		if (user == null || req.session.UserId == null) {
			res.send("Uh Oh. A problem occurred. Refresh page and login");
		}
		else {
			var classroomsc = user.Classrooms;
			var own = false;
			for (var x = 0; x < classroomsc.length; x++) {
				console.log(String(classroomsc[x].Id) == String(classid));
				if (String(classroomsc[x].Id) == String(classid))  {
					own = true;
				}
			}
			if (own == true) {
				classrooms.update({_id: classid}, {$pull : {Bulletin : {DateOf : date}}}, function (err, up) {
					console.log(err);
					var newlisting = {
						DateOf: date,
						TextDesc: text
					}
					classrooms.update({_id: classid}, {$push : {Bulletin : newlisting}}, function (err, up) {
						console.log(err);
						res.send("DONE");
					});
				});
			}
			else {
				res.send("Not your own class");
			}
		}
	});
})
module.exports = router;
