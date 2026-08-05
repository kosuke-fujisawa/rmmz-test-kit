"use strict";

const { parseLaunchArgs, findLaunchArgToken } = require("./launch-args/parse-launch-args");
const nwjsDriver = require("./e2e/nwjs-driver");

module.exports = {
  parseLaunchArgs,
  findLaunchArgToken,
  ...nwjsDriver,
};
