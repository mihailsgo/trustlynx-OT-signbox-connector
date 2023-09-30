# What is OT connector (dmsscommand_1_0_1) module?
TrustLynx OpenText connector is OTCS module that integrates TrustLynx signing and document sharing features into OTCS SMARTUI environment.
# Actual version: dmsscommand_1_0_1
# Pre-requisites
- OTCS version supporting 16.2 kernel
- Delivered and enabled TrustLynx SignBox instance (or specific services)
- TrustLynx Archive service should be configured and connected to OTCS
# Installation
- Download module folder from this repository: https://github.com/mihailsgo/trustlynx-OT-signbox-connector/tree/main/OT%20deploy/dmsscommand_1_0_1
- Configure module configuration file `/dmsscommand_1_0_1/support/config/dmss.config.json`:
```
{
    "INTERNAL_PORTAL_URL": "https://[SIGNBOX_INTERNAL_PORTAL_HOST]/sendFiles/test",
    "GATEWAY_ALTERNATE_VIEW_API": "http://[EXT_PORTAL_GATEWAY_SERVICE_HOST]/api/auth/session/redirecturl",
    "COMPOSE_CONTAINER_API": "http://[CONT_SERVICE_HOST]/api/container/compose/existing",
    "OTCS_REDIRECT_URL": "http://[OTCS_HOST]/otcs/cs.exe/app/nodes/",
    "ALLOWED_MIMETYPES": ["application/vnd.etsi.asic-e+zip", "application/pdf"]
}
```
> It is important, that URLs available in the configuration should be available to be accessed from USERs browser.  In terms of "GATEWAY_ALTERNATE_VIEW_API" and "COMPOSE_CONTAINER_API" URLs it is recommended to limit it`s accessibility on company VPN level if it is possible. If it is not possible, then it is recommended to allow only in dmss.config.json configuration provided API to be accessed from external network. Each requests internally is verified to have correct OTCS ticket header available, if OTCS ticket is not valid for connected CS instance, request is not going to be processed.

>- **[SIGNBOX_INTERNAL_PORTAL_HOST]** -TrustLynx SignBox internal portal host 
>- **[EXT_PORTAL_GATEWAY_SERVICE_HOST]** -TrustLynx SignBox ext-portal-gateway service host
>- **[CONT_SERVICE_HOST]** -TrustLynx dmss-container-and-signature-services service host
>- **[OTCS_HOST]** - OpenText content server host

- Copy module into OTCS /staging/ folder
- Install module via administration panel **Install Modules** menu
- Navigate to SmartUI Browse view, select any document (for a perfect test .asice container) and check that extra buttons are available:

![image](https://github.com/mihailsgo/trustlynx-OT-signbox-connector/assets/3802544/dc0b0b05-b288-4285-8cc0-3bb72c1b99e4)

 
