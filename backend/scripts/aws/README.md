# AWS Resource Scripts

This directory contains automation scripts for managing AWS resources in the skillflow project.

## Directory Structure

```
aws/
├── lambdas/          # Lambda function management
│   ├── create/       # Lambda creation scripts
│   ├── configure/    # Lambda configuration scripts
│   ├── full-automation.sh    # Full lambda creation workflow
│   ├── update-lambda.sh      # Update existing lambda
│   └── delete-lambda.sh      # Delete lambda
└── api-gateway/      # API Gateway management
    └── acls/         # Web ACL and IP set management
```

## Lambda Management

### Create New Lambda (Full Automation)

```bash
cd lambdas/<lambda-name>/
../../resources/scripts/aws/lambdas/full-automation.sh \
  --repo-name <ecr-repo-name> \
  --function-name <lambda-function-name> \
  --platform linux/arm64
```

### Update Existing Lambda

From within a lambda directory:
```bash
./update.sh
```

Or manually:
```bash
../../resources/scripts/aws/lambdas/update-lambda.sh \
  --repo-name <ecr-repo-name> \
  --platform linux/arm64
```

### Delete Lambda

```bash
../../resources/scripts/aws/lambdas/delete-lambda.sh \
  --repo-name <ecr-repo-name> \
  --function-name <lambda-function-name>
```

## Prerequisites

- AWS CLI configured with appropriate credentials
- Docker installed and running
- Appropriate AWS permissions for Lambda, ECR, and IAM

## Environment

These scripts use the same AWS environment and profiles as the transcriptiq project.
