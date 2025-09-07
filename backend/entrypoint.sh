#!/usr/bin/env sh
set -e

echo "🚀 Lasko backend entrypoint"

# Czekamy aż Postgres wstanie
: "${DB_HOST:=db}"
: "${DB_PORT:=5432}"

until nc -z "$DB_HOST" "$DB_PORT"; do
  echo "⏳ Czekam na bazę $DB_HOST:$DB_PORT..."
  sleep 1
done
echo "✅ Baza dostępna"

# 🔧 KLUCZOWE: migruj z --fake-initial, żeby nie tworzyć ponownie istniejących tabel
python manage.py migrate --noinput --fake-initial

# Nie jest krytyczne w dev, ale nie zaszkodzi:
python manage.py collectstatic --noinput || true

echo "▶️ Start serwera: $*"
exec "$@"