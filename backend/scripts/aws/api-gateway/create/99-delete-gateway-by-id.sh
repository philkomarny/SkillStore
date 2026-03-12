#!/bin/bash
# This script deletes a specified API Gateway and removes Lambda permissions.

# Default values
AWS_REGION="us-west-2"
AWS_PROFILE="transcriptiq_apigatewayserviceuser"

# Parse arguments for rest-api-id and lambda-function-arn
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --rest-api-id) REST_API_ID="$2"; shift ;;
        --lambda-arn) LAMBDA_FUNCTION_ARN="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

# Check if REST_API_ID and LAMBDA_FUNCTION_ARN are supplied
if [ -z "$REST_API_ID" ] || [ -z "$LAMBDA_FUNCTION_ARN" ]; then
    echo "Error: --rest-api-id and --lambda-arn are required."
    echo "Usage: $0 --rest-api-id <rest-api-id> --lambda-arn <lambda-arn>"
    exit 1
fi

# Delete the specified REST API
echo "Deleting API Gateway with ID: ${REST_API_ID}"
aws apigateway delete-rest-api \
    --rest-api-id ${REST_API_ID} \
    --region ${AWS_REGION} \
    --profile ${AWS_PROFILE}

# Remove the associated Lambda permission
echo "Removing Lambda permission for API Gateway"
aws lambda remove-permission \
    --function-name ${LAMBDA_FUNCTION_ARN} \
    --statement-id apigateway-get-test \
    --region ${AWS_REGION} \
    --profile ${AWS_PROFILE}

echo "API Gateway and Lambda permissions have been cleaned up."
