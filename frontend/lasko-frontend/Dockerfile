# Etap 1: Budowanie aplikacji
FROM node:16-alpine as build

WORKDIR /app

# Skopiuj pliki package.json i package-lock.json (lub yarn.lock)
COPY package*.json ./

# Zainstaluj zależności
RUN npm install

# Skopiuj pozostałe pliki źródłowe
COPY . .

# Buduj aplikację (wynik budowania trafi do folderu "dist" lub "build" – w zależności od Twojej konfiguracji Vite)
RUN npm run build

# Etap 2: Serwowanie aplikacji za pomocą serwera Nginx
FROM nginx:alpine

# Skopiuj statyczne pliki z etapu build do katalogu serwowanego przez Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Opcjonalnie: skopiuj własny plik konfiguracyjny Nginx, jeśli potrzebujesz modyfikacji domyślnej konfiguracji
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]