FROM nginx:1.15-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY deploy /usr/share/nginx/html
COPY googlef96d5bc51721b083.html /usr/share/nginx/html