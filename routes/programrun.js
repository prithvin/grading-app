var express = require('express');
var router = express.Router();
var fs = require('fs-extra');
var path = require('path');

router.get('/testjava', function (req ,res) {

	var cp = require('child_process');
	var compile = cp.exec('cd TestJava && javac *.java', function (err, stdin, stdout) {
		console.log("HEY");
		console.log(stdin + stdout);
		var ps = cp.spawn('java', ["Test"], {stdio: ['pipe', 'pipe'] , cwd: "TestJava"});

		var arr = ["Test\n", "22\n", "22", "22"];
		var x = 0;
		ps.stdout.on('data', function (data) {
		  console.log('stdout: ' + data);
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
		storeFilesInDir("/var/lib/docker/aufs/mnt/" + containernum.trim() + "/", data, directorydata, 0, rootdirectory, res, function (portnum) {
			if (runvm) {
				console.log("RUNNING VIRTUAL MACHINE");
				cmd = "docker exec -t " +  containernum.trim() + " bash -c \"export DISPLAY=:1 && xterm -e \'cd FileSystem && " + rundata + ";bash\'\""
				console.log(cmd);
				res.send("" + portnum);
				//docker exec -t -i 25a1cf59aa487a380a29e421528fe6450d48cb2e13376c365326b40bd4ec707f bash -c "export DISPLAY=:1 && xterm"
				exec(cmd, function(error, stdout, stderr) {
					console.log(error);
					console.log(stdout + stderr);
					console.log(portnum);
					
										
				});
			}
			
		});

	   	req.session["" + data] = new Date();
		req.session.save(function () {
			console.log("Session saved");
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
				    console.log("My Path : " + mypath);
				    console.log("Old Path : " + "StudentFiles/" + rootdirectory + "/" + filename);
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
	var cmd = "docker run -td -p " + port + ":6080 javaapp";
	exec(cmd, function(error, stdout, stderr) {
	 	if(stderr == "") {
	 		callback(port, stdout);
	 	}
	 	else {
	 		findOpenPort(exec, (port +1), callback)
	 	}
	});

}


router.post('/openvmemulator' , function (req, res) {
	var directorydata = req.body.DirectoryData;
	var rundata = req.body.RunData;
	var classroomid = req.body.ClassRoomId;
	rundata = rundata.split("\n").join(" && ");
	if (directorydata == null) {
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
			
			var flatty = flattifyFileSystem(data.FileSystem[classroomid].Data, ["FileSystem"]);
			for (var x = 0;x < directorydata.length; x++) {
				directorydata[x].Directory = flatty[directorydata[x].UnderscoreID];
			}
			runProgram(directorydata, data.FileSystemRoot, res, req, rundata, true);
		});
	}
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