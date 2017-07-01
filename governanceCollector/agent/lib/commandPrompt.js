var config = require("../config/config");
var path = require("path");
var fs = require('fs');


function commandArguments(arguments) {


    var cmd_args = arguments;
    var app = appCalled(cmd_args[1]);
    if (cmd_args.length == 2) {
        if (app == "apps-info.js") {
            appsInfoHelper();
        } else if (app == "scriptLogParsing.js") {
            scriptLogParsingHelper();
        } else {
            console.log("This program must be called from apps-info.js or scriptLogParsing.js");
            appsInfoHelper();
            scriptLogParsingHelper();
        }
    }

    if (app == "apps-info.js") {
        return appsInfoConfig(cmd_args);
    } else if (app == "scriptLogParsing.js") {
        return scriptLogParsingConfig(cmd_args)
    } else {
        console.log("This program must be called from apps-info.js or scriptLogParsing.js");
        process.exit(1);
    }

}
module.exports = commandArguments;

function scriptLogParsingConfig(cmd_args) {
    config.agent.loadScriptParsing.parseLoadScriptLogs = false;
    cmd_args.forEach(function(val, index) {
        if (index != 0 && index != 1) {
            switch (val) {
                case '-defaults':
                    break;
                case '-h':
                    helper();
                    break;
                case '-p':
                    config.agent.loadScriptParsing.parseLoadScriptLogs = true;
                    if (cmd_args[index + 1] && cmd_args[index + 2]) {

                        config.agent.loadScriptParsing.parsedScriptLogPath = cmd_args[index + 2];
                        config.agent.loadScriptParsing.loadScriptLogPath = cmd_args[index + 1];
                    } else {
                        console.log("Using default loadscript log path and parsed output paths.");
                        //process.exit();
                    }
                    break;
                default:
                    if (cmd_args[index - 1] != '-defaults' && cmd_args[index - 1] != '-h' && cmd_args[index - 1] != '-p') {
                        console.log("'" + val + "' is not a valid command. Type '-h' for help.");
                    }
                    break;
            }
        }
    })


    return config;
}

function appsInfoConfig(cmd_args) {
    config.agent.single_app = false;
    config.agent.noData = false;
    config.agent.timer_mode = false;
    config.agent.loadScriptParsing.parseLoadScriptLogs = false;

    cmd_args.forEach(function(val, index) {
            if (index != 0 && index != 1) {
                switch (val) {
                    case '-defaults':
                        break;
                    case '-h':
                        appsInfoHelper();
                        break;
                    case '-a':
                        if (cmd_args[index + 1]) {
                            config.engine.hostname = cmd_args[index + 1];
                            config.qrs.hostname = cmd_args[index + 1];
                        } else {
                            console.log("Please check the server address argument. Type '-h' for help.");
                            process.exit(1);
                        }
                        break;
                    case '-c':
                        if (cmd_args[index + 1]) {
                            var certPath = cmd_args[index + 1];
                            config.certificates.certPath = path.resolve(certPath);
                            config.certificates.client = path.resolve(certPath, 'client.pem');
                            config.certificates.client_key = path.resolve(certPath, 'client_key.pem');
                            config.certificates.server = path.resolve(certPath, 'server.pem');
                            config.certificates.server_key = path.resolve(certPath, 'server_key.pem');
                            config.certificates.root = path.resolve(certPath, 'root.pem');
                            config.qrs.localCertPath = path.resolve(certPath);
                        } else {
                            console.log("Please check the certificate path argument. Type '-h' for help.");
                            process.exit(1);
                        }
                        break;
                    case '-p':
                        config.agent.loadScriptParsing.parseLoadScriptLogs = true;
                        if (cmd_args[index + 1] && cmd_args[index + 2]) {

                            config.agent.loadScriptParsing.parsedScriptLogPath = cmd_args[index + 2];
                            config.agent.loadScriptParsing.loadScriptLogPath = cmd_args[index + 1];
                        } else {
                            console.log("Using default loadscript log path and parsed output paths.");
                            //process.exit();
                        }
                        break;
                    case '-s':
                        if (cmd_args[index + 1]) {
                            config.agent.appId = cmd_args[index + 1];
                            config.agent.single_app = true;
                        } else {
                            console.log("Please check the application id argument. Type '-h' for help.");
                            process.exit(1);
                        }
                        break;
                    case '-nd':
                        config.agent.noData = true;
                        break;
                    case '-t':
                        config.agent.timer_mode = true;
                        break;
                    default:
                        if (cmd_args[index - 1] != '-defaults' && cmd_args[index - 1] != '-h' && cmd_args[index - 1] != '-a' && cmd_args[index - 1] != '-c' && cmd_args[index - 1] != '-s' && cmd_args[index - 1] != '-nd' && cmd_args[index - 1] != '-t') {
                            console.log("'" + val + "' is not a valid command. Type '-h' for help.");
                        }
                        break;
                }
            }
        })
        //    console.log(config);
    return config;

}


function appCalled(appPath) {
    var exe = appPath.split("\\");
    return exe[exe.length - 1];
}


/***************************
	Command Line Helper
***************************/
function appsInfoHelper() {
    var appsInfoFile = fs.readFileSync(path.join(__dirname, "../help/appsInfoHelp.md"), "utf-8");
    console.log(appsInfoFile);
    process.exit();
}

function scriptLogParsingHelper() {
    var scriptLogParsingHelpFile = fs.readFileSync(path.join(__dirname, "../help/scriptLogParsingHelp.md"), "utf-8");
    console.log(scriptLogParsingHelpFile);
    process.exit();
}