# oauth2-server-mock

This repository contains a mock [OAuth2](https://oauth.net/2/) Authorization Server with Authorization Code Grant flow and OpenID [UserInfo endpoint](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo). It is primarily intended for testing, it always authorizes a pre-configured user that can be changed at runtime.

## Install

Prerequisites: [node.js 14](https://nodejs.org/) or newer

Install required dependencies using your favorite package manager (npm,yarn,pnmp):

```
npm install
```

## Configure

Modify [./env.sh](./env.sh) and run `source env.sh` to setup initial configuration of the OAuth2 Mock Server.

## Start

```
npm run start
```

Initial configuration is printed to console as well as the URL where the server is listening for requests.

## Chronograf Setup

[Chronograf](https://github.com/influxdata/chronograf) can use this OAuth2 Mock server as a generic OAuth2 authentication provider,
several environment variables must be set before starting chronograf. These variables are shown in [./oauth-for-chronograf.sh](./oauth-for-chronograf.sh).

## Change OAuth2 redirect or authorized user at runtime

The running OAuth2 Mock server exposes a simple UI that let you change name/email 
of the authorized user, and a redirect URL after authorization. This page is by default accessible at http://localhost:8087/ .

Alternatively a simple HTTP POST message can be sent to change the config:
```bash
curl -X POST http://localhost:8087/config -H 'Content-Type: application/json' -d '{
  "redirect_uri": "http://whatever.you.like/callback",
  "userinfo": { "name": "fred doe", "email": "fred.doe@fake.net" }
}'
```
