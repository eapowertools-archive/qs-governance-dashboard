# Qlik Sense Governance Collector (qs-governance-collector)

The Qlik Sense Governance Collector is web application that collects metadata from Qlik Sense applications, parses script logs for lineage, and generates qvds for use with governance applications.  You can choose to use the included Qlik Sense Governance Dashboard or build your own governance application with the generated qvds full of rich metadata.

---
- [Getting Started](#getting-started)
- Installation
    - [Installer](#docs/installation/exe-install.md)
    - [Install with npm](#docs/installation/npm-install.md)
    - [Importing Qlik Resources](#docs/installation/qlik-config.md)
- WebApp
    - [Configuration](#docs/webapp/configuration.md)
    - [User Guide](#docs/webapp/user-guide.md)
- Agent
    - [api](#docs/agent/api.md)
    - [Configuration](#docs/agent/configuration.md)
    - Operation
        - [Using EAPowertools Service Dispatcher (default)](#docs/agent/operation/eapowertools-service-dispatcher.md)
        - [Node.js](#docs/agent/operation/node.md)
        - [Command Line](#docs/agent/operation/command-line)
---

## Getting Started

### Prerequisites

### Basic Usage