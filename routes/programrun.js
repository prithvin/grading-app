var express = require('express');
var router = express.Router();
var fs = require('fs-extra');
var path = require('path');

router.get('/testjava', function (req ,res) {

	var cp = require('child_process');
	var compile = cp.exec('cd TestJava && javac *.java', function (err, stdin, stdout) {
		//console.log("HEY");
		//console.log(stdin + stdout);
		var ps = cp.spawn('java', ["Test"], {stdio: ['pipe', 'pipe'] , cwd: "TestJava"});

		var arr = ["Test\n", "22\n", "22", "22"];
		var x = 0;
		ps.stdout.on('data', function (data) {
		 // console.log('stdout: ' + data);
		  if (String(data).indexOf("Motherflocka something") != -1) {
		  	ps.stdin.write("HI\n");
		  }
		  if (String(data).indexOf("TEST") != -1) {
		  	ps.stdin.write("22\n");
		  }

		  		 ps.stdout.resume();
		  x++;
		});

		ps.stderr.on('data', function (data) {
		  console.log('stderr: ' + data);
		});

		ps.on('close', function (code) {
		  console.log('child process exited with code ' + code);
		});
	});

	
});

router.get('/canusecontainer', function (req, res) {
	if (req.session.UserId == null)
		res.send("Please login");
	else {
		if (req.session[req.query.portnum] == null) 
			res.send("NO");
		else {
			res.send(req.session[req.query.portnum])
		}
	}
});

function runProgram (directorydata, rootdirectory, res, req, rundata, runvm) {
	var exec = require('child_process').exec;
	findOpenPort(exec, 6080, function (data, containernum) {
		//res.send("Started on port " + data);
		console.log("STARTED ON THIS PORT" + data);
		console.log(containernum.trim());
		console.log("Container Number above");
		storeFilesInDir("/var/lib/docker/aufs/diff/" + containernum.trim() + "/", data, directorydata, 0, rootdirectory, res, function (portnum) {
			if (runvm == true) {
				//console.log("RUNNING VIRTUAL MACHINE");
				cmd = "docker exec -t " +  containernum.trim() + " bash -c \"export DISPLAY=:1 && xterm -e \'cd FileSystem && " + rundata + ";bash\'\""
				//console.log(cmd);
				res.send("" + portnum);
				//docker exec -t -i 25a1cf59aa487a380a29e421528fe6450d48cb2e13376c365326b40bd4ec707f bash -c "export DISPLAY=:1 && xterm"
				exec(cmd, function(error, stdout, stderr) {
					//console.log(error);
					//console.log(stdout + stderr);
					//console.log(portnum);
					
										
				});
				setTimeout(function () {
					var cmd = "docker stop " + containernum.trim() + " && " + "docker rm "  + containernum.trim();
					exec(cmd, function(error, stdout, stderr) {
					 	console.log(stdout);
					 	req.session["" + data] = null;
						req.session.save(function () {
							console.log("Session saved");
						}); 
					});
				}, 300000)
			}
			else {
				var obj = {};
				obj.FileName = runvm.FileName;
				obj.Commands =  runvm.CompileInput
				obj.AdvancedInput = runvm.AdvancedInput;
				console.log("IS THIS TRUE "+ (runvm.AdvancedInput == "true" || runvm.AdvancedInput == true));
				if (runvm.AdvancedInput == "true" || runvm.AdvancedInput == true) {
					console.log("ITS TRU");
					obj.AdvancedInput == true;
					console.log(obj.AdvancedInput);
				}
				else {
					obj.AdvancedInput == false;
					obj.BasicCounter = 0;
				}
				obj.Data = [];
				for (var x = 0; x < runvm.TextToReturn.length; x++) {
					console.log(obj.AdvancedInput);
					if (obj.AdvancedInput == true  || obj.AdvancedInput == "true") {
						console.log("AND HERE PLZ");
						var index = false;
						if (runvm.UseIndexOf[x].trim().toLowerCase() == "true")
							index = true;
						obj.Data.push({
							Text: runvm.TextToFind[x],
							ReturnText: runvm.TextToReturn[x].split("\\n").join("\n"),
							UseIndexOf: index,
							RepeatHowMany: parseInt(runvm.NumRepeats[x]),
							HowManyRepeatedSoFar: 0
						})
					}
					else {
						obj.Data.push({
							Text: null,
							ReturnText: runvm.TextToReturn[x].split("\\n").join("\n"),
							UseIndexOf: null,
							RepeatHowMany: null,
							HowManyRepeatedSoFar: null
						});
					}
				}
				var str = JSON.stringify(obj);
				console.log(str);
				var mypath = path.join("/var/lib/docker/aufs/diff/" + containernum.trim() + "/jsoninput");
				fs.outputFile(mypath, str, function (err) {
						 console.log(err) // => null
						 cmd = "docker exec -t " +  containernum.trim() + " node app.js";
					exec(cmd, {timeout: 30000},  function(error, stdout, stderr) {
						console.log(error);
						console.log(stdout + stderr);
						console.log("HEY YA");
						 fs.readFile(path.join("/var/lib/docker/aufs/diff/" + containernum.trim() + "/outputfile"), 'utf8', function (err, data) {
						 	console.log(err);
						 	console.log("COOLZ");
						    res.send(data); // => hello!
							var cmd = "docker stop " + containernum.trim() + " && " + "docker rm "  + containernum.trim();
							exec(cmd, function(error, stdout, stderr) {
							 	console.log(stdout);
							 	req.session["" + data] = null;
								req.session.save(function () {
									console.log("Session saved");
								}); 
							});
						  })

						// res.send the results file	
					});
				});
				// Save json file here
				// Make sure to have timeout for command below

			
			}
		});

	   	req.session["" + data] = new Date();
		req.session.save(function () {
			console.log("Session saved");
		}); 


		
		//UnderscoreID: $($(".tabnotactive")[x]).attr("data-underscoreid"),
			//RevisionNumber
			//Directory

			//b5125d7d572a5c67dea740ad7fb2769d4b9b8727843f778d92f63d935d0d67b9
	});
}

