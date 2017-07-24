# Command line help for Qlik Sense Governance Collector (apps-info.js)

Use the following switches to control the behavior of apps-info.js processing.

## -defaults
Runs the metadata fetch process for Qlik Sense Governance using default configuration.

> usage: -defaults

## -a (string _hostname_)
Provide the Qlik Sense server hostname to connect and fetch metadata from.

> example: -a sense32.112adams.local

## -c (string _certPath_)
Provide the path to the Qlik Sense server certificates used to authenticate to Qlik Sense.  Using backslashes in path requires escaping ("\\\\")

> example: -c f:/certs
> 
> example: -c f:\\\\certs

## -h
Prints this help file to the console.

> example: -h

## -p  (array [string _loadScriptPaths_]) (string _parsedOutputPath_)
Parse load script log files generated during application data refreshes.  Requires two arguments; an array of paths where load script log files are stored, and an output path for the parsed output.  This switch will parse *ALL* logs.

> example: -p ["c:/programdata/qlik/sense/log/script","c:/myloadscripts"] "c:/parsedOutput"

## -s (string _appId_)
To fetch metadata for a single application, use this parameter and supply the guid for the application to process.

> example: -s ed7baf7e-007e-4aaa-8d00-4a2540f81a07

## -nd
Open apps without data during the metadata fetching process.  Running the metadata fetch with this switch results in *ZERO* table and field information.

> example: -nd

## -t
Timer mode.  Attempts to calculate the rendering times of fetched metadata.

> example: -t

# Command line help for Qlik Sense Governance Collector (scriptLogParsing.js)

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