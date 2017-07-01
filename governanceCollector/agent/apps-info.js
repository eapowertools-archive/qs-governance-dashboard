var config = require("./lib/commandPrompt")(process.argv);
var logger = require("./lib/logger");
var createGovernanceOutput = require("./lib/createGovernanceOutput");

var loggerObject = {
    jsFile: "apps-info-neo.js"
}

createGovernanceOutput(config, false)
    .then(function(result) {
        console.log(result);
        logger.info(result, loggerObject);
        process.exit();
    })
    .catch(function(error) {
        console.log(error.stack);
        logger.error(error.stack, loggerObject);
        process.exit(1);
    })