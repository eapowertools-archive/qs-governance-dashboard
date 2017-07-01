var fs = require('fs');
var path = require('path');
var promise = require('q');

var peg = require("pegjs");

var readFile = promise.denodeify(fs.readFile);

var grammarFileName = 'grammar.pegjs';

module.exports = {

    getParser: function() {

        return promise().then(function() {

            var grammarFileFullPath = path.join(__dirname, grammarFileName);
            return readFile(grammarFileFullPath, 'utf-8').then(function(fileContent) {
                return {
                    fileName: grammarFileFullPath,
                    fileContent: fileContent
                };
            });

        }).then(function(grammarFile) {

            try {

                return promise.resolve(peg.generate(grammarFile.fileContent, {
                    cache: true,
                    trace: false
                }));

            } catch (e) {

                if (e.name === 'GrammarError' || e.name === 'SyntaxError') {
                    return promise.reject({
                        fileName: grammarFile.fileName,
                        parsed: false,
                        message: e.message,
                        expected: e.expected,
                        found: e.found,
                        location: e.location
                    });
                } else {
                    throw e;
                }

            }

        }).then(function(parser) {

            return {

                parse: function(file) {
                    return parseFile(parser, file);
                }

            }

        });
    }
}

function parseFile(parser, file) {

    try {

        var parsed = parser.parse(file);

        return {
            parsed: true,
            result: parsed.blocks,
            txt: parsed.txt
        };

    } catch (e) {

        if (e.name === 'SyntaxError') {
            return {
                parsed: false,
                message: e.message,
                expected: e.expected,
                found: e.found,
                location: e.location
            }
        } else {
            throw e;
        }

    }

}