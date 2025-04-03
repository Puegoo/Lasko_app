FROM python:3.9-slim

# Zapobiega tworzeniu plików .pyc i buforowaniu
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Ustaw katalog roboczy
WORKDIR /app

# Skopiuj plik requirements.txt i zainstaluj zależności
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Skopiuj resztę kodu aplikacji
COPY . /app/

# Ustawienie portu, na którym będzie działać Django
EXPOSE 8000

# Komenda uruchamiająca serwer za pomocą Gunicorn (dla środowiska produkcyjnego)
CMD ["gunicorn", "lasko_backend.wsgi:application", "--bind", "0.0.0.0:8000"]