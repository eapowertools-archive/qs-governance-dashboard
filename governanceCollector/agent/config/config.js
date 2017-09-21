var path = require('path');
var fs = require('fs');
var extend = require('extend');
//var mainConfig = require("../../../config/config");


var installConfig;
var baseConfigPath = path.join(__dirname, "/../config/");
var dir = fs.readdirSync(baseConfigPath);
dir.forEach(function (file) {
    if (file === 'installConfig.json') {
        installConfig = JSON.parse(fs.readFileSync(path.join(baseConfigPath, file)));
    }
})


//path.join('f:/my documents/certfiles/sense32.112adams.local');
//path.join(process.env.programdata, "/Qlik/Sense/Repository/exported certificates/.local certificates");
var certPath = path.join(process.env.programdata, "/Qlik/Sense/Repository/exported certificates/.local certificates");
var loadScriptLogPath = path.join(process.env.programdata, '/Qlik/Sense/Log/Script');
var logPath = path.join(__dirname, "../log");

var globalHostname = "localhost";
var friendlyHostname;
var qrsHostname;


var config = {
    certificates: {
        certPath: certPath,
        client: path.resolve(certPath, 'client.pem'),
        client_key: path.resolve(certPath, 'client_key.pem'),
        server: path.resolve(certPath, 'server.pem'),
        server_key: path.resolve(certPath, 'server_key.pem'),
        root: path.resolve(certPath, 'root.pem')
    },
    engine: {
        port: 4747,
        hostname: qrsHostname !== undefined ? qrsHostname : globalHostname,
        userDirectory: 'Internal',
        userId: 'sa_repository'
    },
    qrs: {
        localCertPath: certPath,
        hostname: qrsHostname !== undefined ? qrsHostname : globalHostname,
        repoAccountUserDirectory: 'INTERNAL',
        repoAccountUserId: 'sa_repository'
    },
    webApp: {
        port: 8591,
        publicPath: path.join(__dirname, "/../public"),
        nodeModPath: path.join(__dirname, "/../node_modules"),
        appPath: path.join(__dirname, '/../app/'),
        version: "1.0.1.0"
    },
    agent: {
        port: 8592,
        publicPath: path.join(__dirname, "/../public"),
        nodeModPath: path.join(__dirname, "/../node_modules"),
        metadataPath: "c:/metadata",
        qvdOutputPath: "c:/qvds",
        loadScriptParsing: {
            parseLoadScriptLogs: false,
            loadScriptLogPath: [loadScriptLogPath],
            parsedScriptLogPath: "c:/metadata"
        },
        qvdTaskname: "qsgc-Generate-Governance-QVDs",
        gDashTaskname: "qsgc-Refresh-Governance-Dashboard",
        accessControlAllUsers: false,
        appObjectsAccessControlList: ["sheet", "story", "embeddedsnapshot", "dimension", "measure", "masterobject", "bookmark"],
        single_app: false,
        noData: false,
        timer_mode: false,
        parseLoadScriptLogs: false,
        queueTimeout: 3600, //in seconds, will be converted to milliseconds
        version: "2.0.0.0"
    },
    logging: {
        logPath: logPath,
        logName: "QlikSenseGovernance",
        logLevel: "debug"
    }
};

var mergedConfig;

if (installConfig !== undefined) {
    mergedConfig = extend(true, config, installConfig);
} else {
    mergedConfig = config;
}

module.exports = mergedConfig;