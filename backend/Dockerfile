# backend/Dockerfile
FROM python:3.12-slim

# Ustawienia środowiska Pythona
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Narzędzia pomocnicze
RUN apt-get update && apt-get install -y --no-install-recommends \
    netcat-traditional \
  && rm -rf /var/lib/apt/lists/*

# ✅ KLUCZOWE: doinstaluj setuptools (pkg_resources) zanim zainstalujesz requirements
RUN python -m pip install --upgrade pip \
 && pip install --no-cache-dir "setuptools<81" wheel

# Zależności projektu
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Kod aplikacji
COPY . /app

# (jeśli masz entrypoint.sh w repo — zostawiamy, ale Compose i tak go nadpisuje)
COPY entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh || true && chmod +x /entrypoint.sh || true

# Domyślnie obraz może używać entrypointa, ale w dev nadpisujemy go w docker-compose
ENTRYPOINT ["/entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]