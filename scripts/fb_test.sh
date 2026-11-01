#!/bin/bash
# Test Firestore connectivity with user's config via REST API
KEY="AIzaSyBK5_divrm4f7RD64ed0hpet5W9Z8lnG5c"
PROJ="academic-fath-portal"
echo "=== 1. Write test doc ==="
curl -s -X PATCH "https://firestore.googleapis.com/v1/projects/$PROJ/databases/(default)/documents/fm_test/ping?key=$KEY" \
  -H "Content-Type: application/json" \
  -d '{"fields":{"ok":{"stringValue":"1"},"at":{"timestampValue":"2026-10-29T00:00:00Z"}}}' | head -c 600
echo ""
echo "=== 2. Read test doc ==="
curl -s "https://firestore.googleapis.com/v1/projects/$PROJ/databases/(default)/documents/fm_test/ping?key=$KEY" | head -c 600
echo ""
echo "=== 3. List fm_users (seed check) ==="
curl -s "https://firestore.googleapis.com/v1/projects/$PROJ/databases/(default)/documents/fm_users?pageSize=3&key=$KEY" | head -c 400
echo ""
