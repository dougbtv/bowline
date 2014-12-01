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
* Choose Save.

Alright, now you've got a knot setup that you can choose to manually update by visiting the status for that knot, and chooseing "Begin manual update".

*At the time of this writing, only Github repositories are supported. We have stubbed in plain git, but, it is not complete.*

### Using automatic updates

You've got two options for automatic updates, with a Git Hook, or poll HTTP (or you can manually kick off updates, too.)

#### Git Hooks

For now, I'll refer you to the `Using Git Hooks` part of the manual. (It's on the top tab if you're on Bowline.io)

#### Polling HTTP

If you're looking at someone else's package, and they deliver it over HTTP -- this might be the option for you. In fact, the original author was inspired to build this when he wanted to track tarballs for building Asterisk. So, we'll use Asterisk as the example.

*TODO: More to come here*

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