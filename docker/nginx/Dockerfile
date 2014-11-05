# FROM centos:centos7
# MAINTAINER Doug Smith <info@laboratoryb.com>
# ENV build_date 2014-10-02

# RUN yum update -y
# RUN yum install -y epel-release
# RUN yum install -y nginx

FROM nginx
RUN mkdir /etc/nginx/ssl/
COPY cert/nginx.crt /etc/nginx/ssl/nginx.crt
COPY cert/nginx.key /etc/nginx/ssl/nginx.key
RUN rm /etc/nginx/conf.d/default.conf
RUN rm /etc/nginx/conf.d/example_ssl.conf
COPY nginx.conf /etc/nginx/nginx.conf