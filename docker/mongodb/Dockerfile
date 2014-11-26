FROM dockerfile/mongodb:latest
MAINTAINER Doug Smith <info@laboratoryb.com>
ENV build_date 2014-11-06

COPY exampledata/ /exampledata
WORKDIR /exampledata
RUN ./import.sh