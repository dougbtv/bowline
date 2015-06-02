FROM centos:centos7
MAINTAINER Doug Smith <info@laboratoryb.com>
ENV build_date 2014-10-02

# Update yum packages, get deps.
RUN yum update -y
RUN yum install -y epel-release
RUN yum install -y npm wget git
RUN yum install -y docker

RUN npm install -g forever

RUN yum install -y make

ENV version_increment 0x0000b00fd33d4
RUN git clone https://github.com/mut3/bowline.git

# We need make for gyp rebuilds of cpp
WORKDIR /bowline
RUN npm install
RUN git checkout develop
WORKDIR /

ADD config.json /bowline/includes/config.json

# ENV DOCKER_HOST tcp://dind:4444

ENTRYPOINT forever -e /var/log/bowline.log -o /var/log/bowline.log /bowline/bowline.js
