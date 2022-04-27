#!/bin/bash
# This script setup chronograf environment variables to a use this server OAuth2 server.
# Run this script as `source oauth-for-chronograf.sh` before you start chronograf.

. `dirname ${BASH_SOURCE}`/env.sh

OAUTH2_URL=http://${OAUTH2_HOSTNAME}:${OAUTH2_PORT}

# chronograf environment variables that configure OAuth2 
export TOKEN_SECRET=Q4O1T8FTbErOnmx03mGeVH3pkvKtdKr6HEmzEpNBiVMynZ/qKDdOResI3OMx4Zg9kmIfAI9ihlIV3OV5+VRfZ+iB2knLuGagEmFpG/h51CRcQY58j2NpnxdBewz91E51RRfjDYvqMrISHZCjdeuw0338Xp5UnEg32utr0ThRN0Ucv2isRr4KYJNYuvUXrjKJzjh76394JwY+bzn20L/enR2rLEtJ40ePxwuEvsE0MBUGZy79ecLZPaolQ3lkPE6X3+iV/9suN0BkBNtbQe1sGv4P522jSm24fFhXaFjetQQ/dJGehbWzsBo8uVAWB2RO0+xU2LhHFN0k0LAESD6MWw==
export GENERIC_CLIENT_ID=whateverid
export GENERIC_CLIENT_SECRET=whateversecret
export GENERIC_AUTH_URL="${OAUTH2_URL}/oauth/authorize"
export GENERIC_TOKEN_URL="${OAUTH2_URL}/oauth/token"
export GENERIC_API_URL=${OAUTH2_URL}/userinfo
export GENERIC_SCOPES="whatever"
export GENERIC_NAME=oauth-mock
export PUBLIC_URL=http://localhost:8888

echo Make sure to setup the following environment variables before your start OAuth Mock server
echo export OAUTH2_HOSTNAME=${OAUTH2_HOSTNAME}
echo export OAUTH2_PORT=${OAUTH2_PORT}
echo export OAUTH2_REDIRECT_URL=${PUBLIC_URL}/oauth/${GENERIC_NAME}/callback
