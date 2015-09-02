var express = require('express');
var router = express.Router();
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

router.post('/upload', function (req, res) {
	// %& not allowed in file name
	// Make sure exact same file name (non-case sensitive is not in the folder)
		// User prompted to rename file if it is

	var file = req.body.Files;
	var filename = req.body.Name;
	var directory = req.body.Directory;
	var classroomid = req.body.ClassRoomId;

	if (file == null || filename == null || directory == null) {
		res.send("Sorry, an error occured. Please refresh the page and try again later :(");
		// Please send all the required parameters
	}
	else {
		isInSession(req.session.UserId, req.session.Teacher, function (data) {
			if (data == false) 
				res.send("Sorry, an error occured. Please refresh the page and try again later :(");
			else {
				isEnrolledInClass(req.session.UserId, classroomid, function (err, classroomdata) {
					if (err != null)
						res.send(err);
					else {
						var rootdirectory = data.FileSystemRoot;
						if (rootdirectory == null) {
							rootdirectory = (new Date().getTime()) + "Directory" + data.StudentID;
							users.update({_id : req.session.UserId}, {$set: {FileSystemRoot: rootdirectory}}, function (err,up) {
								uploadFile(file, filename, directory, req, data, res, rootdirectory, classroomid);
							});
						}
						else {
							uploadFile(file, filename, directory, req, data, res, rootdirectory, classroomid);
						}
					}
				});
			}
		})
	}
});

function uploadFile(file, filename, directory, req, data, res, rootdirectory, classroomid) {
	var path = "";
	for (var x = 0; x < directory.length; x++) {
		path += directory[x] + "/";
	}
	if (fileNotRepeat(directory, filename, data, res, classroomid)) {
		var revfilename = filename + new Date().getTime();
		fs.outputFile("StudentFiles/" + rootdirectory + "/" + revfilename, file, function(err) {
		    if(err) {
		        return console.log(err);
		    }
		    saveFile(filename, file, res, req, revfilename, data, directory, classroomid);
		}); 
	}
}

function saveFile (filename, file, res, req, revfilename, data, directory, classroomid) {
	var newfile = new filesc ({
		Name: filename, // Date uploaded is the first Data upload thing
	    Data: [ // Includes revision history
	        {
	            FileName: revfilename, /// Basically LOL.java123312312. -- the time that the file was posted
	            DatePosted: new Date().getTime(), // MAKE SURE THERE ARE NOT TWO FILES WITH THE SAME NAME IN THE SAME DIRECTORY
	            IPAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress
	        }
	    ],
	    FileOwner: data._id
	});
	newfile.pre("save", function (next) {
		var fsys = {
				classroomid: {
					Name: "FileSystem",
					Type: "Folder", 
					Data: {}
				}
		};
		if (data.FileSystem != undefined) {;
			fsys = JSON.parse(JSON.stringify(data.FileSystem));
		}
		if (data.FileSystem[classroomid] == null) {
			fsys[classroomid] = {
				Name: "FileSystem",
				Type: "Folder",
				Data: {}
			}
		}

		fsyscopy = fsys[classroomid].Data;
		for (var y = 1; y < directory.length; y++) {
			if (fsyscopy[directory[y].replace(".", "%&")].Type == "Folder") {
				fsyscopy = fsyscopy[directory[y].replace(".", "%&")].Data;
			}
			else {
				console.log("Error, some issue came up :(");
			}
		}
		fsyscopy[filename.replace(".", "%&")] = {
			  Name: filename,
              Type: "File",
              File: newfile._id
		};
		users.update({_id : req.session.UserId}, {$set: {FileSystem: fsys}}, function (err,up) {
			next();
		});

	});
	newfile.save(function (err) {
		res.send("File uploaded");
	});
}


function fileNotRepeat(directory, filename, data, res, classroomid) {
	if (data.FileSystem[classroomid] == null)
		return true;
	var filestuff = data.FileSystem[classroomid].Data;
	if (directory[0] != "FileSystem") {
		res.send("Not parsed correctly. Must start with FileSystem");
		return false;
	}
	else {
		for (var y = 1; y < directory.length; y++) {
			if (filestuff[directory[y].replace(".", "%&")] == null) {
				res.send("Uhoh! The directory you are trying to upload your file in does not exist :(")
				return false;
			}
			filestuff = filestuff[directory[y].replace(".", "%&")].Data;
		}
		for (var m in filestuff) {
			if (m.toLowerCase() == filename.toLowerCase().replace(".", "%&")) {
				res.send("Uhoh! Looks like you are trying to upload a duplicate. Either rename the old file or rename the new one and reupload.")
				return false;
			}
		}
		if (filestuff == null || filestuff[filename] == null) 
			return true;
		else 
			return false;
	}
	return false;
}



