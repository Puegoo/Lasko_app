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

echo "Waiting for backend to be ready..."
sleep 5

echo "Applying database migrations..."
$COMPOSE exec -T backend bash -lc "python manage.py migrate --noinput"

echo "Applying schema updates (is_base_plan field)..."
$COMPOSE exec -T db psql -U postgres -d LaskoDB -f /docker-entrypoint-initdb.d/06_add_base_plan_field.sql 2>/dev/null || echo "Migration already applied or file not found"

echo "Applying exercise recommendations & custom plans schema..."
$COMPOSE exec -T db psql -U postgres -d LaskoDB -f /docker-entrypoint-initdb.d/09_exercise_recommendations_system.sql 2>/dev/null || echo "Exercise recommendations schema already applied or file not found"

echo "Clearing and seeding database with static data (including accounts)..."
# Seed zawiera wszystko: equipment, tags, exercises, plans, accounts, profiles
$COMPOSE exec -T db psql -U postgres -d LaskoDB -f /docker-entrypoint-initdb.d/03_lasko_seed.sql 2>/dev/null || \
$COMPOSE exec -T db psql -U postgres -d LaskoDB -f /seed/lasko_seed.sql

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