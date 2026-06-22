# Build do Business Plane (NestJS).
# Single-stage: garante que todo o node_modules do workspace (typeorm, pg,
# dotenv, reflect-metadata — usados também pelo seed compilado) esteja presente
# em runtime. Imagem maior, porém confiável para o self-host CE.
# .dockerignore exclui node_modules/dist, então COPY . . traz só o código-fonte.
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build --workspace @vantar/api

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
