"use strict";
var express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const cors = require('cors');
const fs = require('fs');
const https = require('https');

const index = require('./routes/index');

var app = express();

const port = '3006';
app.set('port', port);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'routes')));
app.use(cors());


const privateKey = fs.readFileSync(require('path').resolve(__dirname + '/bin/privkey.pem'));
const certificate = fs.readFileSync(require('path').resolve(__dirname + '/bin/fullchain.pem'));
const credentials = {key: privateKey, cert: certificate};

let server = https.createServer(credentials, app);

server.listen(port);

let WebSocketServer = require('ws').Server;
let wss = new WebSocketServer({server: server});

let usersList = {};
wss.on('connection', function (connection) {
    connection.on('message', function (message) {
        var data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            console.log("Invalid JSON");
            data = {};
        }
        switch (data.type) {
            case "login":
                if (usersList[data.name]) {
                    sendTo(connection, {
                        type: "login",
                        success: false
                    });
                } else {
                    usersList[data.name] = connection;
                    connection.name = data.name;
                    console.log("connection.name", connection.name);
                    sendTo(connection, {
                        type: "login",
                        success: true,
                        name: data.name
                    });
                }
                break;
            case "offer":
                var conn = usersList[data.name];
                if (conn != null) {
                    connection.otherName = data.name;
                    sendTo(conn, {
                        type: "offer",
                        offer: data.offer,
                        name: connection.name
                    });
                } else {
                    sendTo(connection, {
                        type: "error",
                        success: "false",
                        msg: "The user you want to connect is not present "
                    })
                }
                break;
            case "answer":
                var conn = usersList[data.name];
                if (conn != null) {
                    connection.otherName = data.name;
                    sendTo(conn, {
                        type: "answer",
                        answer: data.answer
                    });
                }
                break;
            case "candidate":
                var conn = usersList[data.name];
                if (conn != null) {
                    sendTo(conn, {
                        type: "candidate",
                        candidate: data.candidate
                    });
                }
                break;
            case "leave":
                console.log("leave");
                var conn = usersList[data.name];
                if (conn) {
                    conn.otherName = null;
                }
                connection.otherName = null;
                if (conn != null) {
                    sendTo(conn, {
                        type: "leave",
                        name: connection.name
                    });
                }
                break;
            case "checkUserIsAvailable":
                var conn = usersList[data.name];
                let msg = "";
                let status = true;
                if (connection.otherName) {
                    msg = "You are connected with some one else";
                    status = false;
                }
                else if (conn && conn.otherName) {
                    status = false;
                    msg = "The user which you want to connect is talking to some one other"

                }
                return sendTo(connection, {
                    type: "checkUserIsAvailable",
                    status: status,
                    msg: msg
                });
                break;
            default:
                sendTo(connection, {
                    type: "error",
                    msg: "Command not found: " + data.type
                });
                break;
        }
    });

    connection.on("close", function () {
        if (connection && connection.name) {
            removeUser(connection.name);
            var conn = usersList[connection.otherName];
            delete usersList[connection.name];
            if (conn) {
                conn.otherName = null;
                if (conn != null) {
                    sendTo(conn, {
                        type: "leave",
                        name: connection.name
                    });
                }
            }
        }
    });

    connection.send(JSON.stringify({msg: 'Hello world'}));

});

function sendTo(connection, message) {
    connection.send(JSON.stringify(message));
}

app.use('/', index);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


let removeUser = (userName) => {
    urlMapping.forEach((data) => {
        const indexNumber = data.users.indexOf(userName);
        if (indexNumber > -1) {
            data.users.splice(indexNumber, 1);
            data.isActiveLink = true;
        }
    });
};

process.on('uncaughtException', function (err) {
    console.log(err);
});

module.exports = app;
