#!/bin/bash
# This script adds a permission for API Gateway to invoke a Lambda function for GET requests.

# Default values
AWS_REGION="us-west-2"
AWS_PROFILE="transcriptiq_apigatewayserviceuser"

# Parse arguments for lambda-function-arn and rest-api-id
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --lambda-arn) LAMBDA_FUNCTION_ARN="$2"; shift ;;
        --rest-api-id) REST_API_ID="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

# Check if LAMBDA_FUNCTION_ARN and REST_API_ID are supplied
if [ -z "$LAMBDA_FUNCTION_ARN" ] || [ -z "$REST_API_ID" ]; then
    echo "Error: --lambda-function-arn and --rest-api-id are required."
    echo "Usage: $0 --lambda-function-arn <lambda-function-arn> --rest-api-id <rest-api-id>"
    exit 1
fi

# Add permission for API Gateway to invoke Lambda
aws lambda add-permission \
    --function-name ${LAMBDA_FUNCTION_ARN} \
    --statement-id apigateway-get-test \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn arn:aws:execute-api:${AWS_REGION}:654654169272:${REST_API_ID}/*/GET/transcripts \
    --profile ${AWS_PROFILE}
