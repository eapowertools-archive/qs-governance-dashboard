var fs = require('fs');

var utils = {
    cleanString: function(str)
    {
        var cleanString = str.replace(/[|:&;$%@"<>()+,]/g, "_").split(" ").join("_");
        return cleanString;
    },
    dirExists : function(path, callback)
    {
        fs.stat(path, function(err, stats)
        {
            var dirExists = false;
            if(err)
            {
                callback(false);
            }
            else if(!stats.isDirectory())
            {
                callback(false);
            }
            else
            {
                callback(true);
            }
            
        });

    },
    fileExists : function(pathAndFile, callback)
    {
        fs.stat(pathAndFile, function(err, stats)
        {
            if(err)
            {
                callback(false);
            }
            if(!stats.isFile())
            {
                callback(false);
            }
            else
            {
                callback(true);
            }
        });
    }
};

module.exports = utils;