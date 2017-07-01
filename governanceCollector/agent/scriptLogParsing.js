var config = require("./lib/commandPrompt")(process.argv);
var parseScript = require("./lib/ParseScriptLogs");

//var parseScript = require("../lib/parseScriptLogs");

parseScript(config.loadScriptParsing.loadScriptLogPath, config.loadScriptParsing.parsedScriptLogPath, [], [])
    .then(function(foo) {
        //   console.log(foo);
    })