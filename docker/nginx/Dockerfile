FROM nginx
MAINTAINER Doug Smith <info@laboratoryb.com>
ENV build_date 2014-11-06

RUN mkdir /etc/nginx/ssl/
COPY cert/nginx.crt /etc/nginx/ssl/nginx.crt
COPY cert/nginx.key /etc/nginx/ssl/nginx.key
RUN rm /etc/nginx/conf.d/default.conf
RUN rm /etc/nginx/conf.d/example_ssl.conf
COPY nginx.conf /etc/nginx/nginx.conf