#!/usr/bin/env bash
set -Eeuo pipefail

echo "=== Community Discussion Forum: Production Checks ==="

for command in pm2 curl node systemctl; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "ERROR: Required command not found: $command"
    exit 1
  fi
done

echo
echo "=== Nginx service ==="
if systemctl is-active --quiet nginx; then
  echo "PASS: Nginx is active."
else
  echo "FAIL: Nginx is not active."
  exit 1
fi

if systemctl is-enabled --quiet nginx; then
  echo "PASS: Nginx is enabled at boot."
else
  echo "FAIL: Nginx is not enabled at boot."
  exit 1
fi

echo
echo "=== PM2 startup service ==="
if systemctl is-active --quiet pm2-ubuntu; then
  echo "PASS: PM2 startup service is active."
else
  echo "FAIL: PM2 startup service is not active."
  exit 1
fi

if systemctl is-enabled --quiet pm2-ubuntu; then
  echo "PASS: PM2 startup service is enabled at boot."
else
  echo "FAIL: PM2 startup service is not enabled at boot."
  exit 1
fi

echo
echo "=== PM2 application processes ==="
pm2 jlist | node -e '
let input = "";
process.stdin.on("data", chunk => input += chunk);
process.stdin.on("end", () => {
  let processes;
  try {
    processes = JSON.parse(input);
  } catch (error) {
    console.error("FAIL: Could not read PM2 process information.");
    process.exit(1);
  }

  let failed = false;
  for (const name of ["cdf-backend", "cdf-frontend"]) {
    const app = processes.find(item => item.name === name);
    if (!app || app.pm2_env.status !== "online") {
      console.error(`FAIL: ${name} is not online.`);
      failed = true;
    } else {
      console.log(`PASS: ${name} is online.`);
    }
  }

  if (failed) process.exit(1);
});
'

echo
echo "=== Frontend direct response (port 3000) ==="
curl --fail --silent --show-error --max-time 10 \
  http://127.0.0.1:3000/ -o /dev/null
echo "PASS: Frontend responds directly."

echo
echo "=== Frontend through Nginx (port 80) ==="
curl --fail --silent --show-error --max-time 10 \
  http://127.0.0.1/ -o /dev/null
echo "PASS: Nginx serves the frontend."

echo
echo "=== Backend through Nginx ==="
HEADERS_FILE="$(mktemp)"
trap 'rm -f "$HEADERS_FILE"' EXIT

HTTP_STATUS="$(curl --silent --show-error --max-time 10 \
  -D "$HEADERS_FILE" -o /dev/null \
  -w '%{http_code}' \
  http://127.0.0.1/api/auth)"

if [[ "$HTTP_STATUS" -ge 500 ]]; then
  echo "FAIL: Backend returned HTTP $HTTP_STATUS."
  exit 1
fi

if grep -qi '^X-Powered-By:[[:space:]]*Express' "$HEADERS_FILE"; then
  echo "PASS: Express backend responded through Nginx (HTTP $HTTP_STATUS)."
  echo "NOTE: A 404 at this base API path is acceptable; it is not a health endpoint."
else
  echo "FAIL: The response did not contain the expected Express header."
  exit 1
fi

echo
echo "All production checks passed."
