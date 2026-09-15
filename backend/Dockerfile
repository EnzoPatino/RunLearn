FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install --omit=dev

# Copiar código fuente
COPY . .

# Exponer puerto del servicio
EXPOSE 5000

# Iniciar servidor
CMD ["npm", "start"]
