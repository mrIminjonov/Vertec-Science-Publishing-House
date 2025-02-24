FROM nginx:latest

# Nginx konfiguratsiyasini o'zgartirish
COPY nginx.conf /etc/nginx/nginx.conf

# Statik fayllarni serverga yuklash
COPY . /usr/share/nginx/html

# Portni ochish
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