router.post('/newfolder', function (req, res) {
		// %& not allowed in file name
	var directory = req.body.Directory;
	var classroomid = req.body.ClassRoomId;

	if (directory[0] != "FileSystem") {
		res.send("Not parsed correctly. Must start with FileSystem");
		return false;
	}
	else if (req.session.UserId == null) {
		res.send("Please login to continue");
	}
	else {
		users.findOne({_id : req.session.UserId}, function (err, data) {
			if (data == null) 
				res.send("Please login");
			else {
				var filestuff = data.FileSystem;
				var currentsys = filestuff[classroomid].Data;
				for (var y = 1; y < directory.length -1; y++) {
					if (currentsys[directory[y].replace(".", "%&")] == null) {
						res.send("The folder you are trying to add a file to does not exist??? What are you doing!")
						return false;
					}
					currentsys = currentsys[directory[y].replace(".", "%&")].Data;
				}
				var foldername = directory[directory.length - 1];
				for (var m in currentsys) {
					if (m.toLowerCase() == foldername.toLowerCase().replace(".", "%&")) {
						res.send("Folder already exists. Cannot replace folder. Please change the name of the duplicate folder and recreate.")
						return false;
					}
				}
				currentsys[foldername.replace(".", "%&")] = {
					 Name: foldername,
                    Type: "Folder",
                    Data: {}
				};
				users.update({_id : req.session.UserId}, {$set: {FileSystem: filestuff}}, function (err,up) {
					res.send("New folder created");
				});
			}
		});
	}
});
router.get('/myfiles', function (req, res) {
	var directory = req.query.Directory;
		var classroomid = req.query.ClassRoomId;

	if (directory[0] != "FileSystem") {
		res.send("Not parsed correctly. Must start with FileSystem");
		return false;
	}
	else if (req.session.UserId == null) {
		res.send("Please login to continue");
	}
	else {
		users.findOne({_id : req.session.UserId}, function (err, data) {
			if (data == null) 
				res.send("Please login");
			else {
				var filestuff = data.FileSystem[classroomid].Data;
				var dirstuff = data.FileSystem;
				for (var y = 1; y < directory.length; y++) {
					if (filestuff[directory[y].replace(".", "%&")] == null) {
						res.send("The folder you are trying to add a file to does not exist??? What are you doing!")
						return false;
					}
					dirstuff = filestuff[directory[y].replace(".", "%&")];
					filestuff = filestuff[directory[y].replace(".", "%&")].Data;
					
				}
				var ids = [];
				for (var m in filestuff) {
					ids.push({
						AccessName: m,
						Name: filestuff[m].Name,
						Type: filestuff[m].Type,
						UnderscoreId: filestuff[m].File
					});
				}
				getOtherData(ids, res, data, [], 0);
			}
		});
	}
});

function getOtherData (ids, res, data, obj, x) {
	if (ids.length == x) {
		res.send(obj);
	}
	else if (ids[x].Type == "Folder") {
		obj.push({
			Name: ids[x].Name,
			AccessName: ids[x].AccessName,
			Type: "Folder",
			DateUploaded: null,
			DateLastRevised: null
		});
		getOtherData(ids, res, data, obj, (x+1));
	}
	else {
		filesc.findOne({_id: ids[x].UnderscoreId}, function (err, data) {
			if (err != null) {
				getOtherData(ids, res, data, obj, (x+1));
			}
			else {
				obj.push({
					Name: ids[x].Name,
					AccessName: ids[x].AccessName,
					Type: "File",
					DateUploaded: data.Data[0].DatePosted,
					DateLastRevised: data.Data[data.Data.length - 1].DatePosted
				});
				getOtherData(ids, res, data, obj, (x+1));
			}
		});
	}

}

router.post('/deletefile' , function (req, res) {
	var file = req.body.FileName;
	var directory = req.body.Directory;
		var classroomid = req.body.ClassRoomId;

	if (directory[0] != "FileSystem") {
		res.send("Not parsed correctly. Must start with FileSystem");
		return false;
	}
	else if (req.session.UserId == null) {
		res.send("Please login to continue");
	}
	else {
		users.findOne({_id: req.session.UserId}, function (err, data) {
			if (err) {
				console.log(err);
			}
			else {
				var filesystem = data.FileSystem;
				var subsystem = filesystem[classroomid].Data;
				for (var x = 1; x < directory.length; x++) {
					if (subsystem[directory[x].replace(".", "%&")] == null) {
						res.send("The folder you are trying to add a file to does not exist??? What are you doing!")
						return false;
					}
					subsystem = subsystem[directory[x].replace(".", "%&")].Data;
				}
				if (subsystem[file.replace(".", "%&")] != null) {
					delete subsystem[file.replace(".", "%&")];
					users.update({_id : req.session.UserId}, {$set: {FileSystem: filesystem}}, function (err,up) {
											res.send("File successfully deleted");
					});

				}
				else {
					res.send("File not find");
				}
			}
		});
	}
});


