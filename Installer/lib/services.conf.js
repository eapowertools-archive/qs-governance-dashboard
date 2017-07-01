var fs = require("fs");
var path = require("path");
var readline = require("readline");


function confOps(confFile, configName, confToAdd) {
    var boolFoundConfig = false;
    var destFile = confFile;

    if (fs.existsSync(destFile)) {
        console.log("Updating services.conf file");
        confFile = readline.createInterface({
            input: fs.createReadStream(confFile)
        });

        confFile.on("line", function(line) {
            if (line == "[" + configName + "]") {
                //console.log("Found " + configName);
                boolFoundConfig = true;
            }
        });

        confFile.on("close", function() {
            if (!boolFoundConfig) {
                addConfig(confToAdd, destFile);
            }
        })
    } else {
        console.log("creating services.conf file");
        fs.writeFileSync(destFile, "", { encoding: "utf8" });
        addConfig(confToAdd, destFile);
    }



}

function addConfig(strFile, destFile) {
    var foo = fs.readFileSync(strFile, { encoding: 'utf8' });
    console.log(destFile);
    console.log(foo);
    fs.appendFileSync(destFile, "\r\n" + foo + "\r\n");
}

module.exports = confOps;