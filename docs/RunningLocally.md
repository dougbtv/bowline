# Running Bowline.io locally

## Basic Setup

You can run Bowline with Docker. It's all bootstrapped for you, just install the dependencies and run the provided script.

This setup assumes CentOS, but, basically if you change the package manager commands, the rest will apply to you (assuming Linux)

We really only require two things, docker and git. Install them with your favorite package manager:

    yum install -y docker git

Let's clone Bowline, and move to our Docker directory.

    git clone https://github.com/dougbtv/bowline.git
    cd bowline/docker/utils/

Now we can build the containers we're going to need. You'll need to run this with a user who has privileges to build Docker images & run Docker containers. *Word to the wise*: This script will stop other running docker containers.

    ./build_it.sh
    


## Understanding the setup.

You're building 4 docker containers, and running them:

* Bowline's backend
* A [MongoDB instance](https://registry.hub.docker.com/u/dockerfile/mongodb/) to store Bowline's data.
* A [Docker registry](https://registry.hub.docker.com/_/registry/)
* A Docker instance ([running in... Docker](https://github.com/jpetazzo/dind))
* An nginx server to proxy requests between the Bowline API & the registry

If you want to do a "docker"

## SSL

### Option A: Get a legit Cert

In production, you'll want a legitimate SSL certificate. However, this isn't always an option locally, and running `docker pull/push/login` with a repository with creds -- you *need* to use legit SSL. So use a legit cert.

### Option B: You need to test in development

The biggest pain with staging a test of the docker registry locally is the TLS & CA infrastructure. If you need another reference, I'll point you to [this github issue](https://github.com/docker/docker-registry/issues/541), which I found critical.

Using the files in `docker/nginx/` build the nginx server, which will include a test under `dockertest.com` -- add this to your `/etc/hosts`.

    [doug@localhost bowline]$ sudo echo "127.0.0.1 dockertest.com" >> /etc/hosts

Now, you'll need to add a CA to your install. This is an example for fedora, based on docs from [the Fedora Project](https://fedoraproject.org/wiki/Features/SharedSystemCertificates:Testing#How_to_add_a_systemwide_CA) regarding shared system certificates.

    [doug@localhost bowline]$ sudo cp docker/nginx/cert/ca.pem /etc/pki/ca-trust/source/anchors/
    [doug@localhost bowline]$ sudo update-ca-trust
    [doug@localhost bowline]$ curl https://dockertest.com/api/foo

But, this won't be any good until you restart docker

    [doug@localhost bowline]$ sudo systemctl restart docker

Now you can login & push:

    docker login -u someuser -p apasswordhere -e doesnt@matter.com https://dockertest.com
    docker push dockertest.com/someuser/tagname