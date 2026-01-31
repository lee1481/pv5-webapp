#!/bin/bash
export CLOUDFLARE_ACCOUNT_ID="cf68fabab0b28a441384bf980965f412"
export CLOUDFLARE_API_TOKEN="eYC9ikcHNO5_6mTfnlUkrK5UHEZCENhcYQ3Nc0MK"

# Direct API upload
cd dist
tar -czf - . | curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/webapp/deployments" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/gzip" \
  --data-binary @-
