FROM nginx:latest

# Statik fayllarni serverga yuklash
COPY . /usr/share/nginx/html

# Portni ochish
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
