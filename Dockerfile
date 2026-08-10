# Landing page estatica servida por nginx
FROM nginx:alpine

# Copia o site para a pasta publica do nginx
COPY . /usr/share/nginx/html

# Regras de cache: o HTML sempre revalida, as imagens ficam um dia
COPY nginx.conf /etc/nginx/conf.d/default.conf

# O arquivo de configuracao nao deve ficar acessivel como pagina do site
RUN rm -f /usr/share/nginx/html/nginx.conf

# O nginx ja sobe sozinho na porta 80
EXPOSE 80
