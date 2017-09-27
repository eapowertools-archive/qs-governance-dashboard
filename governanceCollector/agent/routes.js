var bodyParser = require('body-parser');
var config = require('./config/config');
var path = require("path");
var extend = require("extend");
var express = require('express');
var fs = require('fs');
var Promise = require('bluebird');
var qrsInteract = require('qrs-interact');
var _ = require("lodash");
//var doGovernance = require("./lib/createGovernanceOutput");
var socketHelper = require("./lib/socketHelper");
var logger = require("./lib/logger");
var uploadApps = require("./lib/uploadApps");
var createTasks = require("./lib/createTasks");
var importExtensions = require("./lib/importExtensions");
var createDataConnections = require("./lib/createDataConnections");
const checkIp = require("./lib/ipChecker");
const qrsCalls = require("./lib/qrsCalls");
const queueItUp = require("./lib/queueItUp");

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

router.use(function (req, res, next) {
    var ipToUse = checkIp(req.connection.remoteAddress);
    socketHelper.createConnection("http://" + ipToUse + ":" + config.webApp.port);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var qrsInstance = {
    hostname: config.qrs.hostname,
    localCertPath: config.qrs.localCertPath
};

var qrs = new qrsInteract(qrsInstance);


logger.info("qmcu-governance-collector logging started");


router.route("/dogovernance")
    .get(function (request, response) {
        response.send("I want to do governance");
    })
    .post(function (request, response) {
        var options = request.body;
        console.log(options);
        queueItUp(config, options);
        // .then(function (result) {
        //     logMessage('info', 'I have collected governance!');
        // });
        response.send("Governance collection will run on the server and request will not await a response");
    })

router.route("/getconfig")
    .get(function (request, response) {
        response.json(config.agent);
    });

router.route("/uploadApps")
    .get(function (request, response) {
        uploadApps()
            .then(function (result) {
                response.send(result);
            });
    });

router.route("/createTasks")
    .get(function (request, response) {
        createTasks()
            .then(function (result) {
                response.send(result);
            });
    });

router.route("/importExtensions")
    .get(function (request, response) {
        importExtensions()
            .then(function (result) {
                response.send(result);
            })
    })

router.route("/createDataConnections")
    .get(function (request, response) {
        createDataConnections()
            .then(function (result) {
                response.send(result);
            })
    })

router.route("/applist")
    .get(function (request, response) {
        qrs.Get("/app")
            .then(function (result) {
                response.send(result.body);
            });
    });

router.route("/applistfull")
    .get(function (request, response) {
        let options = {
            qrs: {
                hostname: qrsInstance.hostname,
                localCertPath: qrsInstance.localCertPath
            }
        }
        qrsCalls.qrsAppList(options)
            .then(function (result) {
                response.send(result)
            });
    })

router.route("/loadsavedselections")
    .get(function (request, response) {
        var savedSelectionsFile = fs.readFileSync(path.join(__dirname, "config/savedSelections.json"));
        response.send(JSON.parse(savedSelectionsFile));
    })

router.route("/saveselection")
    .post(function (request, response) {
        let savedSelectionsFile = path.join(__dirname, "config/savedSelections.json");
        let savedSelectionsArray = JSON.parse(fs.readFileSync(savedSelectionsFile));
        let selectionToSave = request.body;
        let resultMessage = null;
        let settingIndex = null;

        let selectionExists = savedSelectionsArray.filter(function (item) {
            return item.id == selectionToSave.id;
        })

        if (selectionExists.length == 0) {
            savedSelectionsArray.push(selectionToSave);
            resultMessage = "Saved Selection " + selectionToSave.name + " added.";
            settingIndex = savedSelectionsArray.length;
        }
        else {
            settingIndex = _.findIndex(savedSelectionsArray, function (item) {
                return item.id == selectionToSave.id;
            })
            savedSelectionsArray[settingIndex] = selectionToSave;
            resultMessage = "Saved Selection " + selectionToSave.name + " updated.";
            settingIndex = settingIndex + 1
        }

        fs.writeFileSync(savedSelectionsFile, JSON.stringify(savedSelectionsArray, null, 4));
        response.send({
            "message": resultMessage,
            "savedSelections": savedSelectionsArray,
            "index": settingIndex
        })

    })

router.route("/deletesaveselection")
    .post(function (request, response) {
        let savedSelectionsFile = path.join(__dirname, "config/savedSelections.json");
        let savedSelectionsArray = JSON.parse(fs.readFileSync(savedSelectionsFile));

        savedSelectionsArray = _.remove(savedSelectionsArray, function (item) {
            return item.id !== request.body.id;
        })

        fs.writeFileSync(savedSelectionsFile, JSON.stringify(savedSelectionsArray, null, 4));
        response.send(savedSelectionsArray);
    })

module.exports = router;