### Stage 1 — build the Angular app
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build:prod

### Stage 2 — serve with nginx, proxying /api to the backend service
FROM nginx:alpine
COPY --from=build /app/dist/bussola-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
