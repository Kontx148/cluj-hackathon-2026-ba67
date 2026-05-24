# Build Vite SPA (gateway URL is baked in at build time).
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_GATEWAY_URL=/gw
ARG VITE_GATEWAY_PUBLIC_URL=
ARG VITE_GATEWAY_2_URL=
ARG VITE_VALIDATOR_PUBLIC_HOST=

ENV VITE_GATEWAY_URL=$VITE_GATEWAY_URL
ENV VITE_GATEWAY_PUBLIC_URL=$VITE_GATEWAY_PUBLIC_URL
ENV VITE_GATEWAY_2_URL=$VITE_GATEWAY_2_URL
ENV VITE_VALIDATOR_PUBLIC_HOST=$VITE_VALIDATOR_PUBLIC_HOST

RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
