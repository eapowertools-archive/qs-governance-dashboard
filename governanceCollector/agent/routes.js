var bodyParser = require('body-parser');
var config = require('./config/config');
var path = require("path");
var extend = require("extend");
var express = require('express');
var fs = require('fs');
var Promise = require('bluebird');
var qrsInteract = require('qrs-interact');
var _ = require("lodash");
var doGovernance = require("./lib/createGovernanceOutput");
var socketHelper = require("./lib/socketHelper");
var logger = require("./lib/logger");
var uploadApps = require("./lib/uploadApps");
var importExtensions = require("./lib/importExtensions");
var createDataConnections = require("./lib/createDataConnections");

var loggerObject = {
    jsFile: "routes.js"
}

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}

var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: true
}));

router.use(function(req, res, next) {
    console.log(req.connection.remoteAddress.split(":")[3]);
    socketHelper.createConnection("http://" + req.connection.remoteAddress.split(":")[3] + ":" + config.webApp.port);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//router.use('/config', express.static(__dirname + "/config"));


logger.info("qmcu-governance-collector logging started");


router.route("/dogovernance")
    .get(function(request, response) {
        response.send("I want to do governance");
    })
    .post(function(request, response) {
        var options = request.body;
        console.log(options);
        doGovernance(config, options)
            .then(function(result) {
                logMessage('info', 'I have collected governance!');
            });
        response.send("Governance collection will run on the server and request will not await a response");
    })

router.route("/getconfig")
    .get(function(request, response) {
        response.json(config.agent);
    });

router.route("/uploadApps")
    .get(function(request, response) {
        uploadApps()
            .then(function(result) {
                response.send(result);
            });
    });

router.route("/importExtensions")
    .get(function(request, response) {
        importExtensions()
            .then(function(result) {
                response.send(result);
            })
    })

router.route("/createDataConnections")
    .get(function(request, response) {
        createDataConnections()
            .then(function(result) {
                response.send(result);
            })
    })

module.exports = router;