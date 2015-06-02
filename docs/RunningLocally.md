# Running Bowline.io locally

## Basic Setup

You can run Bowline with Docker. It's all bootstrapped for you, just install the dependencies and run the provided script.

This setup assumes CentOS, but, basically if you change the package manager commands, the rest will apply to you (assuming Linux). Additionally these commands require the use of Docker on the host. Use the setup you like best for giving access to a user (or, use sudo).

We really only require two things, docker and git. Install them with your favorite package manager:

    yum install -y docker git

Let's clone Bowline, and move to our Docker directory.

    git clone https://github.com/dougbtv/bowline.git
    cd bowline/docker/utils/

Now we can build the containers we're going to need. You'll need to run this with a user who has privileges to build Docker images & run Docker containers. 

*Word to the wise*: This script will stop other running docker containers.

    ./build_it.sh

Now you can run what you've just built with:

    ./run_it.sh

If you run a `docker ps` it should now look approximately like:

    CONTAINER ID        IMAGE                            COMMAND                CREATED        STATUS     PORTS                                      NAMES
    62d6a179e9a4        dougbtv/bowline-nginx:latest     "nginx -g 'daemon of   A minute ago   Up         0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp   determined_turing   
    ace84aa405f7        dougbtv/bowline:latest           "/bin/sh -c 'forever   A minute ago   Up         0.0.0.0:8000->8000/tcp                     bowline             
    1fb1bea5f4d3        svendowideit/ambassador:latest   "\"/bin/sh -c 'env |   A minute ago   Up         443/tcp                                    nginx-amb           
    ae35ea4437e8        library/mongo:latest        "mongod"               A minute ago   Up         28017/tcp, 0.0.0.0:27017->27017/tcp        mongodb             
    235d17f30e11        registry:latest                  "docker-registry"      A minute ago   Up         0.0.0.0:5000->5000/tcp                     regserver           

Add `dockertest.com` to your hosts file:

    echo "127.0.0.1 dockertest.com" >> /etc/hosts

And point a browser @ dockertest.com -- or do a `docker login https://dockertest.com`

## Understanding the setup.

You're building a couple docker containers, pulling another three, and running them. They are:

* Bowline's backend (a REST-ish API created with Node.js)
* A [MongoDB instance](https://registry.hub.docker.com/_/mongo/) to store Bowline's data.
* A [Docker registry](https://registry.hub.docker.com/_/registry/)
* An nginx server to proxy requests between the Bowline API & the registry, and serve the front-end
* An ambassador for nginx, as the Bowline & Nginx containers need both to know about one another.
  * Necessary for later scaling to multiple servers.
  * What's an ambassador, you ask?
    * [Here's Docker's take on it.](http://docs.docker.com/articles/ambassador_pattern_linking/)
    * [Here's a deeper delve with CoreOS](https://coreos.com/blog/docker-dynamic-ambassador-powered-by-etcd/)
    * [Here's the container we run](https://registry.hub.docker.com/u/svendowideit/ambassador/)

The setup uses the hosts Docker daemon to do the building of the images. You could consider running [Docker-in-Docker](https://github.com/jpetazzo/dind), however, our experience has been that it isn't 100% rock solid.

This setup creates two directories in `/tmp/` for storing the registry, and the mongod. We recommend you change these variables in `run_it.sh`, which are at the top of the file to point to directories that are you know, more permanent. (And maybe even backed up!) 

## Customizing your Setup

Likely, now that you've got it running -- it's semi incomplete, because you need to add your credentials. Especially, a github account to use the Github API inside Bowline. You can customize these by editing `/includes/examples.config.json`

If you're using the `build_it.sh` script as described earlier, you can just edit `/includes/examples.config.json` with the Github username and password of your choice, then run `build_it.sh` and `run_it.sh` again, and it will use the new configuration.

### Customizing the passwords

TODO. For now, login as user 'bowlineadmin' with password 'bowline' and then just change your password with the web front-end.

## SSL

Great, you've got Bowline running, and you can make builds with it. But, what about making a `docker pull` from your shiny new authenticated registry?

...It's not that bad, but, you will need a legitimate SSL setup. Otherwise, with `docker login` and the way it'll provide credentials -- the docker client doesn't lie to you about SSL (or have a non-SSL option, either.)

Two options going forward:

### Option A: Get a legit Cert

In production, you'll want a legitimate SSL certificate. However, this isn't always an option locally, and running `docker pull/push/login` with a repository with creds -- you *need* to use legit SSL. So use a legit cert.

Once you have a legitimate certificate, you can modify the Nginx Dockerfile you can find in the clone @ `/docker/nginx/Dockerfile` -- and replace the certificates with your own.

### Option B: You need to test in development

Everything packaged in the building & running as shown above, includes sample certificates for a fictional "dockertest.com"

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