function storeFilesInDir(maindir, portnum, directorydata, x, rootdirectory, res, rundata) {
	if (directorydata.length != x) {
		filesc.findOne({_id: directorydata[x].UnderscoreID}, function (err, data) {
			if (directorydata[x].RevisionNumber == "-1") {
				directorydata[x].RevisionNumber = data.Data.length - 1;
			}
			if (err != null) {
				console.log(directorydata[x].UnderscoreID + "Did not work");
				storeFilesInDir(maindir, portnum, directorydata, (x+1), rootdirectory, res, rundata);
			}
			else if (data.Data[directorydata[x].RevisionNumber] == null) {
				console.log("revision for " + directorydata[x].UnderscoreID  + "is n/a");
				storeFilesInDir(maindir, portnum, directorydata, (x+1), rootdirectory, res, rundata);
			}
			else {
				//
				var mypath = path.join(maindir);
				var filename = data.Data[directorydata[x].RevisionNumber].FileName;
				for (var y = 0; y < directorydata[x].Directory.length; y++) 
					mypath = path.join(mypath, directorydata[x].Directory[y]);
				mypath = path.join(mypath, data.Name);

				fs.copy("StudentFiles/" + rootdirectory + "/" + filename, mypath, function(err) {
				    if(err) {
				        return console.log(err);
				    }
				  //  console.log("My Path : " + mypath);
				    //console.log("Old Path : " + "StudentFiles/" + rootdirectory + "/" + filename);
				    storeFilesInDir(maindir, portnum, directorydata, (x+1), rootdirectory, res, rundata);

				});
			}
		});
	}
	else {

		rundata(portnum);
	}
}
function findOpenPort (exec, port, callback) {
	var cmd = "docker run -td -p " + port + ":6080 javaapp4";
	exec(cmd, function(error, stdout, stderr) {
	 	if(stderr == "") {
	 		callback(port, stdout);
	 	}
	 	else {
	 		findOpenPort(exec, (port +1), callback)
	 	}
	});

}


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

