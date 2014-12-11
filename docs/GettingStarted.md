## Getting Started

So you're about to use bowline.io, and you'd like to know: How do I setup a project to be built?

### Create an account

Should be pretty obvious, but, go to "Register" on the top navigation, furthest to the right. Follow the process, and then choose to "Login".

### Creating a knot

"Knots" define a project that's built on Bowline. It's a combination of your Git repository and Bowline's registry. (Plus more git, automation, and storage features we'll discuss). But, to create a knot you basically just need:

1. The path of your Github project (e.g. `username/project-name`)
2. The path of your Dockerfile inside your git clone. (e.g. `/path/to/Dockerfile`)

Let's set up a "Hello, World!" Bowline knot. We'll use a handy [example from bowline on github](https://github.com/dougbtv/test-dockerfiles/tree/master/helloworld) @ `https://github.com/dougbtv/test-dockerfiles.git`

* In the Bowline front-end visit *My Account > Add a knot*
* In **General**
  * Choose a *Nickname* like say, "helloworld"
  * Choose a *Docker namespace*
    * Usually it's `yourname/project`
    * We'll use `yourname/helloworld`
* In **Registry**
  * Mark a checkmark in "Store on bowline registry"
* In **Git Repo**
  * For "Github Repo" add your username/projectname from github
    * In this example, we use `dougbtv/test-dockerfiles`
  * For "Git Path"
    * Add the absolute path to the Dockerfile from the clone's root.
    * Include the filename `Dockerfile` in the path.
    * In this example we use: `/helloworld/Dockerfile`
      * If your Dockerfile is in the root directory, use `/Dockerfile`
* Choose Save.

Alright, now you've got a knot setup that you can choose to manually update by visiting the status for that knot, and chooseing "Begin manual update".

*At the time of this writing, only Github repositories are supported. We have stubbed in plain git, but, it is not complete.*

### Using automatic updates

You've got two options for automatic updates, with a Git Hook, or poll HTTP (or you can manually kick off updates, too.)

#### Git Hooks

For now, I'll refer you to the [Using Git Hooks](http://bowline.io/#/docs/usinghooks) part of the manual, which goes further in-depth.

#### Polling HTTP

If you're looking at someone else's package, and they deliver it over HTTP -- this might be the option for you. In fact, the original author was inspired to build this when he wanted to track tarballs for building Asterisk. So, we'll use Asterisk as the example.

The most important thing is that the item you're looking at via HTTP has a `Last-Modified` header. A typical Apache setup for serving files will provide this for you.

Let's say we're looking at a tarball for Asterisk 13, which is @ `http://downloads.asterisk.org/pub/telephony/asterisk/asterisk-13-current.tar.gz`

In the *Update Method* of your Bowline knot properties, change the *Update Method* drop-down to "Poll HTTP"

Using this URL, we'll break it into two parts and enter in:

* *HTTP Host*: downloads.asterisk.org
* *HTTP Path*: /pub/telephony/asterisk/asterisk-13-current.tar.gz

You'll also want to set which minutes of the hour you'd like to check for updates. If you add `15` & `45` in the "Check @ Minutes" Bowline will poll for changes at quarter past the hour, and 45 minutes past the hour each hour. You can check as frequently as every minute, or as little as once per hour.

##### Looking at the `last-modified` header

You can check out the headers on a file using curl like so:

    [user@host ~]$ curl --head http://downloads.asterisk.org/pub/telephony/asterisk/asterisk-13-current.tar.gz
    HTTP/1.1 200 OK
    Date: Mon, 01 Dec 2014 16:28:14 GMT
    Server: Apache/2.2.22 (Ubuntu)
    Last-Modified: Thu, 20 Nov 2014 20:55:57 GMT
    ETag: "260a38-1e5b88c-508508e10a5b8"
    Accept-Ranges: bytes
    Content-Length: 31832204
    Content-Type: application/x-gzip


### Customizing your Dockerfile for Bowline.

As it stands, there are currently two extras you can add to your Dockerfile that Bowline will understand.

* A tag for the Docker registry
* An environment variable to cache-bust the `docker build`

Both of these are optional.

Let's look at the `Hello, world!` Dockerfile

    #bowline tag 1.5
    FROM centos:centos7
    MAINTAINER Doug Smith <info@laboratoryb.org>
    ENV AUTOBUILD_UNIXTIME
    RUN echo "hello world"

#### Tags

Looking at the first line of the Dockerfile, we see:

    #bowline tag 1.5

This is a comment to Docker, but special to Bowline. You can set your tag to anything you'd like, but, make sure it always starts with `#bowline tag`

In this example, we'd build a full tag using our chosen namespace, plus this tag, so we'd end up with: `yourname/helloworld:1.5`

#### Autobuild cache-buster

You'll see this in the fourth line, and it's significant to Bowline:

    ENV AUTOBUILD_UNIXTIME

This is a convenience feature to help you speed up your builds. When Bowline goes to update your file, it'll change the value in the Dockerfile where it finds, and use cached results before this. If for example, you do something that you'd want to do infrequently, like say you have a line that says `RUN yum update -y`, you might not want to do this every time, so put an `ENV AUTOBUILD_UNIXTIME` after that line, and do everything else after it.

### Decorating your knot with some extras.

The number one thing you can do to pretty-ize your knot is to add a `README.md` file in the same directory as your `Dockerfile`. This is available when you're looking at the details of a knot on Bowline.