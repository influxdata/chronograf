/* eslint-disable no-process-exit */
import express from "express";
import cors from "cors";

// terminate on DTRL+C or CTRL+D
process.on("SIGINT", () => process.exit());
process.on("SIGTERM", () => process.exit());
const app = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let CONFIG = {
  redirect_uri:
    process.env.OAUTH2_REDIRECT_URL ||
    "http://localhost:8888/oauth/oauth-mock/callback",
  userinfo: {
    name: process.env.OAUTH2_TEST_USER_NAME || "Test User",
    email: process.env.OAUTH2_TEST_USER_EMAIL || "test@oauth2.mock",
  },
};

app.get("/oauth/authorize", (req, res) => {
  const state = req.query.state;
  const redirect = req.query.redirect_uri || CONFIG.redirect_uri;
  console.info("GET /oauth/authorize: ", redirect);
  res.setHeader(
    "Location",
    `${redirect}?code=${encodeURIComponent(
      redirect + new Date().toISOString()
    )}&state=${encodeURIComponent(state)}`
  );
  res.sendStatus(302);
  res.end();
});

app.post("/oauth/token", (_req, res) => {
  console.info("POST /oauth/token: ");
  const token = `t-${new Date().toISOString()}`;
  res.setHeader("content-type", "application/json;charset=UTF-8");
  res.status(200);
  res.json({
    access_token: token,
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: token,
  });
});

app.get("/userinfo", (_req, res) => {
  console.info("GET /userinfo");
  res.setHeader("Content-Type", "application/json;charset=UTF-8");
  res.status(200);
  res.json(CONFIG.userinfo);
});

app.post("/config", (req, res) => {
  console.info("POST /state");
  res.setHeader("Content-Type", "application/json;charset=UTF-8");
  try {
    const body = req.body;
    if (typeof body !== "object" || body === null) {
      throw new Error("invalid body");
    }
    if (!body.redirect_uri) {
      body.redirect_uri = CONFIG.redirect_uri;
    }
    if (!body.userinfo) {
      body.userinfo = CONFIG.userinfo;
    }
    CONFIG = body;
    console.info("Configuration changed to:", CONFIG);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
    return;
  }
  res.status(200);
  res.json(CONFIG);
});
app.all("/", (req, res) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.sendStatus(500);
  }
  if (req.method === "POST") {
    const { redirect_uri, email, name } = req.body;
    if (redirect_uri) {
      CONFIG.redirect_uri = redirect_uri;
    }
    if (email) {
      (CONFIG.userinfo || (CONFIG.userinfo = {})).email = email;
    }
    if (name) {
      (CONFIG.userinfo || (CONFIG.userinfo = {})).name = name;
    }
    console.info("Configuration changed to:", CONFIG);
  }

  res.status(200);
  res.header("Content-Type", "text/html;charset=UTF-8");
  res.write(
    "<html><head><title>OAuth2 Mock</title></head><body><h1>OAuth2 Mock</h1>"
  );
  res.write('<form action="/" method="POST">');
  res.write('<label for="callbackUrl">Callback URL:</label><br>');
  res.write(
    `<input style="width: 100%" type="text" id="callbackUrl" name="redirect_uri" value="${CONFIG.redirect_uri}"><br>`
  );
  res.write('<label for="email">User Email:</label><br>');
  res.write(
    `<input style="width: 100%" type="text" id="email" name="email" value="${CONFIG.userinfo.email}"><br>`
  );
  res.write('<label for="name">User Name:</label><br>');
  res.write(
    `<input style="width: 100%" type="text" id="name" name="name" value="${CONFIG.userinfo.name}"><br>`
  );
  res.write('<br><input type="submit" value="Change Configuration">');
  res.write('<a style="float: right" href="userinfo">OpenID UserInfo endpoint</a>');
  res.write("</form></body></html>");
  res.end();
});

// start HTTP server
const port = process.env.OAUTH2_PORT || 8087;
const HOSTNAME = process.env.OAUTH2_HOSTNAME || "localhost";
app.listen(port, HOSTNAME, () => {
  console.info("Initial configuration:", CONFIG);
  console.info(`Listening on http://${HOSTNAME}:${port}`);
});
