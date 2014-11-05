## Staging a test locally

The biggest pain with staging a test of the docker registry locally is the TLS & CA infrastructure.

Using the files in `docker/nginx/` build the nginx server, which will include a test under `dockertest.com` -- add this to your etc/hosts.

Now, you'll need to add a CA to your install. This is an example for fedora, from this Fedora documentation.

    [doug@localhost bowline]$ sudo cp nginx/certs/ca.pem /etc/pki/ca-trust/source/anchors/
    [doug@localhost bowline]$ sudo update-ca-trust
    [doug@localhost bowline]$ curl https://dockertest/api/foo

But, this won't be any good until you restart docker

    [doug@localhost bowline]$ sudo systemctl restart docker

Now you can login & push:

    docker login -u someuser -p apasswordhere -e doesnt@matter.com https://dockertest.com
    docker push dockertest.com/someuser/tagname