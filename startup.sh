#!/bin/bash
# startup.sh - Clean Docker startup without redis

set -e

echo "LASKO APP STARTUP"
echo "=================="

COMPOSE="docker compose"

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
# healthcheck już czuwa; chwila buforu
sleep 3

echo "Starting backend..."
$COMPOSE up -d backend

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