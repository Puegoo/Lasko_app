# frontend/lasko-frontend/Dockerfile (POPRAWKA)
FROM node:20-alpine as build

WORKDIR /app

# Skopiuj package.json i package-lock.json
COPY package*.json ./

# Usuń node_modules i package-lock.json aby wymóc przebudowanie
RUN rm -rf node_modules package-lock.json

# Zainstaluj zależności ze świeżymi wersjami
RUN npm install

# Skopiuj kod źródłowy
COPY . .

# Zbuduj aplikację dla produkcji
RUN npm run build

# Etap 2: Serwowanie aplikacji przez Nginx
FROM nginx:alpine

# Usuń domyślną konfigurację nginx
RUN rm /etc/nginx/conf.d/default.conf

# Skopiuj własną konfigurację nginx
COPY nginx.conf /etc/nginx/conf.d/

# Skopiuj zbudowaną aplikację z etapu build
COPY --from=build /app/dist /usr/share/nginx/html

# Ekspozycja portu 80
EXPOSE 80

# Uruchom nginx
CMD ["nginx", "-g", "daemon off;"]