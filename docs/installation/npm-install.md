# Installing qs-governance-collector using npm and node.js

## Table of Contents
* [Before beginning](#before-beginning)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
    * Web Application
        * [Installing the web application](#installing-the-web-application)
        * [Add the web application to Powertools Service Dispatcher](#add-the-web-application-to-powertools-service-dispatcher)
    * Agent
        * [Installing the agent](#installing-the-agent)
        * [Configure the agent](#configure-the-agent)
        * [Add the agent service configuration to Powertools Service Dispatcher](#add-the-agent-service-configuration-to-powertools-service-dispatcher)
* [Running the governance collector without using the Powertools Service Dispatcher](#running-the-governance-collector-without-using-the-powertools-service-dispatcher)  

---

### ***Before beginning***
* If the plan is to run the governance collector using the Powertools Service Dispatcher, we highly recommend using the packaged installer and following the instructions in the [exe-install](./exe-install) document.

* If the plan is to run the governance collector using the Powertools Service Dispatcher but you absolutely hate packaged installers, follow the instructions below.  But heed this warning: ***If you have issues installing using this method and open an issue it will be closed immediately and you will be asked to run the [installer](./exe-install).***

### Prerequisites
* Nodejs >= 6.1.1
* Node Package Manager (installed with Nodejs distro)

### Installation

*The installation assumes the EA Powertools Service Dispatcher is already installed.*

1. Click the Clone or download button for the [qs-governance-collector](https://github.com/eapowertools/qs-governance-collector) repository.  Select Download ZIP.

2. Save the zip file to a folder of your choosing.

3. Extract the zip in the folder it was saved to.

4. Copy the governanceCollector folder.

5. Navigate to the %programfiles%\qlik\sense\eapowertools folder and paste the copied folder.

### Installing the web application

1. Open a command prompt as an administrator and navigate to the folder where the governanceCollector folder was copied to in step 5 above.  If following along, that directory is %programfiles%\qlik\sense\eapowertools\governanceCollector folder.

2. Change directory to the webapp folder (now at %programfiles%\qlik\sense\eapowertools\governanceCollector\webapp).

3. On the command line, enter `npm install`.

### Add the web application to Powertools Service Dispatcher

1. Navigate to the config folder of the web application (%programfiles%\qlik\sense\eapowertools\governanceCollector\webapp\config).

2. Open the services.conf file in your favorite text editor.

3. Copy the contents of the services.conf file.  It will look like this:   
    ```
    Actual services.conf entry for web application

    [qs-governance-collector-webapp]
    Identity=qs-governance-collector-webapp
    Enabled=true
    DisplayName=GovernanceCollector-webapp
    ExecType=nodejs
    ExePath=node\node.exe
    Script=..\governancecollector\webapp\server.js

    ```

4. Navigate to the Powertools Service Dispatcher folder (%programfiles%\qlik\sense\eapowertools\PowerToolsServiceDispatcher).

5. Open the services.conf file in your favorite text editor.

6. Verify an entry for qs-governance-collector-webapp does **not** exist in the services.conf file.  If there is no entry, paste the entry copied earlier.

    *Notice the ExePath for the entry being pasted.  It points to a Node executable in subfolder of the PowertoolsServiceDispatcher folder.  If this folder does not exist and Node.exe is not in that location, **you must change the ExePath to a location where the node executable is present** or the web application will not work on services restart.*

7. Save the services.conf file.

8. Go back to the command prompt used in step 3 in the previous section and perform the following commands: 
    ```
        net stop QlikEAPowertoolsServiceDispatcher
        net start QlikEAPowertoolsServiceDispatcher
    ```

9. From a browser, navigate to http://localhost:8591/governance/ui to start using the web application.

### Installing the agent 

1. Open a command prompt as an administrator and navigate to the folder where the governanceCollector folder was copied to in step 5 of the Installation section.  If following along, that directory is %programfiles%\qlik\sense\eapowertools\governanceCollector folder.

2. Change directory to the agent folder (now at %programfiles%\qlik\sense\eapowertools\governanceCollector\agent).

3. On the command line, enter `npm install`.

### Configure the agent

The agent requires modification to the config.js file to provide the appropriate input and output paths to use in the governance collector.

By default, the agent section of the config.js looks like the following:
```
    agent: {
        port: 8592,
        publicPath: path.join(__dirname, "/../public"),
        nodeModPath: path.join(__dirname, "/../node_modules"),
        metadataPath: "c:/metadata",
        qvdOutputPath: "c:/qvds",
        loadScriptParsing: {
            parseLoadScriptLogs: false,
            loadScriptLogPath: [loadScriptLogPath],
            parsedScriptLogPath: "c:/metadata"
        },
        single_app: false,
        no_data: false,
        timer_mode: false,
        parseLoadScriptLogs: false,
        version: "1.0.0"
    }
```

In order to properly process metadata, qvds, and parse load scripts, the metadataPath, qvdOutputPath, and parsedScriptLogPath require configuration.  Paths can be local folder locations or unc paths.  If using backslashes in paths, **remember to escape the backslashes** or the paths will not work.  **Make sure the paths input** ***exist*** **before adding reference entries in the config.js.**

#### Steps for editing the agent config.js file.

1. Navigate to the config folder of the agent (%programfiles%\qlik\sense\eapowertools\governanceCollector\agent\config).

2. Open the config.js file in your favorite text editor.

3. Update the following properties in the agent section of the config.js:
    * metadataPath - This is the path where xml files from metadata collection will be placed.
    * qvdOutputPath - This is the path where qvf files from qvd generation will be placed.
    * parsedScriptLogPath - This is the path where parsed load scripts will be placed.

4. Save the config.js file. 

### Add the agent service configuration to Powertools Service Dispatcher

1. Navigate to the config folder of the agent (%programfiles%\qlik\sense\eapowertools\governanceCollector\agent\config).

2. Open the services.conf file in your favorite text editor.

3. Copy the contents of the services.conf file.  It will look like this:   
    ```
    Actual services.conf entry for the agent

    [qs-governance-collector-agent]
    Identity=qs-governance-collector-agent
    Enabled=true
    DisplayName=GovernanceCollector-agent
    ExecType=nodejs
    Args=["--max_old_space_size=16384"]
    ExePath=node\node.exe
    Script=..\governancecollector\agent\server.js

    ```
*Notice the Args entry in the configuration entry.  The max_old_space_size argument tells node to use a larger heap size than the default 2 gigabyte.  For the governance collector agent, we recommend at least 8 gigabyte (8192).*

4. Navigate to the Powertools Service Dispatcher folder (%programfiles%\qlik\sense\eapowertools\PowerToolsServiceDispatcher).

5. Open the services.conf file in your favorite text editor.

6. Verify an entry for qs-governance-collector-agent does **not** exist in the services.conf file.  If there is no entry, paste the entry copied earlier.

    *Notice the ExePath for the entry being pasted.  It points to a Node executable in subfolder of the PowertoolsServiceDispatcher folder.  If this folder does not exist and Node.exe is not in that location, **you must change the ExePath to a location where the node executable is present** or the web application will not work on services restart.*

7. Save the services.conf file.

8. Go back to the command prompt used in step 3 in the previous section and perform the following commands: 

    ```
        net stop QlikEAPowertoolsServiceDispatcher
        net start QlikEAPowertoolsServiceDispatcher
    ```

9. From a browser, navigate to http://localhost:8592/governance/getconfig to confirm the agent is running and see the configuration.

### Running the governance collector without using the Powertools Service Dispatcher

If you don't like to use the Powertools Service Dispatcher to run node services like the governance collector web application or agent, you don't have to, however, the installer and the instructions above cater to those who do use the Powertools Service Dispatcher.

If you want to run the web application without using the service dispatcher:

1. Open a command prompt and navigate to the web application directory.

2. Enter the command `node server.js`.  This will launch the web application.

If you want to run the agent without using the service dispatcher:

1. Open a command prompt and navigate to the agent directory.

2. Enter the command `node --max_old_space_size=%heap-size% server.js` where %heap-size% is a number representing the amount of megabytes to use.  For applications with many expressions and objects we recommend at least 8192 megabytes for the heap size.
