FROM centos:centos7
MAINTAINER Doug Smith <info@laboratoryb.com>
ENV build_date 2014-10-02

# Update yum packages, get deps.
RUN yum update -y
RUN yum install -y epel-release
RUN yum install -y npm wget git
RUN yum install -y docker

RUN npm install -g forever

ENV version_increment 0x00001b33f36
RUN git clone https://github.com/dougbtv/bowline.git

# We need make for gyp rebuilds of cpp
RUN yum install -y make
WORKDIR /bowline
RUN npm install
WORKDIR /

# ENV DOCKER_HOST tcp://dind:4444

ENTRYPOINT forever -e /var/log/bowline.log -o /var/log/bowline.log /bowline/bowline.js
