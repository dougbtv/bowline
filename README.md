![Bowline logo](http://i.imgur.com/pHdhLik.png)

--

## It ties your Docker images to a build process... with a bowline.

Bowline provides a number of ways to stream-line the continuous builds of your Docker images, through a web interface.

* Automates building via push (say, with a Git hook) or polling HTTP 
* Logs the results of each `docker build`
* Alerts you of your Dockerfile build status (e.g. if a build fails)
* Provides an authenticated Docker registry, that works with with the Docker CLI (e.g. `docker login`)
* Provides a front-end to that registry showing you how each build is tagged.

And yes, you can run it locally -- it all runs in Docker, [check out the guide for running it locally](https://bowline.io/#/docs/runninglocal).

...Or you can run it in the cloud on [Bowline.io](https://bowline.io/)

You just provide each build you want to run with a link to a Dockerfile in a Github project, give your build a nickname, and watch it build remotely -- including a real-time view of the `docker build` progress.

It's very compatible with Github, and you can also update your images on Dockerhub with it.

You can also interact with it programatically through a REST API, too.

## Ultra-quick start

Requirements:

* Docker v1.10 or greater
* Docker-compose v.1.7 or greater

Steps:

1. [Install docker compose](https://docs.docker.com/compose/install/) via any method.
2. Clone this repository and enter it's root directory.
3. Run `docker-compose up`
4. [optional] Modify the `compose.env` and copy the `includes/example.config.json` to `includes/config.json` to customize the running environment.

For more advanced installation options [check out the guide for running it locally](https://bowline.io/#/docs/runninglocal).


## Bowline is way beta right now

We'd encourage you to check it out, and see if it provides a useful way to host a private local Docker registry and build server. Or, if the product in the cloud helps you out at all. It's free to use in the cloud, but, all images are currently public on bowline.io.

## Inspiration

I just want to have a software release happen, and then have something build the final docker image for me, so I don't have to sit there waiting for it to happen. I was originally inspired by wanting to have an up-to-date Docker image readied in a repository after an Asterisk security release (I'd rather just have them, now.)

The name is inspired by the nautical theme of Docker to begin with. Additionally, I have a penchant for knots and it seemed to lend itself to the concept. Plus the bowline is a rather useful and nearly ubiquitous in the world of knots. The logo is original (and is also open source and available in the clone). The logo is inspired by [The Ashley Book of Knots](http://en.wikipedia.org/wiki/The_Ashley_Book_of_Knots), which depicts how the bowline is tied and specifically (the arrows in the logo) how the knot is "faired" (how it's made neat and tied tightly).

## License

Licensed under the MIT license.