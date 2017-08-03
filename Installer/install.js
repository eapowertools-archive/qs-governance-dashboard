'use strict'
var Promise = require("bluebird");
var colors = require("colors/safe");
var path = require("path");
var fs = require("fs");
var inquirer = require('inquirer');
var spawnIt = require("child_process").execSync;
var tarball = require("tarball-extract");
var confOps = require("./lib/services.conf");
var serviceCluster = require("./lib/qrsCluster")

var pathPattern = /^[a-zA-Z]:((\\|\/)[a-zA-Z0-9\s_@\-^!#$%&+={}\[\]]+)+$/;
var uncPattern = /^((\\\\|\\|\/)[a-zA-Z0-9\s_@\-^!#$%&+={}\[\]]+)+$/;


serviceCluster()
    .then(function (result) {
        installText();
        var archivedScriptLogsPath = result.body.settings.sharedPersistenceProperties.archivedLogsRootFolder;

        var firstQuestion = [{
            type: 'confirm',
            name: 'beginInstall',
            message: 'Welcome to the Qlik Sense Governance Collector Install.  Ready to begin?',
            default: true
        }];

        var installQuestion = [{
            type: 'list',
            name: 'installType',
            message: 'The QSGC has an web app component, and an agent component.  It is possible to install the components on the same system.  What component(s)would you like to install?',
            choices: ['complete', 'web app', 'agent']
        }];

        var webAppQuestions = [{
            type: 'input',
            name: 'webPort',
            message: colors.green("The default port for the web app is 8591.  To change it, enter the port number:"),
            default: 8591,
            validate: function (input) {
                var pattern = /[1-9]/
                if (input.toString().match(pattern)) {
                    return true;
                }
                return colors.red("Please enter a valid tcp port number");
            }

        }]

        var agentQuestions = [{
                type: 'input',
                name: 'webPort',
                message: colors.green("The web app web port is required for the agent to send messages back to the web app.  The default port for the web app is 8591.  To change it, enter the port number:"),
                default: 8591,
                validate: function (input) {
                    var pattern = /[1-9]/
                    if (input.toString().match(pattern)) {
                        return true;
                    }
                    return colors.red("Please enter a valid tcp port number");
                }
            },
            {
                type: 'input',
                name: 'agentPort',
                message: colors.green("The default port for the agent is 8592.  To change it, enter the port number:"),
                default: 8592,
                validate: function (input) {
                    var pattern = /[1-9]/
                    if (input.toString().match(pattern)) {
                        return true;
                    }
                    return colors.red("Please enter a valid tcp port number");
                }
            },
            {
                type: 'input',
                name: 'metadataPath',
                message: colors.green("Enter the path metadata will be output to:"),
                default: "c:\\metadata",
                validate: function (input) {
                    if (input.match(pathPattern) || input.match(uncPattern)) {
                        return true;
                    }
                    return colors.red("Please enter a valid path");
                }
            },
            {
                type: 'input',
                name: 'qvdOutputPath',
                message: colors.green("Enter the path generate QVDs will be output to:"),
                default: "c:\\qvdOutput",
                validate: function (input) {
                    if (input.match(pathPattern) || input.match(uncPattern)) {
                        return true;
                    }
                    return colors.red("Please enter a valid path");
                }
            },
            {
                type: 'input',
                name: 'archivedScriptLogsPath',
                message: colors.green("Enter the path where script logs exist:"),
                default: archivedScriptLogsPath,
                validate: function (input) {
                    if (input.match(pathPattern) || input.match(uncPattern)) {
                        return true;
                    }
                    return colors.red("Please enter a valid path");
                }
            },
            {
                type: 'input',
                name: 'parsedScriptLogPath',
                message: colors.green("Enter the path parsed script logs will be output to:"),
                default: "c:\\metadata",
                validate: function (input) {
                    if (input.match(pathPattern) || input.match(uncPattern)) {
                        return true;
                    }
                    return colors.red("Please enter a valid path");
                }
            },
            {
                type: 'confirm',
                name: 'createPaths',
                message: colors.green("Do you want the installer to create these paths if they don't exist?  ") + colors.yellow("UNC paths will ") + colors.red("NOT") + colors.yellow(" be created.  Create them manually."),
                default: true,

            }
            // {
            //     type: 'input',
            //     name: 'qvdTaskName',
            //     message: colors.green("Enter the name of the qvd generator task:"),
            //     default: "qsgc-Generate-Governance-QVDs"
            // },
            // {
            //     type: 'input',
            //     name: 'gDashTaskName',
            //     message: colors.green("Enter the name of the qvd generator task:"),
            //     default: "qsgc-Refresh-Governance-Dashboard"
            // },
        ]

        var confirmInstall = [{
            type: 'confirm',
            name: 'confirmInstall',
            message: colors.yellow()
        }]

        var x = {};

        inquirer.prompt(firstQuestion)
            .then(function (answer) {
                if (answer.beginInstall) {
                    return inquirer.prompt(installQuestion)
                        .then(function (installAnswer) {
                            x.installAnswer = installAnswer
                            if (installAnswer.installType == "web app") {
                                return inquirer.prompt(webAppQuestions)
                                    .then(function (webAppAnswers) {
                                        x.webAppAnswers = webAppAnswers;
                                        return webAppAnswers;
                                    })
                            } else {
                                return inquirer.prompt(agentQuestions)
                                    .then(function (agentAnswers) {
                                        x.agentAnswers = agentAnswers;
                                        return agentAnswers;
                                    })
                            }
                        })
                        .then(function (answers) {
                            return inquirer.prompt([{
                                    type: 'confirm',
                                    name: 'confirmInstall',
                                    message: colors.yellow("You have chosen to install the " + x.installAnswer.installType + ".  Are you ready to install?")
                                }])
                                .then(function (response) {
                                    if (response.confirmInstall) {
                                        switch (x.installAnswer.installType) {
                                            case 'web app':
                                                return installWebApp(x.webAppAnswers);
                                            case 'agent':
                                                return installAgent(x.agentAnswers);
                                            default:
                                                return installAll(x);
                                        }
                                    }
                                    //return false;
                                })
                        })
                        .then(function (install) {
                            if (install) {
                                console.log(colors.green("Install complete!"));
                            } else {
                                console.log(colors.red("Install failed or cancelled"));
                            }
                            return;
                        })
                }
                console.log(colors.red("Install failed or cancelled"));
                return;
                //return false;
            })
    })

function installText() {
    var file = fs.readFileSync(path.join(__dirname, "install.md"), "utf-8");
    console.log(colors.bgGreen(colors.black(file)));
}

function installWebApp(options) {
    return new Promise(function (resolve) {
        console.log(colors.yellow("Unpacking web app files"));
        return tarball.extractTarball(path.join(__dirname, 'src/webapp.tar.gz'), path.join(__dirname, "../"), function (err) {

            if (err) {
                console.log(colors.red("Error Occurred in installWebApp: " + err));
                resolve(false);
            }

            console.log(colors.green("web app files unpacked and installed."));
            setTimeout(function () {
                return;
            }, 3000);

            console.log(colors.yellow("creating log directory"));
            if (!fs.existsSync(path.join(__dirname, "../webapp/log"))) {
                fs.mkdirSync(path.join(__dirname, "../webapp/log"));
            }

            console.log(colors.yellow("creating configuration file"));
            var installConfig = {
                "webApp": {
                    "port": options.webPort
                }
            };
            fs.writeFileSync(path.join(__dirname, "../webapp/config/installConfig.json"), JSON.stringify(installConfig, null, 4));
            console.log(colors.green("configuration file created"));

            //            if (fs.existsSync(path.join(__dirname, "../../powertoolsservicedispatcher/services.conf"))) {
            console.log("Updating Powertools Service Dispatcher services.conf file")
            confOps(path.join(__dirname, "../../powertoolsservicedispatcher/services.conf"), "qs-governance-collector-webapp", path.join(__dirname, "../webapp/config/services.conf"));
            //           } else {
            //                console.log(colors.red("Powertools services.conf changes failed.  Install will end, but services.conf file will have to be manually configured for services to work."));
            //            }
            resolve(true);
        })
    })
}

function installAgent(options) {
    return new Promise(function (resolve) {
        console.log(colors.yellow("Unpacking agent files"));
        return tarball.extractTarball(path.join(__dirname, 'src/agent.tar.gz'), path.join(__dirname, "../"), function (err) {

            if (err) {
                console.log(colors.red("Error Occurred in installAgent: " + err));
                resolve(false);
            }

            console.log(colors.green("agent files unpacked and installed."));
            setTimeout(function () {
                return;
            }, 3000);

            console.log(colors.yellow("creating log directory"));
            if (!fs.existsSync(path.join(__dirname, "../agent/log"))) {
                fs.mkdirSync(path.join(__dirname, "../agent/log"));
            }

            console.log(colors.yellow("creating configuration file"));
            var installConfig = {
                "webApp": {
                    "port": options.webPort
                },
                "agent": {
                    "port": options.agentPort,
                    "metadataPath": options.metadataPath,
                    "qvdOutputPath": options.qvdOutputPath,
                    "loadScriptLogPath": [options.archivedScriptLogsPath],
                    "loadScriptParsing": {
                        "parsedScriptLogPath": options.parsedScriptLogPath
                    },
                }
            };

            if (options.createPaths) {
                console.log(colors.yellow("Checking and creating output directories."));
                if (!options.metadataPath.includes("\\\\")) {
                    if (!fs.existsSync(options.metadataPath)) {
                        try {
                            console.log(colors.green("Creating directory: " + options.metadataPath));
                            fs.mkdirSync(options.metadataPath);
                        } catch (e) {
                            console.log(colors.red("Unable to create directory: " + options.metadataPath));
                        }
                    } else {
                        console.log(colors.yellow(options.metadataPath + " exists.  It will not be created again."))
                    }
                } else {
                    console.log(colors.yellow("metadata path is a unc path.  ") + colors.green(options.metadataPath) + colors.yellow(" will not be created.  Create it manually."));
                }

                if (!options.qvdOutputPath.includes("\\\\")) {
                    if (!fs.existsSync(options.qvdOutputPath)) {
                        try {
                            console.log(colors.green("Creating directory: " + options.qvdOutputPath));
                            fs.mkdirSync(options.qvdOutputPath);
                        } catch (e) {
                            console.log(colors.red("Unable to create directory: " + options.qvdOutputPath));
                        }
                    } else {
                        console.log(colors.yellow(options.qvdOutputPath + " exists.  It will not be created again."))
                    }
                } else {
                    console.log(colors.yellow("metadata path is a unc path.  ") + colors.green(options.qvdOutputPath) + colors.yellow(" will not be created.  Create it manually."));
                }

                if (!options.parsedScriptLogPath.includes("\\\\")) {
                    if (!fs.existsSync(options.parsedScriptLogPath)) {
                        try {
                            console.log(colors.green("Creating directory: " + options.parsedScriptLogPath));
                            fs.mkdirSync(options.parsedScriptLogPath);
                        } catch (e) {
                            console.log(colors.red("Unable to create directory: " + options.parsedScriptLogPath));
                        }
                    } else {
                        console.log(colors.yellow(options.parsedScriptLogPath + " exists.  It will not be created again."))
                    }
                } else {
                    console.log(colors.yellow("metadata path is a unc path.  ") + colors.green(options.parsedScriptLogPath) + colors.yellow(" will not be created.  Create it manually."));
                }
            }


            fs.writeFileSync(path.join(__dirname, "../agent/config/installConfig.json"), JSON.stringify(installConfig, null, 4));
            console.log(colors.green("configuration file created"));

            //            if (fs.existsSync(path.join(__dirname, "../../powertoolsservicedispatcher/services.conf"))) {
            console.log("Updating Powertools Service Dispatcher services.conf file")
            confOps(path.join(__dirname, "../../powertoolsservicedispatcher/services.conf"), "qs-governance-collector-agent", path.join(__dirname, "../agent/config/services.conf"));
            //            } else {
            //               console.log(colors.red("Powertools services.conf changes failed.  Install will end, but services.conf file will have to be manually configured for services to work."));
            //            }
            resolve(true);
        })
    })
}


function installAll(x) {
    var boolResult = false;
    return installWebApp(x.agentAnswers)
        .then(function (result) {
            boolResult = result;
            return installAgent(x.agentAnswers);
        })
        .then(function (result) {
            boolResult = result
        })
        .then(function () {
            return boolResult;
        });

}

// function validation(input) {
//     var pattern = /^[a-z]:((\\|\/)[a-z0-9\s_@\-^!#$%&+={}\[\]]+)+$/
//     if (input.match(pattern)) {
//         return true;
//     }
//     return colors.red("Please enter a valid path");
// }