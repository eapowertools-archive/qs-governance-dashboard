var path = require('path');
var fs = require('fs');
var js2xmlparser = require('js2xmlparser');
var config = require("../config/config");
var logger = require("./logger");

var loggerObject = {
    jsFile: "writeToXML.js"
}

function writeToXML(root, type, data, appId, options, morePath) {
    options = options || {
        useCDATA: true
    };

    morePath = morePath || "";

    var xmlData = js2xmlparser.parse(root, data, options);


    fs.writeFileSync(path.join(config.agent.metadataPath, morePath, (appId !== undefined ? appId + "_" : "") + type + ".xml"), xmlData);
    logger.debug("Wrote file: " + path.join(config.agent.metadataPath, morePath, (appId !== undefined ? appId + "_" : "") + type + ".xml"), loggerObject);
    return appId + "_" + type + ".xml file saved";
}

module.exports = writeToXML;