# What is OT connector?
TrustLynx OpenText connector is OTCS module that integrates TrustLynx signing and document sharing features into OTCS SMARTUI environment.
# Actual version: v 1.0.1
# Pre-requisites
- OTCS version supporting 16.2 kernel
- Delivered and enabled TrustLynx SignBox instance (or specific services)
- TrustLynx Archive service should be configured and connected to OTCS
# Installation
- Download module folder from this repository: https://github.com/mihailsgo/trustlynx-OT-signbox-connector/tree/main/OT%20deploy/dmsscommand_1_0_1
- Configure module configuration file `/dmsscommand_1_0_1/support/config
/dmss.config.json`:
```
{
    "INTERNAL_PORTAL_URL": "https://[SIGNBOX_INTERNAL_PORTAL_HOST]/sendFiles/test",
    "GATEWAY_ALTERNATE_VIEW_API": "http://[EXT_PORTAL_GATEWAY_SERVICE_HOST]/api/auth/session/redirecturl",
    "COMPOSE_CONTAINER_API": "http://[CONT_SERVICE_HOST]/api/container/compose/existing",
    "OTCS_REDIRECT_URL": "http://[OTCS_HOST]/otcs/cs.exe/app/nodes/",
    "ALLOWED_MIMETYPES": ["application/vnd.etsi.asic-e+zip", "application/pdf"]
}
```

>- **[SIGNBOX_INTERNAL_PORTAL_HOST]** -TrustLynx SignBox internal portal host 
>- **[EXT_PORTAL_GATEWAY_SERVICE_HOST]** -TrustLynx SignBox external portal gateway service host  (ext-portal-gateway container name)
>- **[CONT_SERVICE_HOST]** -TrustLynx SignBox external portal gateway
