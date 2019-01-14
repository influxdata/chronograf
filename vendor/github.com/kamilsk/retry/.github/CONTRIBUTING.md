# Contributing workflow

Read first [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments).

## Code quality checking

```bash
$ make docker-pull-tools
$ make check-code-quality
```

## Testing

### Local

```bash
$ make install-deps
$ make test # or test-with-coverage
$ make bench
```

### Docker

```bash
$ make docker-pull
$ make complex-tests # or (complex|parallel)-tests-with-coverage
$ make complex-bench
```
