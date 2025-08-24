FROM node:20-alpine

WORKDIR /app

# Zainstaluj git jeśli jest potrzebny
RUN apk add --no-cache git

# Skopiuj package.json i package-lock.json
COPY package*.json ./

# Wyczyść cache npm i zainstaluj zależności
RUN npm cache clean --force
RUN npm install

# Skopiuj całą aplikację
COPY . .

# Ustaw właściciela plików
RUN chown -R node:node /app
USER node

# Ustaw zmienne środowiskowe
ENV HOST=0.0.0.0
ENV PORT=3000
ENV CHOKIDAR_USEPOLLING=true
ENV CHOKIDAR_INTERVAL=1000
ENV WATCHPACK_POLLING=true

# Expose port
EXPOSE 3000

# Uruchom dev server z verbose logging
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000", "--force"]