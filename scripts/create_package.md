REM *****************************
REM        PACKAGE CREATION   
REM *****************************

REM Package Create Config
SET devHub=devHubAlias
SET packageName=MCP Admin Friend
SET packageDescription=MCP Admin Friend is an example Salesforce administrator Lightning Web Component that demonstrates authenticated Lightning Out 2.0 components communicating with an MCP client through an MCP App Bridge.
SET packageType=Managed
SET packagePath=force-app
SET definitionFile=config/project-scratch-def.json

REM Package Config
SET packageId=0HoP3000000020DKAQ
SET packageVersionId=04tP3000002GsjFIAS

REM Create package
REM sf package create --name "FSC Process Demo" --description "FSC Process Demo is an example Lightning Web Component that demonstrates authenticated Lightning Out 2.0 components communicating with an MCP client through the MCP App Bridge." --package-type "Managed" --path "force-app" --target-dev-hub "devhub"

REM Create package version
sf package version create --package "0Hoak0000007hUrCAI"  --target-dev-hub "devhub" --code-coverage --installation-key-bypass --wait 30 --definition-file "config/project-scratch-def.json"

REM Optional lifecycle command reference - run separately when deliberately required:
REM sf package delete --package %packageId% --target-dev-hub %devHub% --no-prompt
REM sf package version delete --package  %packageVersionId%" --target-dev-hub %devHub% --no-prompt
REM sf package version promote --package %packageVersionId% --target-dev-hub %devHub% --no-prompt

REM /packaging/installPackage.apexp?p0=04tP3000002GsjFIAS