router.post('/saverevision', function (req, res) {
	var filename = req.body.FileUnderscoreID;
	var filetoupload = req.body.UpdatedFile;

	if (filename == null ) {
		res.send("Please send all required parameters");
	}
	else if (req.session.UserId == null) {
		res.send("Please login to continue");
	}
	else {
		users.findOne({_id: req.session.UserId}, function (err, data) {
			if (err) {
				console.log(err);
			}
			else {
				var id = mongoose.Types.ObjectId(filename);
				filesc.findOne({_id: id}, function (err, filedata) {

					if (filedata == null) {
						res.send("Could not find file")
					}
					else if (String(filedata.FileOwner) != String(data._id)) {
						res.send("You cannot revise a file you do not own! Try logging in again.")
					}
					else {
						var time = new Date().getTime();
						var revfilename = filedata.Name + time;
						fs.outputFile("StudentFiles/" + data.FileSystemRoot + "/" + revfilename, filetoupload, function(err) {
						    if(err) {
						        return console.log(err);
						    }
						    var newrev = {
								FileName: revfilename,
								DatePosted: time,
								IPAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress
							};
							filesc.update({_id: filename}, {$push: {Data : newrev}}, function (err, up) {
								res.send("Complete");
							});
						}); 
					}
				});
			}
		});
	}
});

router.get('/getfilecontentsbyid', function (req, res) {
	var file = req.query.FileId;
	var revisionnumber = parseInt(req.query.RevisionNumber);
	if (file == null || revisionnumber == null) {
		res.send("Please send all required parameters");
	}
	else if (req.session.UserId == null) {
		res.send("Please login to continue");
	}
	else {
		users.findOne({_id : req.session.UserId}, function (err, data) {
			if (err) {
				console.log(err);
			}
			else {
				var id = mongoose.Types.ObjectId(file);
				filesc.findOne({_id: id}, function (err, filedata) {
					if (filedata == null) {
						res.send("Could not find file")
					}
					else if (String(filedata.FileOwner) != String(data._id)) {
						res.send("You cannot revise a file you do not own! Try logging in again.")
					}
					else {
						var filedata = filedata.Data[revisionnumber];
						if (filedata == null) {
							res.send("The revision you requested is not available");
						}
						else {
							var pathd = "StudentFiles/" + data.FileSystemRoot + "/" + filedata.FileName;
							fs.readFile(pathd, 'utf8', function (err, data) {
								res.send({
									Data: data
								});
							})
						}
					}
				});
			}
		});
	}
});





router.get('/getfilecontents', function (req, res) {
	var filename = req.query.FileName;
	var directory = req.query.Directory;
	var revisionrequested = req.query.RevisionRequested; // Which revision number
			var classroomid = req.query.ClassRoomId;


	if (filename == null || directory == null) {
		res.send("Please send all required parameters");
	}
	else if (directory[0] != "FileSystem") {
		res.send("Not parsed correctly. Must start with FileSystem");
		return false;
	}
	else if (req.session.UserId == null) {
		res.send("Please login to continue");
	}
	else {
		users.findOne({_id: req.session.UserId}, function (err, data) {
			if (err) {
				console.log(err);
			}
			else {
				var subsystem = data.FileSystem[classroomid].Data;
				for (var x = 1; x < directory.length; x++) {
					if (subsystem[directory[x].replace(".", "%&")] == null) {
						res.send("The folder you are trying to open a file to does not exist??? What are you doing!")
						return false;
					}
					subsystem = subsystem[directory[x].replace(".", "%&")].Data;
				}
				if (subsystem[filename.replace(".", "%&")] != null) {
					var file =  subsystem[filename.replace(".", "%&")];
					if (file.Type == "Folder") {
						res.send("Cannot open a folder in the editor. Select individual files");
					}
					else {
						var fileunderscoreid = file.File;
						filesc.findOne({_id: fileunderscoreid}, function (err, filedata) {
							if (revisionrequested == null)
								revisionrequested = filedata.Data.length - 1; // Latets revision
							var filedata = filedata.Data[revisionrequested];
							if (filedata == null) {
								res.send("The revision you requested is not available");
							}
							var pathd = "StudentFiles/" + data.FileSystemRoot + "/" + filedata.FileName;
							fs.readFile(pathd, 'utf8', function (err, data) {
								res.send({
									Data: data,
									FileId: fileunderscoreid
								});
							})
						});
					}

				}
				else {
					res.send("File not found");
				}
			}
		});
	}
});


router.get('/getrevisions', function (req, res) {
	var file = req.query.FileId;
	if (file == null ) {
		res.send("Please send all required parameters");
	}
	else if (req.session.UserId == null) {
		res.send("Please login to continue");
	}
	else {
		users.findOne({_id : req.session.UserId}, function (err, data) {
			if (err) {
				console.log(err);
			}
			else {
				var id = mongoose.Types.ObjectId(file);
				filesc.findOne({_id: id}, function (err, filedata) {
					if (filedata == null) {
						res.send("Could not find file")
					}
					else if (String(filedata.FileOwner) != String(data._id)) {
						res.send("You cannot revise a file you do not own! Try logging in again.")
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
		});
	}
});
module.exports = router;