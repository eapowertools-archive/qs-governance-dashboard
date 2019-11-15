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
        useCDATA: true,
        declaration: {
            include: false
        }
    };

    morePath = morePath || "";

    var new_data = JSON.stringify(data).replace("\"$$", "\"").replace("$$", "").replace("object:","object_");
    new_data = JSON.parse(new_data);
  
    var xmlData = js2xmlparser.parse(root, new_data, options);

    fs.writeFileSync(path.join(config.agent.metadataPath, morePath, (appId !== undefined ? appId + "_" : "") + type + ".xml"), xmlData);
    logger.debug("Wrote file: " + path.join(config.agent.metadataPath, morePath, (appId !== undefined ? appId + "_" : "") + type + ".xml"), loggerObject);
    
    return appId + "_" + type + ".xml file saved";
}

module.exports = writeToXML;