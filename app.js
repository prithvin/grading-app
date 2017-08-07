var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var userspage = require('./routes/users');
var filesys = require('./routes/files')
var programrun = require('./routes/programrun')
var teacherspage = require('./routes/teachers')
var studentspage = require('./routes/students')
var submissionpage = require('./routes/submissions');

var helmet = require('helmet');
var lusca = require('lusca');
var session = require('express-session')
mongoose = require('mongoose');

mongoose.connect('mongodb://mishel:zavala@kahana.mongohq.com:10047/Inqora')
db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {});
var Schema = mongoose.Schema;

useraccounts = new Schema ({
    Email: String,
    Password: String,
    Name: String,
    StudentID: Number,
    FileSystemRoot: String,
    Classrooms: [Schema.Types.ObjectId], // Array of the _ids of the classrooms the student is in
    FileSystem: {}
    //FileSystem: ClassRoomId: {
        //      _idOFCLASSROOM: { Name: String, Type: String, Date: {}}}
        //}

    /*
    {
        Name: String,
        Type: String, 
        Data: {}
    }
    */
     // Either have one more array (folder) or link to file
            // Each file looks like this:
            /*
                "Dice.Java" :  {
                    Name: "Dice.java",
                    Type: "File",
                    File: Scheme.Types.ObjectId
                }
                "Dice" : {
                    Name: "Dice",
                    Type: "Folder",
                    Data: {}
                }
            */
});
users = mongoose.model('UserAccounts', useraccounts, 'useraccounts');

files = new Schema ({
    Name: String, // Date uploaded is the first Data upload thing
    Data: [ // Includes revision history
        {
            FileName: String, /// Basically LOL.java123312312. -- the time that the file was posted
            DatePosted: Date, // MAKE SURE THERE ARE NOT TWO FILES WITH THE SAME NAME IN THE SAME DIRECTORY
            IPAddress: String
        }
    ],
    FileOwner: Schema.Types.ObjectId
})
filesc = mongoose.model('files', files, 'files');


classroom = new Schema ({
    Name: String,
    Students: [Schema.Types.ObjectId], 
    StudentsWantingToJoin: [Schema.Types.ObjectId],  // Make sure to remove students from here once they are accepted
    ClassLocker: [
        {
            FileName: String,
            FileDirectory: String
        }
    ],
    Bulletin: [
        {
            DateOf: Date,
            TextDesc: String
        }
    ],
    Submissions: [{
        Files: [],
        VMCommand: String,
        RegCommand: String,
        UserSubmitted: Schema.Types.ObjectId,
        Grade: String,
        TeacherComments: String
    }],
    Discussion: [

    ]
});

classrooms = mongoose.model('ClassRoomAccount', classroom, 'classroomaccount');


programs = new Schema ({
    Name: String,
    Description: String,
    DueDate: Date,
    Images: [],
    ClassConnected: Schema.Types.ObjectId,
    SavedVMCommands: [],
    SavedRegCommands: [],
    Submissions: [
        {
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
                            DirectoryPosition: [],
                            RevisionNumber: Number // Number in the array, starts from 0
                        }
                    ],
                }
            ],
            StudentSavedVMCommands: [String], // Teacher cannot see
            StudentSavedRegCommands: [] // Teacher cannot see
        }
    ]
});

programsschem = mongoose.model('ClassroomPrograms', programs, 'classroomprograms')



teachers = new Schema ({
    Email: String,
    Password: String,
    Classrooms: [{
        Name: String,
        Id: Schema.Types.ObjectId
    }]
});
teachermod = mongoose.model('TeacherAccounts', teachers, 'teacheraccounts');


app = express();

app.use(session({
    secret: "randomasssecretpassword",
    name: "muellerappcookie",
    proxy: true,
    resave: true,
    saveUninitialized: true         
}));



app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://104.131.135.237");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Credentials", true);
  //res.header("Access-Control-Allow-Methods", "POST , GET")
  next();
});




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(lusca({
    csrf: false,
    csp: { /* ... */},
    xframe: 'SAMEORIGIN',
    p3p: 'ABCDEF',
    hsts: {maxAge: 31536000, includeSubDomains: true, preload: true},
    xssProtection: true
}));
app.use(helmet());

app.use('/', routes);
app.use('/users', userspage);
app.use('/files', filesys);
app.use('/programrun', programrun);
app.use('/teachers', teacherspage);
app.use('/students', studentspage);
app.use('/submissions', submissionpage);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
