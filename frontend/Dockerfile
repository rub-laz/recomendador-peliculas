# Fase de build
FROM node:18 AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Fase de producción con nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Copia configuración personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# wait-for-it + backend wait
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

CMD ["sh", "-c", "/wait-for-it.sh backend:5000 -- nginx -g 'daemon off;'"]


