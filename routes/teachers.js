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
				else if (data == null) {
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
		 	else if (data == null)
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

router.get('/studentsenrolled', function (req, res) {
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
		if (user == null) {
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

module.exports = router;
