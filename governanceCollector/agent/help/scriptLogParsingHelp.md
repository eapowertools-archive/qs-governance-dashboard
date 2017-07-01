# scriptLogParsing.js help for Qlik Sense Governance

Use the following switches to control the behavior of scriptLogParsing.js processing.

## -defaults
Runs the application load script log parsing tool for Qlik Sense Governance using default configuration.

> example: -defaults

## -h
Prints this help file to the console.

> example: -h

## -p  (array [string _loadScriptPaths_]) (string _parsedOutputPath_)
Parse load script log files generated during application data refreshes.  Requires two arguments; an array of paths where load script log files are stored, and an output path for the parsed output.  This switch will parse *ALL* logs.

> example: -p ["c:/programdata/qlik/sense/log/script","c:/myloadscripts"] "c:/parsedOutput"
