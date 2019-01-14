> # cmd/retry [![Tweet][icon_twitter]][twitter_publish]
> [![Analytics][analytics_pixel]][page_promo]
> `retry` provides functionality to repeat terminal commands.

[![Awesome][icon_awesome]](https://github.com/avelino/awesome-go#utilities)
[![Patreon][icon_patreon]](https://www.patreon.com/octolab)
[![Build Status][icon_build]][page_build]
[![Code Coverage][icon_coverage]][page_quality]
[![Code Quality][icon_quality]][page_quality]
[![GoDoc][icon_docs]][page_docs]
[![License][icon_license]](../../LICENSE)

## Concept

```bash
$ retry -limit=3 -backoff=lin:500ms -- curl example.com
```

[![asciicast](https://asciinema.org/a/150367.png)](https://asciinema.org/a/150367)

## Documentation

```
Usage: retry [-timeout Timeout] [--debug] [--notify] [strategy flags] -- command

The strategy flags
    --infinite
        Infinite creates a Strategy that will never stop repeating.

    -limit=X
        Limit creates a Strategy that limits the number of attempts that Retry will
        make.

    -delay=Xs
        Delay creates a Strategy that waits the given duration before the first
        attempt is made.

    -wait=Xs,...
        Wait creates a Strategy that waits the given durations for each attempt after
        the first. If the number of attempts is greater than the number of durations
        provided, then the strategy uses the last duration provided.

    -backoff=:algorithm
        Backoff creates a Strategy that waits before each attempt, with a duration as
        defined by the given backoff.Algorithm.

    -tbackoff=":algorithm :transformation"
        BackoffWithJitter creates a Strategy that waits before each attempt, with a
        duration as defined by the given backoff.Algorithm and jitter.Transformation.

:algorithm
    inc:Xs,Ys
        Incremental creates a Algorithm that increments the initial duration
        by the given increment for each attempt.

    lin:Xs
        Linear creates a Algorithm that linearly multiplies the factor
        duration by the attempt number for each attempt.

    exp:Xs,Y
        Exponential creates a Algorithm that multiplies the factor duration by
        an exponentially increasing factor for each attempt, where the factor is
        calculated as the given base raised to the attempt number.

    binexp:Xs
        BinaryExponential creates a Algorithm that multiplies the factor
        duration by an exponentially increasing factor for each attempt, where the
        factor is calculated as "2" raised to the attempt number (2^attempt).

    fib:Xs
        Fibonacci creates a Algorithm that multiplies the factor duration by
        an increasing factor for each attempt, where the factor is the Nth number in
        the Fibonacci sequence.

:transformation
    full
        Full creates a Transformation that transforms a duration into a result
        duration in [0, n) randomly, where n is the given duration.

        The given generator is what is used to determine the random transformation.
        If a nil generator is passed, a default one will be provided.

        Inspired by https://www.awsarchitectureblog.com/2015/03/backoff.html

    equal
        Equal creates a Transformation that transforms a duration into a result
        duration in [n/2, n) randomly, where n is the given duration.

        The given generator is what is used to determine the random transformation.
        If a nil generator is passed, a default one will be provided.

        Inspired by https://www.awsarchitectureblog.com/2015/03/backoff.html

    dev:X
        Deviation creates a Transformation that transforms a duration into a result
        duration that deviates from the input randomly by a given factor.

        The given generator is what is used to determine the random transformation.
        If a nil generator is passed, a default one will be provided.

        Inspired by https://developers.google.com/api-client-library/java/google-http-java-client/backoff

    ndist:X
        NormalDistribution creates a Transformation that transforms a duration into a
        result duration based on a normal distribution of the input and the given
        standard deviation.

        The given generator is what is used to determine the random transformation.
        If a nil generator is passed, a default one will be provided.

Examples:
    retry -limit=3 -backoff=lin:10ms -- curl http://example.com
    retry -tbackoff="lin:10s full" --debug -- curl https://example.com
    retry -timeout=500ms --notify --infinite -- git pull

Version 3.0.0 (commit: ..., build date: ..., go version: go1.9, compiler: gc, platform: darwin/amd64)
```

### Complex example

```bash
$ retry -limit=3 -backoff=lin:10ms -- /bin/sh -c 'echo "trying..."; exit 1'
trying...
#2 attempt at 17.636458ms...
trying...
#3 attempt at 48.287964ms...
trying...
error occurred: "exit status 1"
$ retry -timeout=500ms --infinite -- /bin/sh -c 'echo "trying..."; exit 1'
trying...
...
trying...
#N attempt at 499.691521ms...
error occurred: "context deadline exceeded"
```

## Installation

### Brew

```bash
$ brew install kamilsk/tap/retry
```

### Binary

```bash
$ export REQ_VER=3.0.0  # all available versions are on https://github.com/kamilsk/retry/releases
$ export REQ_OS=Linux   # macOS and Windows are also available
$ export REQ_ARCH=64bit # 32bit is also available
$ # wget -q -O retry.tar.gz
$ curl -sL -o retry.tar.gz \
       https://github.com/kamilsk/retry/releases/download/"${REQ_VER}/retry_${REQ_VER}_${REQ_OS}-${REQ_ARCH}".tar.gz
$ tar xf retry.tar.gz -C "${GOPATH}"/bin/ && rm retry.tar.gz
```

### From source code

```bash
$ egg github.com/kamilsk/retry@^3.0.0 -- make test install
$ # or use mirror
$ egg bitbucket.org/kamilsk/retry@^3.0.0 -- make test install
```

> [egg](https://github.com/kamilsk/egg)<sup id="anchor-egg">[1](#egg)</sup> is an `extended go get`.

### Bash and Zsh completions

You can find completion files [here](https://github.com/kamilsk/shared/tree/dotfiles/bash_completion.d) or
build your own using these commands

```bash
$ retry completion bash > /path/to/bash_completion.d/retry.sh
$ retry completion zsh  > /path/to/zsh-completions/_retry.zsh
```

<sup id="egg">1</sup> The project is still in prototyping. [↩](#anchor-egg)

---

[![Gitter][icon_gitter]](https://gitter.im/kamilsk/retry)
[![@kamilsk][icon_tw_author]](https://twitter.com/ikamilsk)
[![@octolab][icon_tw_sponsor]](https://twitter.com/octolab_inc)

made with ❤️ by [OctoLab](https://www.octolab.org/)

[analytics_pixel]: https://ga-beacon.appspot.com/UA-109817251-1/retry/cmd/dev?pixel

[icon_awesome]:    https://cdn.rawgit.com/sindresorhus/awesome/d7305f38d29fed78fa85652e3a63e154dd8e8829/media/badge.svg
[icon_build]:      https://travis-ci.org/kamilsk/retry.svg?branch=dev
[icon_coverage]:   https://scrutinizer-ci.com/g/kamilsk/retry/badges/coverage.png?b=dev
[icon_docs]:       https://godoc.org/github.com/kamilsk/retry?status.svg
[icon_gitter]:     https://badges.gitter.im/Join%20Chat.svg
[icon_license]:    https://img.shields.io/badge/license-MIT-blue.svg
[icon_patreon]:    https://img.shields.io/badge/patreon-donate-orange.svg
[icon_quality]:    https://scrutinizer-ci.com/g/kamilsk/retry/badges/quality-score.png?b=dev
[icon_research]:   https://img.shields.io/badge/research-in%20progress-yellow.svg
[icon_tw_author]:  https://img.shields.io/badge/author-%40kamilsk-blue.svg
[icon_tw_sponsor]: https://img.shields.io/badge/sponsor-%40octolab-blue.svg
[icon_twitter]:    https://img.shields.io/twitter/url/http/shields.io.svg?style=social

[page_build]:      https://travis-ci.org/kamilsk/retry
[page_docs]:       https://godoc.org/github.com/kamilsk/retry
[page_promo]:      https://github.com/kamilsk/retry
[page_quality]:    https://scrutinizer-ci.com/g/kamilsk/retry/?branch=dev

[twitter_publish]: https://twitter.com/intent/tweet?text=Functional%20mechanism%20based%20on%20channels%20to%20perform%20actions%20repetitively%20until%20successful&url=https://github.com/kamilsk/retry&via=ikamilsk&hashtags=go,repeat,retry,backoff,jitter
