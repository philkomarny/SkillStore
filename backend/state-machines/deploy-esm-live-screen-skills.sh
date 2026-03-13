#!/bin/bash
# Deploy the esm-live-screen-skills Express Step Function (#46).
#
# Usage:
#   ./deploy-esm-live-screen-skills.sh --account-id 123456789012 --role-arn arn:aws:iam::123456789012:role/stepfunction-ex
#
# On first run, creates the state machine.  On subsequent runs, updates it.

set -euo pipefail

REGION="us-west-2"
PROFILE="transcriptiq_lambdaserviceuser"
SM_NAME="esm-live-screen-skills"
SM_TYPE="EXPRESS"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --account-id) ACCOUNT_ID="$2"; shift 2 ;;
        --role-arn)   ROLE_ARN="$2";   shift 2 ;;
        --profile)    PROFILE="$2";    shift 2 ;;
        *) echo "Unknown argument: $1"; exit 1 ;;
    esac
done

if [[ -z "${ACCOUNT_ID:-}" || -z "${ROLE_ARN:-}" ]]; then
    echo "Usage: $0 --account-id <AWS_ACCOUNT_ID> --role-arn <STEP_FUNCTION_ROLE_ARN> [--profile <AWS_PROFILE>]"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFINITION_FILE="${SCRIPT_DIR}/esm-live-screen-skills.json"

# Substitute account ID placeholder in the definition
DEFINITION=$(sed "s/\${AWS_ACCOUNT_ID}/${ACCOUNT_ID}/g" "${DEFINITION_FILE}")

SM_ARN="arn:aws:states:${REGION}:${ACCOUNT_ID}:stateMachine:${SM_NAME}"

# Check if state machine already exists
if aws stepfunctions describe-state-machine --state-machine-arn "${SM_ARN}" --region "${REGION}" --profile "${PROFILE}" >/dev/null 2>&1; then
    echo "Updating existing state machine: ${SM_NAME}"
    aws stepfunctions update-state-machine \
        --state-machine-arn "${SM_ARN}" \
        --definition "${DEFINITION}" \
        --role-arn "${ROLE_ARN}" \
        --region "${REGION}" \
        --profile "${PROFILE}"
    echo "Updated: ${SM_ARN}"
else
    echo "Creating new state machine: ${SM_NAME}"
    aws stepfunctions create-state-machine \
        --name "${SM_NAME}" \
        --definition "${DEFINITION}" \
        --role-arn "${ROLE_ARN}" \
        --type "${SM_TYPE}" \
        --region "${REGION}" \
        --profile "${PROFILE}"
    echo "Created: ${SM_ARN}"
fi

echo ""
echo "State machine ARN (set as SCREENING_STATE_MACHINE_ARN on orchestrator Lambda):"
echo "  ${SM_ARN}"
