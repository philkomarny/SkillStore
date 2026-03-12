#!/bin/bash

WEB_ACL_ARN="arn:aws:wafv2:us-west-2:654654169272:regional/webacl/RestrictByIP/690207c3-670f-4ec7-9cb5-537a3f4356e5"

aws wafv2 get-web-acl-for-resource \
  --resource-arn "arn:aws:apigateway:us-west-2::/restapis/vwj9c5pi6l/stages/prod" \
  --profile transcriptiq_apigatewayserviceuser \
  --region us-west-2
