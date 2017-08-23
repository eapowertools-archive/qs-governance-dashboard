const fs = require("fs");
const path = require("path");

function deleteFiles(dir) {
    try {
        let filesAndFolders = fs.readdirSync(dir);
        filesAndFolders.forEach(function (file, index, array) {
            let fileInfo = fs.statSync(path.join(dir, file));
            if (fileInfo.isFile()) {
                //console.log("deleting file number " + index + " of " + array.length)
                fs.unlinkSync(path.join(dir, file));
            }
        })
    } catch (e) {
        console.log(dir + " directory does not exist.");
    }

}

module.exports = deleteFiles;