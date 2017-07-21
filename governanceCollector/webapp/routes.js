var bodyParser = require('body-parser');
var config = require('./config/config');
var path = require("path");
var extend = require("extend");
var express = require('express');
var fs = require('fs');
var Promise = require('bluebird');
var _ = require("lodash");
//var doGovernance = require("./lib/createGovernanceOutput");
var logger = require("./lib/logger");
var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: true
}));

var winston = require("winston");
require("winston-daily-rotate-file");

router.route("/version")
    .get(function (request, response) {
        response.send("Governance Collector version " + config.webApp.version);
    })

router.route("/ui")
    .get(function (request, response) {
        var options = {
            root: config.webApp.appPath
        };
        response.sendFile('index.html', options, function (err) {
            if (err) {
                logger.error("ERROR:" + err, {
                    module: 'routes.js'
                });
                response.status(err.status).end();
            }
        });
    })

router.route("/loadsettings")
    .get(function (request, response) {
        var settingsFile = fs.readFileSync(path.join(__dirname, "config/settings.json"))
        response.send(JSON.parse(settingsFile));
    })

router.route("/postsettings")
    .post(function (request, response) {
        var settingsFile = path.join(__dirname, "config/settings.json");
        var settingsData = JSON.parse(fs.readFileSync(settingsFile));
        var resultMessage;
        var settingIndex;

        var settingsExist = settingsData.filter(function (item) {
            return item.hostname == request.body.hostname
        })

        if (settingsExist.length == 0) {
            settingsData.push(request.body);
            resultMessage = "Settings for " + request.body.hostname + " added.";
            settingIndex = settingsData.length;
        } else {
            settingIndex = _.findIndex(settingsData, function (setting) {
                return setting.hostname == request.body.hostname
            });
            settingsData[settingIndex].port = request.body.port;
            settingsData[settingIndex].uploadApps = request.body.uploadApps;
            settingsData[settingIndex].createTasks = request.body.createTasks;
            settingsData[settingIndex].importExtensions = request.body.importExtensions;
            settingsData[settingIndex].createDataConnections = request.body.createDataConnections;

            resultMessage = "Settings Updated for " + request.body.hostname + ".";
            settingIndex = settingIndex + 1

        }
        console.log(settingIndex);
        fs.writeFileSync(settingsFile, JSON.stringify(settingsData, null, 4));
        response.send({
            "message": resultMessage,
            "settings": settingsData,
            "index": settingIndex
        })
    })

router.route("/deletesetting")
    .post(function (request, response) {
        var hostname = request.body.hostname;
        console.log(request.body.hostname);
        var settingsFile = path.join(__dirname, "config/settings.json");
        var settingsData = JSON.parse(fs.readFileSync(settingsFile));

        settingsData = _.remove(settingsData, function (setting) {
            return setting.hostname !== hostname;
        })



        fs.writeFileSync(settingsFile, JSON.stringify(settingsData, null, 4));
        response.send(settingsData)
    })


module.exports = router;