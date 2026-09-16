#!/bin/bash
# Health check script for Render/Fly

set -e

check_service() {
  local url=$1
  local name=$2
  if curl -f -s -o /dev/null --max-time 10 "$url"; then
    echo "OK $name"
    return 0
  else
    echo "FAIL $name"
    return 1
  fi
}

failed=0

check_service "http://localhost:3000/health" "Backend API" || failed=1
check_service "http://localhost:8080/health" "WebSocket Server" || failed=1
check_service "http://localhost:5173" "Frontend" || failed=1

if [ -n "$DATABASE_URL" ]; then
  if pg_isready -d "$DATABASE_URL" >/dev/null 2>&1; then
    echo "PostgreSQL OK"
  else
    echo "PostgreSQL FAIL"
    failed=1
  fi
fi

if [ -n "$REDIS_URL" ]; then
  if redis-cli -u "$REDIS_URL" ping >/dev/null 2>&1; then
    echo "Redis OK"
  else
    echo "Redis FAIL"
    failed=1
  fi
fi

exit $failed
