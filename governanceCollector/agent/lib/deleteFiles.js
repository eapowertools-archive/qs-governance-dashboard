const fs = require("fs");
const path = require("path");

function deleteFiles(dir) {
    let filesAndFolders = fs.readdirSync(dir);
    filesAndFolders.forEach(function (file, index, array) {
        let fileInfo = fs.statSync(path.join(dir, file));
        if (fileInfo.isFile()) {
            //console.log("deleting file number " + index + " of " + array.length)
            fs.unlinkSync(path.join(dir, file));
        }
    })
}

module.exports = deleteFiles;