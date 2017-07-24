# Governance Collector Agent API

## GET /dogovernance

Test for Agent heartbeat.

### Response

* Status: 200

`"I want to do governance"`

---

## POST /dogovernance

Launches governance collection processes based on supplied arguments in body.

* Content-Type: "application/json"

### Body

```
{
    "hostname": *agent-server.example.com*,
    "port": *8592*,
    "boolGenMetadata": true,
    "boolParseLoadScripts": true,
    "boolGenQVDs": true,
    "boolRefreshGovernanceApp": true
}
```

### Response

* Status: 200

`"Governance collection will run on the server and request will not await a response"`

---

## GET /getconfig

Returns the agent configuration for the requested server.

### Response

* Status: 200

```
{
    port: 8592,
    publicPath: "agent/public",
    nodeModPath: "agent/node_modules",
    metadataPath: "c:/metadata",
    qvdOutputPath: "c:/qvds",
    loadScriptParsing: {
        parseLoadScriptLogs: false,
        loadScriptLogPath: ["c:/programdata/qlik/sense/log/repository/scripts"],
        parsedScriptLogPath: "c:/metadata"
    },
    single_app: false,
    noData: false,
    timer_mode: false,
    parseLoadScriptLogs: false,
    version: "1.0.0"
},
```

---

## GET /uploadApps

Upload and import the Governance Collector apps.  If apps already exist in repository, no apps will be uploaded.

### Response

* Status: 200

`Boolean true or false`

---

## GET /createTasks

Create tasks to refresh Governance Collector apps.  If tasks already exist in repository, no tasks will be created.

### Response

* Status: 200

`Boolean true or false`

---

## GET /importExtensions

Upload and import the visualizatione extensions used in Governance Dashboard.  If the extensions exist in repository, no extensions will be uploaded.

### Response

* Status: 200

`Boolean true or false`

---

## GET /createDataConnections

Create data connections to for Governance Collector Apps.  If the data connections exist in repository, no data connections will be created.

### Response

* Status: 200

`Boolean true or false`

---

## GET /applist

Contacts the respository service api and returns a list of applications in the system.

### Response

* Status: 200

```
{
    "id": "5a94e3e9-157c-4ec2-8e65-f0a427290d14",
    "name": "Customer Experience [Telco]",
    "appId": "",
    "publishTime": "2017-03-16T01:58:18.310Z",
    "published": true,
    "stream": {
        "id": "1eac4900-d033-4e02-90da-6630189e252b",
        "name": "Marketing",
        "privileges": null
    },
    "savedInProductVersion": "12.2.2",
    "migrationHash": "82b8362010f6f32f12217392e08c75194db0d4fc",
    "availabilityStatus": 0,
    "privileges": null
},
{
    "id": "e031587e-0e3a-4c7f-9f90-080e7a79fe5a",
    "name": "Travel Expense Management",
    "appId": "",
    "publishTime": "2017-03-16T01:59:29.055Z",
    "published": true,
    "stream": {
        "id": "85497332-5d27-42f8-b8fb-0384e12cce89",
        "name": "Finance",
        "privileges": null
    },
    "savedInProductVersion": "12.2.2",
    "migrationHash": "82b8362010f6f32f12217392e08c75194db0d4fc",
    "availabilityStatus": 0,
    "privileges": null
},
```