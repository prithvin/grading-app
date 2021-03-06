var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');


router.get('/insession', function (req, res) {
	if (req.session.UserId == null) {
		res.send("-1");
	}
	else if (req.session.Teacher == "YES") {
		res.send("2");
	}
	else {
		res.send("1");
	}
});
router.post('/createaccount', function (req, res) {
	if (req.body.Email == null || req.body.Password == null || parseInt(req.body.StudentID) == null || req.body.Name == null) {
		res.send("Please fill out all required fields to create a student account.")
	}
	else {
		bcrypt.genSalt(10, function(err, salt) {
		    bcrypt.hash(req.body.Password, salt, function(err, hash) {
		        var useraccount = new users ({
					Email: req.body.Email,
					Password: hash,
					Name: req.body.Name,
					StudentID: parseInt(req.body.StudentID),
					Classrooms: ['666f6f2d6261722d71757578'], // FIX HERE
					FileSystem: {
						"666f6f2d6261722d71757578" : {
							 Name: "Introduction to Java",
       		 				Type: "Folder", 
       						 Data: {}
						}
					},
					FileSystemRoot: null
				});
				useraccount.pre("save", function (next) {
					users.findOne({$or: [{Email: req.body.Email}, {StudentID: parseInt(req.body.StudentID)}]}, function (err, result) {
						if (result == null)
							next();
						else {
							if (req.body.Email == result.Email)
								res.send("Email already in use. Ask teacher for help")
							else if (req.body.StudentID == result.StudentID)
								res.send("Student ID aready in use. Ask teacher for help");
						}
					});
				});
				useraccount.save(function (err) {
					res.send("User account successfully created");
				});
		    });
		});
	}
});

router.post('/requestclass', function (req, res) {
	var classroomrequest = req.body.ClassroomId;
	users.findOne({_id : req.session.UserId}, function (err, user) {
		console.log(err);
		console.log(user);
		if (user == null) {
			res.send("Sorry, username does not exist");
		}
		else {
			classrooms.findOne({_id: classroomrequest}, function (err, data) {
				if (data == null) {
					res.send("Classroom does not exist");
				}
				else {
										res.send("Success");

				}
			});
			classrooms.update({_id : classroomrequest}, {$addToSet: {StudentsWantingToJoin: req.session.UserId}}, function (err, update) {
			});
		}
	});
});

// THIS METHOD IS TEMPORARY AND WILL BE DELETED VERY SOON THIS METHOD IS TEMPORARY AND WILL BE DELETED VERY SOON THIS METHOD IS TEMPORARY AND WILL BE DELETED VERY SOON THIS METHOD IS TEMPORARY AND WILL BE DELETED VERY SOON THIS METHOD IS TEMPORARY AND WILL BE DELETED VERY SOON THIS METHOD IS TEMPORARY AND WILL BE DELETED VERY SOON 


router.post('/login', function (req, res) {
	if (req.body.Email == null || req.body.Password == null) {
		res.send("Email or password missing. Please fill out all required fields");
	}
	else {
		users.findOne({Email: req.body.Email}, 'Password _id' , function (err, user) {
			if (user == null) {
				res.send("Sorry, username does not exist");
			}
			else {
				bcrypt.compare(req.body.Password, user.Password, function(err, correctpassword) {
				    if (correctpassword) {
				    	req.session.UserId = user._id;
				    	req.session.Teacher = "NOOO";
						req.session.save(function () {
							res.send("Student account");
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
