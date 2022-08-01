#!/usr/bin/env node
/* eslint-disable no-console */
import { spawnSync } from "child_process";

const yarnLicensesJSON = spawnSync("yarn", ["licenses", "list", "--json"], {
  encoding: "utf8",
});
const licensesOutput = yarnLicensesJSON.stdout.split("\n").filter((x) => x);
const licenses = licensesOutput[licensesOutput.length - 1];

// generate licenses.json with `yarn licenses --json`
const obj = JSON.parse(licenses);
const items = obj.data.body.reduce((acc, val) => {
  const [name] = val;
  (acc[name] || (acc[name] = [])).push(val);
  return acc;
}, {});

const keys = Object.keys(items).sort();
keys.forEach((key) => {
  items[key].forEach((val) => {
    console.log(`* ${key} ${val[1]} [${val[2]}](${val[3]})`);
  });
});
