#!/bin/bash
# startup.sh - Clean Docker startup with automatic seeding

set -e

echo "LASKO APP STARTUP"
echo "=================="

COMPOSE="docker compose -f docker-compose.yml"

SEED_LARGE_DATA=${SEED_LARGE_DATA:-1}

echo "Stopping existing containers..."
$COMPOSE down --remove-orphans

if [ "$1" = "--rebuild" ]; then
  echo "Rebuilding images from scratch..."
  COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 $COMPOSE build --no-cache
else
  echo "Building images..."
  COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 $COMPOSE build
fi

echo "Starting database..."
$COMPOSE up -d db

echo "Waiting for database to be ready..."
tries=0
until $COMPOSE exec -T db pg_isready -U postgres >/dev/null 2>&1; do
  tries=$((tries+1))
  if [ $tries -ge 30 ]; then
    echo "Database did not become ready in time." >&2
    exit 1
  fi
  sleep 2
  echo "  retry #$tries..."
done

echo "Starting backend..."
$COMPOSE up -d backend

echo "Seeding users and profiles (base accounts)..."
$COMPOSE exec -T backend bash -lc "python SQL/02_insert_data_docker.py"

if [ "$SEED_LARGE_DATA" = "1" ]; then
  echo "Seeding extended domain data (plans, exercises, logs)..."
  SEED_ENV="SEED_RESET_DOMAIN=1 SEED_PLANS=1200 EX_COUNT_TARGET=900 USERS_LIMIT=60000 RECL_USERS_LIMIT=8000"
  $COMPOSE exec -T backend bash -lc "$SEED_ENV python SQL/03_seed_domain_data_docker.py"
fi

echo "Starting frontend..."
$COMPOSE up -d frontend

echo ""
echo "STARTUP COMPLETE"
echo "================"
echo "- Frontend:     http://localhost:3000"
echo "- Backend API:  http://localhost:8000"
echo "- Admin Panel:  http://localhost:8000/admin/"
echo ""
echo "Logs: docker compose logs -f"
echo "Stop: docker compose down"