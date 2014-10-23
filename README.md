![Bowline logo](http://i.imgur.com/nZkCkrv.png)

--

## It ties your Docker images to a build process... with a bowline.

Bowline is a system that's designed to build Docker images for you, from a Dockerfile automatically, as a service. It watches for changes to "something" (a file over HTTP, or a merged pull request {and more}) and then kicks off a build process for you, and pushes the image to Dockerhub.

It's goal is to:

1. Watch for an update
2. Update a Github repository holding your Dockerfile (and make a pull request)
3. Kick off a build of your `Dockerfile`
4. Push the built image to Dockerhub.
5. Alert you that it's ready
6. Log it's results of the build.

## Bowline is still a preview

## Inspiration

I just want to have a software release happen, and then have something build the final docker image for me, so I don't have to sit there waiting for it to happen. I was originally inspired by wanting to have an up-to-date Docker image readied in a repository after an Asterisk security release (I'd rather just have them, now.)

The name is inspired by the nautical theme of Docker to begin with, however The logo is inspired by (The Ashley Book of Knots)[http://en.wikipedia.org/wiki/The_Ashley_Book_of_Knots]

## License

Licensed under the MIT license.