@ECHO OFF
sc query "QlikEAPowerToolsServiceDispatcher"

IF %ERRORLEVEL% EQU 0 (GOTO STOPSERVICE) ELSE (GOTO INSTALL)

:STOPSERVICE
ECHO Powertools Service Dispatcher is installed.

sc stop QlikEAPowerToolsServiceDispatcher

:INSTALL
set inpath=%~dp0
cd %inpath%
..\..\powertoolsservicedispatcher\node\node install.js

ECHO Checking for Powertools Service Dispatcher Existence
sc query "QlikEAPowerToolsServiceDispatcher"

IF %ERRORLEVEL% EQU 0 (GOTO INSTALLED) ELSE (GOTO ADDSERVICE)

:ADDSERVICE

ECHO Adding Powertools Service Dispatcher Service

cd ..
cd ..

sc create QlikEAPowerToolsServiceDispatcher binPath= "%cd%\PowertoolsServiceDispatcher\PowerToolsService.exe" DisplayName= "Qlik EAPowerTools Service Dispatcher" start= auto
sc description "QlikEAPowerToolsServiceDispatcher" "Service Dispatcher for running EA Powertools" 

:INSTALLED

sc start QlikEAPowerToolsServiceDispatcher
ECHO Powertools Service Dispatcher is installed.


:END
ECHO Installation Complete!

pause