#!/bin/bash
# server hostname and port
export OAUTH2_PORT=8087
export OAUTH2_HOSTNAME=localhost
# user to authorize
export OAUTH2_TEST_USER_NAME=Test User
export OAUTH2_TEST_USER_EMAIL=test@oauth2.mock
# where to redirect after authorization
export OAUTH2_REDIRECT_URL=http://localhost:8888/oauth/oauth-mock/callback