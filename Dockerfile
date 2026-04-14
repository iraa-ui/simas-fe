###### 1. Dockerfile MultiStage ######
# STAGE BUILD
FROM harbor.cloudias79.com/devops-tools/node:20-alpine AS builder

WORKDIR /app

# Salin package.json dan package-lock.json
COPY package.json package-lock.json ./

# Install dependensi project
RUN npm install

# Salin sisa kode sumber
COPY . .

# Jalankan perintah build
RUN npm run build

###### STAGE RUNTIME ######
FROM harbor.cloudias79.com/devops-tools/nginx@sha256:9081064712674ffcff7b7bdf874c75bcb8e5fb933b65527026090dacda36ea8b AS production

# Hapus konfigurasi default Nginx
RUN rm -rf /etc/nginx/conf.d

# Salin konfigurasi Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Salin hasil build dari STAGE BUILD ke direktori default Nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Ganti port ke 3000
EXPOSE 3000

# Perintah untuk menjalankan Nginx saat container dimulai
CMD ["nginx", "-g", "daemon off;"]