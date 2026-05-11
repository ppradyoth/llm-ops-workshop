#!/usr/bin/env bash
# Local Trivy security scan — mirrors what the CI workflow does.
# Requires Trivy: https://aquasecurity.github.io/trivy/latest/getting-started/installation/
#   macOS:  brew install aquasecurity/trivy/trivy
#   Linux:  apt install trivy  (or the installer script)
#   Docker: use the docker run form below instead

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="ai-resume-analyzer-api:scan"

echo "=== Trivy filesystem scan (vuln + secret + misconfig) ==="
trivy fs "$REPO_ROOT" \
  --scanners vuln,secret,misconfig \
  --severity HIGH,CRITICAL \
  --exit-code 1

echo ""
echo "=== Building backend Docker image for scan ==="
docker build -t "$IMAGE_NAME" "$REPO_ROOT/backend"

echo ""
echo "=== Trivy image scan ==="
trivy image "$IMAGE_NAME" \
  --scanners vuln \
  --severity HIGH,CRITICAL \
  --exit-code 1

echo ""
echo "All scans passed."
