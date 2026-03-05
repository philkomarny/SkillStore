#!/bin/bash
# Usage: ./wait-for-deploy.sh [expected-sha]
# If no sha given, uses the current HEAD commit.

EXPECTED=${1:-$(git rev-parse --short HEAD)}
echo "Waiting for Vercel to deploy $EXPECTED..."

while true; do
  RESULT=$(gh api repos/philkomarny/SkillStore/deployments --jq '.[0] | {sha: .sha[0:7], state: "pending"}' 2>/dev/null)
  DEPLOYED_SHA=$(gh api repos/philkomarny/SkillStore/deployments --jq '.[0].sha[0:7]' 2>/dev/null)
  STATE=$(gh api repos/philkomarny/SkillStore/deployments --jq '.[0].statuses_url' 2>/dev/null | xargs gh api --jq '.[0].state' 2>/dev/null)

  if [ "$DEPLOYED_SHA" = "$EXPECTED" ] && [ "$STATE" = "success" ]; then
    echo "✓ Deployed $EXPECTED successfully"
    break
  elif [ "$STATE" = "failure" ] || [ "$STATE" = "error" ]; then
    echo "✗ Deployment failed (state: $STATE)"
    exit 1
  else
    echo "  sha=$DEPLOYED_SHA state=${STATE:-pending} (want $EXPECTED) — checking again in 10s..."
    sleep 10
  fi
done
