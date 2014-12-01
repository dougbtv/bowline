## Adding a git hook

### Using GitHub

It's really easy with GitHub, when looking at properties for a knot, with the Git Hook method selected as your update method, copy the URL which will look about like:

    https://bowline.io/api/gitHookUpdate/2912e01b-a9a6-4255-b15a-e1ec9b5098c2

(Naturally, it will have a key that's specific to your knot.)

Go into your GitHub repository:

1. Select `Settings` on the right nav.
2. Choose `Web Hooks and Services`
3. Paste the Bowline URL into the `Payload URL` field.

If you need more information about how to configure which events you'd like it to trigger on, visit [GitHub's webhook documentation](https://developer.github.com/webhooks/). We recommend on push, but, something else may fit better for you.

### Using plain-ole git

All you'll need to do is add a git hook at the appropriate time.

First, collect your Git Hook URL & secret by visiting your knot's properties, and copying the URL which looks approximately like:

    https://bowline.io/api/gitHookUpdate/2912e01b-a9a6-4255-b15a-e1ec9b5098c2

Copy the URL for your release, and use it in place of this example URL throughout these instructions.

Next, add your git hook. May we suggest using a `post-recieve` or, choose whatever you may like from [the Git documentation on hooks](http://git-scm.com/docs/githooks)

On your server repository:

    echo "curl https://bowline.io/api/gitHookUpdate/2912e01b-a9a6-4255-b15a-e1ec9b5098c2" >> /path/to/.git/hooks/post-receive
    chmod +x /path/to/.git/hooks/post-receive

You can of course test it by just running cURL, if you'd like:

	curl https://bowline.io/api/gitHookUpdate/2912e01b-a9a6-4255-b15a-e1ec9b5098c2

### Using another service.

You can use this creatively, if you so choose. Just take the URL, and go ahead and post to it.

### Uh oh, secret compromised?

That's OK, just edit your knot properties, and choose the `Generate` button next to the hook secret key to get a new one.