#!/bin/bash
# import_to_docker.sh - Import danych do bazy Docker

echo "📥 Importowanie danych do bazy Docker..."

# Skopiuj plik do kontenera
docker cp local_data_export.sql lasko_app-db-1:/tmp/

# Wykonaj import
docker-compose exec db psql -U postgres -d LaskoDB -f /tmp/local_data_export.sql

echo "✅ Dane zaimportowane do bazy Docker"
