> # ♻️ retry [![Tweet][icon_twitter]][twitter_publish]
> [![Analytics][analytics_pixel]][page_promo]
> Functional mechanism based on channels to perform actions repetitively until successful.

[![Awesome][icon_awesome]](https://github.com/avelino/awesome-go#utilities)
[![Patreon][icon_patreon]](https://www.patreon.com/octolab)
[![Build Status][icon_build]][page_build]
[![Code Coverage][icon_coverage]][page_quality]
[![Code Quality][icon_quality]][page_quality]
[![GoDoc][icon_docs]][page_docs]
[![Research][icon_research]][page_research]
[![License][icon_license]](LICENSE)

## Differences from [Rican7/retry](https://github.com/Rican7/retry)

- Fixed [bug](https://github.com/Rican7/retry/pull/2) with an unexpected infinite loop.
  - Added a clear mechanism for this purpose as the Infinite [strategy](strategy/strategy.go#L24-L28).
- Added support of cancellation (based on simple channel, e.g. `context.Done`).
  - Made honest Action execution.
- Added `error` transmission between attempts.
  - Added `classifier` to handle them (see [classifier](classifier) package).
- Added CLI tool `retry` which provides functionality for repeating terminal commands (see [cmd/retry](cmd/retry)).

## Usage

### Quick start

```go
var (
	response *http.Response
	action   retry.Action = func(_ uint) error {
		var err error
		response, err = http.Get("https://github.com/kamilsk/retry")
		return err
	}
)

if err := retry.Retry(retry.WithTimeout(time.Minute), action, strategy.Limit(10)); err != nil {
	// handle error
	return
}
// work with response
```

### Console tool for command execution with retries

This example shows how to repeat console command until successful.

```bash
$ retry --infinite -timeout 10m -backoff=lin:500ms -- /bin/sh -c 'echo "trying..."; exit $((1 + RANDOM % 10 > 5))'
```

[![asciicast](https://asciinema.org/a/150367.png)](https://asciinema.org/a/150367)

See more details [here](cmd/retry).

### Create HTTP client with retry

This example shows how to extend standard http.Client with retry under the hood.

```go
type client struct {
	base       *http.Client
	strategies []strategy.Strategy
}

func New(timeout time.Duration, strategies ...strategy.Strategy) *client {
	return &client{
		base:       &http.Client{Timeout: timeout},
		strategies: strategies,
	}
}

func (c *client) Get(deadline <-chan struct{}, url string) (*http.Response, error) {
	var response *http.Response
	err := retry.Retry(deadline, func(uint) error {
		resp, err := c.base.Get(url)
		if err != nil {
			return err
		}
		response = resp
		return nil
	}, c.strategies...)
	return response, err
}
```

### Control database connection

This example shows how to use retry to restore database connection by `database/sql/driver.Pinger`.

```go
MustOpen := func() *sql.DB {
	db, err := sql.Open("stub", "stub://test")
	if err != nil {
		panic(err)
	}
	return db
}

go func(db *sql.DB, ctx context.Context, shutdown chan<- struct{}, frequency time.Duration,
	strategies ...strategy.Strategy) {

	defer func() {
		if r := recover(); r != nil {
			shutdown <- struct{}{}
		}
	}()

	ping := func(uint) error {
		return db.Ping()
	}

	for {
		if err := retry.Retry(ctx.Done(), ping, strategies...); err != nil {
			panic(err)
		}
		time.Sleep(frequency)
	}
}(MustOpen(), context.Background(), shutdown, time.Millisecond, strategy.Limit(1))
```

### Use context for cancellation

This example shows how to use context and retry together.

```go
communication := make(chan error)

go service.Listen(communication)

action := func(uint) error {
	communication <- nil   // ping
	return <-communication // pong
}
ctx := retry.WithContext(context.Background(), retry.WithTimeout(time.Second))
if err := retry.Retry(ctx.Done(), action, strategy.Delay(time.Millisecond)); err != nil {
	// the service does not respond within one second
}
```

### Interrupt execution

```go
interrupter := retry.Multiplex(
	retry.WithTimeout(time.Second),
	retry.WithSignal(os.Interrupt),
)
if err := retry.Retry(interrupter, func(uint) error { time.Sleep(time.Second); return nil }); err == nil {
	panic("press Ctrl+C")
}
// successful interruption
```

## Installation

```bash
$ go get github.com/kamilsk/retry
$ # or use mirror
$ egg bitbucket.org/kamilsk/retry
```

> [egg](https://github.com/kamilsk/egg)<sup id="anchor-egg">[1](#egg)</sup> is an `extended go get`.

## Update

This library is using [SemVer](http://semver.org) for versioning, and it is not
[BC](https://en.wikipedia.org/wiki/Backward_compatibility)-safe. Therefore, do not use `go get -u` to update it,
use [dep](https://github.com/golang/dep) or something similar for this purpose.

<sup id="egg">1</sup> The project is still in prototyping. [↩](#anchor-egg)

---

[![Gitter][icon_gitter]](https://gitter.im/kamilsk/retry)
[![@kamilsk][icon_tw_author]](https://twitter.com/ikamilsk)
[![@octolab][icon_tw_sponsor]](https://twitter.com/octolab_inc)

made with ❤️ by [OctoLab](https://www.octolab.org/)

[analytics_pixel]: https://ga-beacon.appspot.com/UA-109817251-1/retry/master?pixel

[icon_awesome]:    https://cdn.rawgit.com/sindresorhus/awesome/d7305f38d29fed78fa85652e3a63e154dd8e8829/media/badge.svg
[icon_build]:      https://travis-ci.org/kamilsk/retry.svg?branch=master
[icon_coverage]:   https://scrutinizer-ci.com/g/kamilsk/retry/badges/coverage.png?b=master
[icon_docs]:       https://godoc.org/github.com/kamilsk/retry?status.svg
[icon_gitter]:     https://badges.gitter.im/Join%20Chat.svg
[icon_license]:    https://img.shields.io/badge/license-MIT-blue.svg
[icon_patreon]:    https://img.shields.io/badge/patreon-donate-orange.svg
[icon_quality]:    https://scrutinizer-ci.com/g/kamilsk/retry/badges/quality-score.png?b=master
[icon_research]:   https://img.shields.io/badge/research-in%20progress-yellow.svg
[icon_tw_author]:  https://img.shields.io/badge/author-%40kamilsk-blue.svg
[icon_tw_sponsor]: https://img.shields.io/badge/sponsor-%40octolab-blue.svg
[icon_twitter]:    https://img.shields.io/twitter/url/http/shields.io.svg?style=social

[page_build]:      https://travis-ci.org/kamilsk/retry
[page_docs]:       https://godoc.org/github.com/kamilsk/retry
[page_promo]:      https://github.com/kamilsk/retry
[page_research]:   https://github.com/kamilsk/go-research/tree/master/projects/retry
[page_quality]:    https://scrutinizer-ci.com/g/kamilsk/retry/?branch=master

[twitter_publish]: https://twitter.com/intent/tweet?text=Functional%20mechanism%20based%20on%20channels%20to%20perform%20actions%20repetitively%20until%20successful&url=https://github.com/kamilsk/retry&via=ikamilsk&hashtags=go,repeat,retry,backoff,jitter
