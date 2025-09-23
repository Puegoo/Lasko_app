#!/bin/bash

echo "🔧 Naprawianie migracji dla aplikacji accounts..."

# Przejdź do katalogu backendu
cd backend

echo "1. Tworzenie nowych migracji..."
python manage.py makemigrations accounts

echo "2. Sprawdzenie statusu migracji..."
python manage.py showmigrations

echo "3. Stosowanie migracji..."
python manage.py migrate --fake-initial

echo "4. Sprawdzenie czy tabele istnieją..."
python manage.py shell -c "
from accounts.models import AuthAccount, UserProfile
try:
    print('✅ AuthAccount table OK:', AuthAccount.objects.count())
    print('✅ UserProfile table OK:', UserProfile.objects.count())
except Exception as e:
    print('❌ Problem z tabelami:', str(e))
"

echo "✅ Migracje zakończone!"