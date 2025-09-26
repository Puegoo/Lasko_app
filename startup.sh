#!/bin/bash
# startup.sh - Complete Docker startup script

set -e

echo "LASKO APP STARTUP"
echo "=================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running"
    echo "Please start Docker Desktop first"
    exit 1
fi

# Stop any existing containers
echo "Stopping existing containers..."
docker-compose down --remove-orphans

# Remove old images if specified
if [ "$1" = "--rebuild" ]; then
    echo "Rebuilding images from scratch..."
    docker-compose build --no-cache
else
    echo "Building images..."
    docker-compose build
fi

# Start services
echo "Starting services..."
docker-compose up -d db

echo "Waiting for database to be ready..."
sleep 10

# Check database status
docker-compose exec db pg_isready -U postgres || {
    echo "Database not ready, waiting more..."
    sleep 10
}

# Start backend with setup
echo "Starting backend with database setup..."
docker-compose run --rm backend python manage.py setup_database --with-seed

# Start all services
echo "Starting all services..."
docker-compose up -d

echo ""
echo "STARTUP COMPLETE"
echo "================"
echo ""
echo "Services:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000"
echo "- Admin Panel: http://localhost:8000/admin/"
echo ""
echo "Test Login Data:"
echo "- Username: testuser1"
echo "- Password: test123"
echo ""
echo "Admin Login:"
echo "- Username: admin"
echo "- Password: admin123"
echo ""
echo "To see logs: docker-compose logs -f"
echo "To stop: docker-compose down"