var fs = require("fs");
var path = require("path");
var _ = require("lodash")

function getNewestFiles(folder) {
    var resultArray = [];
    var fileList = fs.readdirSync(folder);

    //parse the first part of the file that doesn't include data infomration.
    fileList = fileList.filter(function (f) {
        return fs.statSync(path.join(folder, f)).isFile() && path.extname(path.join(folder, f)).toLowerCase() == ".log";
    })

    if (fileList.length == 0) {
        return [];
    }

    var fileNames = fileList.map(function (f) {
        return f.split(".")[0];
    })

    //get unique file filenames
    var uniqueFileNames = _.uniq(fileNames);

    //for each unique app, find the newest script log in the folder.
    uniqueFileNames.forEach(function (f) {
        //get a list of files that start with this name.
        var files = fileList.filter(function (file) {
            return _.startsWith(file, f);
        });

        //now get the latest file from this bunch.
        var newestFile = _.maxBy(files, function (f) {
            return fs.statSync(path.join(folder, f)).mtime
        })

        resultArray.push({
            "parentFolder": folder,
            "fileName": newestFile,
            "fullName": path.join(folder, newestFile)
        });
    })

    return resultArray;
}

module.exports = getNewestFiles;