function newStuffForTeachers(studentid, sessionid, classroomid, callback) {
	if (studentid != null) {
		teachermod.findOne({_id: sessionid}, function (err, data) {
			if (data == null || err != null) {
				callback(false);
			}
			else {
				for (var x = 0;x < data.Classrooms.length; x++) {
					if (data.Classrooms[x].Id == classroomid) {
						callback(true);
					}
				}
			}
		});
	}
	else {
		callback(false);
	}
}
router.post('/openvmemulator' , function (req, res) {
	var directorydata = req.body.DirectoryData;
	var rundata = req.body.RunData;
	var classroomid = req.body.ClassRoomId;
	rundata = rundata.split("\n").join(" && ");

	var studentid = req.session.UserId;
	var teacher = req.session.Teacher;
	newStuffForTeachers(req.body.StudentId, req.session.UserId, classroomid, function (isgood) {
		if (isgood) {
			studentid = req.body.StudentId;
			teacher = "NO";
		}


		if (directorydata == null) {
			res.send("ERR: Please send all required parameters");
		}
		else {
			isInSession(studentid, teacher, function (data) {
				if (data == false) 
					res.send("ERR: Sorry, an error occured. Please refresh the page and try again later :(");
				else {
					isEnrolledInClass(studentid, classroomid, function (err, classroomdata) {
						if (err != null)
							res.send(err);
						else {
							var flatty = flattifyFileSystem(data.FileSystem[classroomid].Data, ["FileSystem"]);
							for (var x = 0;x < directorydata.length; x++) {
								directorydata[x].Directory = flatty[directorydata[x].UnderscoreID];
							}
							runProgram(directorydata, data.FileSystemRoot, res, req, rundata, true);
						}
					});
				}
			})
		}
	});
});



router.post('/openregemulator' , function (req, res) {
	var directorydata = req.body.DirectoryData;
	var classroomid = req.body.ClassRoomId;
	var jsondata = req.body.JsonData;

	var studentid = req.session.UserId;
	var teacher = req.session.Teacher;
	newStuffForTeachers(req.body.StudentId, req.session.UserId,classroomid, function (isgood) {
		if (isgood) {
			studentid = req.body.StudentId;
			teacher = "NO";
		}


		if (jsondata.AdvancedInput == null) {
			res.send("ERR: Error, please send all required parameters");
		}
		else if (jsondata.AdvancedInput == true) {
			if (jsondata.TextToFind.length != jsondata.TextToReturn.length || jsondata.TextToReturn.length != jsondata.UseIndexOf.length || jsondata.UseIndexOf.length != jsondata.NumRepeats.length) {
				res.send("ERR: Error. Some paramters not inputted correctly");
			}
		}
		else if (directorydata == null) {
			res.send("ERR: Please send all required parameters");
		}
		else {
			isInSession(studentid, teacher, function (data) {
				if (data == false) 
					res.send("ERR: Sorry, an error occured. Please refresh the page and try again later :(");
				else {
					isEnrolledInClass(studentid, classroomid, function (err, classroomdata) {
						if (err != null)
							res.send(err);
						else {
							var flatty = flattifyFileSystem(data.FileSystem[classroomid].Data, ["FileSystem"]);
							for (var x = 0;x < directorydata.length; x++) {
								directorydata[x].Directory = flatty[directorydata[x].UnderscoreID];
							}
							runProgram(directorydata, data.FileSystemRoot, res, req, null, jsondata);
						}
					});
				}
			})
		}
	});

	
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

module.exports = router;