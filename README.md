# Qlik Sense Governance Collector (qs-governance-collector)

The Qlik Sense Governance Collector (**qsgc**) is a web application that collects metadata from Qlik Sense applications, parses script logs for lineage, and generates qvds for use with governance applications.  You can choose to use the included Qlik Sense Governance Dashboard or build your own governance application with the generated qvds full of rich metadata.

---

## Getting Started

For detailed instructions, please navigate to the **[wiki](https://github.com/eapowertools/qs-governance-collector/wiki)**.

### What is the qsgc?
The qsgc 2 tier application with a web application and an agent.
* The web application is a simple front end for starting governance collection processes.
* The agent is a server side REST api web service.  It accepts requests from the web application or another solution you have that will send requests to it.

### How does it work?
![process](https://eapowertools.s3.amazonaws.com/governance-collector/img/main/process.png)

> 1. From the web application, select a server running an agent.
> 2. Select what processes the agent will run:    
>   a. Metadata collection: produces xml files of all app metadata    
>   b. Load script parsing: parses app load script logs for lineage into xml files    
>   c. Run the qvd generation task: reads the xml files into a qvd generator app and outputs qvd files    
>   d. Run the governance dashboard refresh task: reads the qvd files into the governance dashboard app.    
> 3. Click the big Governance button to make the request to the agent to start the selected processes.


### Prerequisites

* Qlik Sense Enterprise or Qlik Analytics Platform (QAP)

Before continuing, please reflect on your expertise with node.js applications.

If you are looking for an easy install experience, we highly recommend the **[installer](https://s3.amazonaws.com/eapowertools/governance-collector/bin/qs-governance-collector.exe)**.

If you fancy yourself a person who turns your nose up at installers, the Governance Collector requires:

* Node.js >= 6.11.1



### Basic Usage

On the server the web application is installed, open a browser and navigate to the following web address: **http://localhost:8591/governance/ui**

#### Adding a server to the web application

To add a server running an agent, click the add button or the cog in the upper right hand side of the screen. 

![mainscreen](https://eapowertools.s3.amazonaws.com/governance-collector/img/webapp/mainscreen.png)

Enter the hostname of the server and the port the agent is running on (default is 8592).

Click the Save button and the server reference is added!

![addserver](https://eapowertools.s3.amazonaws.com/governance-collector/img/webapp/addserver.png)

If the server running the agent is the central node, click the Import Resources button to upload the apps, create tasks, import extensions, and create data connections.  These resources are required for processing xml to qvds and using the supplied Governance Dashboard application. 

![completeserver](https://eapowertools.s3.amazonaws.com/governance-collector/img/webapp/completeserver.png)

Click the OK or Cancel button to close the dialog.

#### Performing a run using the web application

Performing a governance collector processing step through the web application is a snap.

Start by selecting the server running an agent to connect to.

Click one of the four buttons described in the [How does it work](#how-does-it-work) section of the document.  Activating a button will change its color to green.

When at least one of the buttons is selected, the Governance button on the right will turn green.  Click the Governance button to start the selected processes.

![run](https://eapowertools.s3.amazonaws.com/governance-collector/img/webapp/run.png) 

When the process starts, the log will populate with status messages.  Depending on the environment, a process may take as little as a couple minutes or as long as a few hours.