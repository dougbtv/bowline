FROM centos:centos7
MAINTAINER Doug Smith <info@laboratoryb.com>
ENV build_date 2014-10-02

# Update yum packages, get deps.
RUN yum update -y && \
  yum install -y epel-release && \
  yum install -y npm wget git docker make gcc-c++

RUN npm install -g forever

ENV version_increment 0x0000b00fd33d6
RUN git clone https://github.com/dougbtv/bowline.git

WORKDIR /bowline
RUN npm install
RUN git checkout develop
WORKDIR /

ADD example.config.json /bowline/includes/config.json

# ENV DOCKER_HOST tcp://dind:4444

ENTRYPOINT forever -w --watchDirectory /bowline/library/ -e /var/log/bowline.log -o /var/log/bowline.log /bowline/bowline.js
