"use strict";
var express = require('express');
var router = express.Router();
const _ = require('underscore');
const path = require('path');

let urlMapping = [];
global.urlMapping = urlMapping;

router.get('/rtc', function (req, res, next) {
    const filePath = path.join(__dirname + "./../public/rtc.html");
    res.sendFile(filePath);
});

router.get('/generateRoom', function (req, res, next) {
    const roomId = makeId(10);
    res.send(JSON.stringify({url: req.headers.host + "/" + roomId}));
});

router.get('/isConnectionAvailable', function (req, res) {
    let response = {};
    const url = req.query.url;
    let list = _.findWhere(urlMapping, {url: url});

    if (list && !list["isActiveLink"]) {
        console.log("if");
        response = {status: false, msg: "Link has two available users,create the new room to enjoy"};
    }
    else if (list && list.users.length > 0) {
        response["userId"] = list.users[0];
        list.users.push(req.query.userId);
        list.isActiveLink = false;
        response["status"] = true;
    } else {
        console.log("list", list);
        let data = list || {url: url};
        data["users"] = [];
        data.users.push(req.query.userId);
        data.isActiveLink = true;
        if (!list) {
            urlMapping.push(data);
        }
        response["status"] = false;
        response["msg"] = "Please share this link to the friend for enjoying music player"
    }
    console.log("url mapping1111", urlMapping);
    res.send(response);
});



router.get('/:roomId', function (req, res) {
    const filePath = path.join(__dirname + "./../public/room.html");
    return res.sendFile(filePath);
});

function makeId(strLength) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < strLength; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

module.exports = router;