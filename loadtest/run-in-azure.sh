#!/usr/bin/env bash
# Runs loadtest/site.js from inside Azure, as a one-off Container Apps job
# in the app's environment, and prints k6's summary. A test from a laptop
# measures the laptop's network as much as the app; this one starts next to
# it. The job is deleted again at the end.
#
#   bash loadtest/run-in-azure.sh
set -euo pipefail

# Git Bash would turn the resource ids into Windows paths
export MSYS_NO_PATHCONV=1

group="rg-beesaber"
environment="cae-beesaber"
job="job-beesaber-loadtest"
# grafana/k6 2.2.0
image="grafana/k6@sha256:9bd01d6941fca969cb61bb57d2da5ee9b385fe2aa8881df3798c196564d6ace6"
script_dir=$(cd "$(dirname "$0")" && pwd)
spec=$(mktemp)
trap 'rm -f "$spec"' EXIT

# The job has no files of its own, so the script travels in a variable. As
# a JSON string it is also a valid YAML value, quotes and line breaks
# included.
script=$(python -c 'import json, sys; print(json.dumps(sys.stdin.read()))' \
  < "$script_dir/site.js")

environment_id=$(az containerapp env show --resource-group "$group" \
  --name "$environment" --query id --output tsv)

# The resource group refuses resources without managed-by (infra/policy.tf)
cat > "$spec" <<YAML
location: francecentral
tags:
  app: beesaber
  environment: production
  managed-by: loadtest/run-in-azure.sh
  repository: github.com/AsebWebDev/beesaber-reloaded
properties:
  environmentId: $environment_id
  workloadProfileName: Consumption
  configuration:
    triggerType: Manual
    replicaTimeout: 900
    replicaRetryLimit: 0
    manualTriggerConfig:
      parallelism: 1
      replicaCompletionCount: 1
  template:
    containers:
      - name: k6
        image: $image
        # Hundreds of virtual visitors need more than the app's quarter core
        resources:
          cpu: 2
          memory: 4Gi
        command: ["/bin/sh", "-c"]
        args:
          - 'printf "%s" "\$SCRIPT" | k6 run --quiet -'
        env:
          - name: SCRIPT
            value: $script
YAML

# Installed before the job exists, so that a create that fails half-way is
# cleaned up too. A job that does not exist is no error here; whatever made
# the script stop is what it reports.
trap 'rm -f "$spec"; echo "Deleting $job"; az containerapp job delete --resource-group "$group" --name "$job" --yes --output none 2>/dev/null || true' EXIT

echo "Creating $job"
# On Windows, az needs the file's Windows path; elsewhere there is no cygpath
az containerapp job create --resource-group "$group" --name "$job" \
  --yaml "$(cygpath --windows "$spec" 2>/dev/null || echo "$spec")" \
  --output none

execution=$(az containerapp job start --resource-group "$group" --name "$job" \
  --query name --output tsv)
echo "Started $execution at $(date -u +%FT%TZ); the test takes about 7 minutes"

status=Running
while [ "$status" = Running ] || [ "$status" = Processing ]; do
  sleep 30
  status=$(az containerapp job execution show --resource-group "$group" \
    --name "$job" --job-execution-name "$execution" \
    --query properties.status --output tsv)
done
echo "Finished at $(date -u +%FT%TZ): $status"

# The output reaches Log Analytics a few minutes after the job ends
workspace=$(az monitor log-analytics workspace list --resource-group "$group" \
  --query "[0].customerId" --output tsv)
query="ContainerAppConsoleLogs_CL
  | where ContainerJobName_s == '$job' and ContainerGroupName_s startswith '$execution'
  | order by TimeGenerated asc | project Log_s"
output=""
for _ in $(seq 1 20); do
  output=$(az monitor log-analytics query --workspace "$workspace" \
    --analytics-query "$query" --output tsv)
  if grep -q "iterations" <<<"$output"; then break; fi
  sleep 30
done

if ! grep -q "iterations" <<<"$output"; then
  echo "No summary from k6 in the job's log" >&2
  exit 1
fi
echo "${output//$'\t'PrimaryResult/}"

# k6 ends with an error when its thresholds are crossed, and the job with it
if [ "$status" != Succeeded ]; then
  echo "The job ended $status" >&2
  exit 1
fi
