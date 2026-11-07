#   docker build -t painel-web ./frontend
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Imagem 'unprivileged': o nginx roda como usuário não-root (uid 101) e escuta na porta 8080.
FROM nginxinc/nginx-unprivileged:1.27-alpine
# O template vira /etc/nginx/conf.d/default.conf na partida (envsubst), com as variáveis abaixo.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
# Valores padrão (sobrescritos pelo compose/PaaS). Precisam existir para o envsubst substituí-los.
# API_HOST='$http_host' vira a variável do nginx (Host do navegador); veja nginx/default.conf.template.
ENV API_ALVO=http://backend:8080 \
    API_HOST='$http_host' \
    PAINEL_DASHBOARD_URL=""
EXPOSE 8080
USER 101
