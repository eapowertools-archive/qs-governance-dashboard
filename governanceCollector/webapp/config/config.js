var path = require('path');
var fs = require('fs');
var extend = require('extend');


var installConfig;
var baseConfigPath = path.join(__dirname, "/../config/");
var dir = fs.readdirSync(baseConfigPath);
dir.forEach(function (file) {
    if (file === 'installConfig.json') {
        installConfig = JSON.parse(fs.readFileSync(path.join(baseConfigPath, file)));
    }
})

var logPath = path.join(__dirname, "../log");

var config = {
    webApp: {
        port: 8591,
        publicPath: path.join(__dirname, "/../public"),
        nodeModPath: path.join(__dirname, "/../node_modules"),
        appPath: path.join(__dirname, '/../app/'),
        version: "2.1.2.0"
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