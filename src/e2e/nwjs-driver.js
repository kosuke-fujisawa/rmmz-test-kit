"use strict";

/**
 * RPGツクールMZ(NW.js版)の黒箱E2E向け共通ヘルパー。
 * chiriyuku-monotachi tools/mz/e2e/nwjs-basic-path.js の実機検証で確立したパターンを
 * ゲーム内容非依存の形で切り出したもの。SceneManager/DataManager等の内部APIには触れず、
 * キーボード入力(Selenium Actions)と画面(スクリーンショット)の外部観測だけを提供する。
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { Builder, Capabilities } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * このMZ同梱ChromeDriverの実体パスを解決する(現時点はmacOS版のみ対応)。
 * @param {string} mzAppPath RPGMZ.appまでのパス
 */
function resolveChromedriverPath(mzAppPath) {
  return path.join(mzAppPath, "Contents", "Resources", "nwjs-mac", "chromedriver");
}

/**
 * NW.js版MZプロジェクトをSelenium(MZ同梱ChromeDriver)経由で起動する。
 * `nwargs` experimental optionはこのMZ同梱ChromeDriverでは反映されないため、
 * 起動引数文字列を `args` 配列へ直接渡す形式(先頭に "--" が前置される)を使う。
 * ブートストラッププラグイン側は `findLaunchArgToken` でこの形式に対応すること。
 *
 * @param {object} options
 * @param {string} options.chromedriverPath
 * @param {string} options.projectDir MZプロジェクトのディレクトリ(nwapp)
 * @param {string} options.userDataDir 実行ごとに分離した一時プロファイルディレクトリ
 * @param {string} options.launchArgs "test&scenario=...&seed=...&savedir=..." 形式の文字列
 */
async function createNwjsDriver({ chromedriverPath, projectDir, userDataDir, launchArgs }) {
  const service = new chrome.ServiceBuilder(chromedriverPath);
  const caps = Capabilities.chrome();
  caps.set("goog:chromeOptions", {
    args: [`nwapp=${projectDir}`, `--user-data-dir=${userDataDir}`, launchArgs],
  });
  return new Builder().forBrowser("chrome").setChromeService(service).withCapabilities(caps).build();
}

/**
 * keyDownとkeyUpを対で送る(押しっぱなしを避ける)。
 * MZのInput.update()はポーリング式のため、keyDown直後にkeyUpすると
 * 同一フレーム内で押下→解放が完結してしまい入力を取りこぼす。
 * holdMsだけ保持することで確実に検出させる。
 */
async function pressKey(driver, key, { wait = 500, holdMs = 120 } = {}) {
  await driver.actions({ async: true }).keyDown(key).pause(holdMs).keyUp(key).perform();
  await sleep(wait);
}

async function pressKeyN(driver, key, times, options) {
  for (let i = 0; i < times; i++) {
    await pressKey(driver, key, options);
  }
}

function waitForFile(filePath, timeoutMs) {
  const start = Date.now();
  return new Promise(resolve => {
    const check = () => {
      if (fs.existsSync(filePath)) {
        resolve(true);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        resolve(false);
        return;
      }
      setTimeout(check, 300);
    };
    check();
  });
}

async function screenshotHash(driver) {
  try {
    const image = await driver.takeScreenshot();
    return crypto.createHash("sha1").update(image).digest("hex");
  } catch {
    return null;
  }
}

/**
 * 画面(スクリーンショット)のハッシュが2回連続で一致するまで待つ。
 * シーン遷移直後は入力が受け付けられない一瞬の区間があるため、
 * 「画面が実際に変化しなくなったこと」を外部から観測して同期点とする。
 */
async function waitForScreenStable(driver, { maxWaitMs = 6000, intervalMs = 250 } = {}) {
  const start = Date.now();
  let previousHash = null;
  let stableCount = 0;
  while (Date.now() - start < maxWaitMs) {
    const hash = await screenshotHash(driver);
    if (hash && hash === previousHash) {
      stableCount += 1;
      if (stableCount >= 2) {
        return true;
      }
    } else {
      stableCount = 0;
    }
    previousHash = hash;
    await sleep(intervalMs);
  }
  return false;
}

/**
 * 移動キー等を送り、画面(スクリーンショットのハッシュ)が実際に変化するまで
 * 最大retries回まで再送する。シーン遷移直後は入力が無視されることがあるため、
 * 結果を外部から観測して確実に反映させる。
 */
async function pressUntilChanged(driver, key, { wait = 800, retries = 4 } = {}) {
  const before = await screenshotHash(driver);
  for (let attempt = 1; attempt <= retries; attempt++) {
    await pressKey(driver, key, { wait });
    const after = await screenshotHash(driver);
    if (after && after !== before) {
      return true;
    }
  }
  return false;
}

module.exports = {
  sleep,
  resolveChromedriverPath,
  createNwjsDriver,
  pressKey,
  pressKeyN,
  waitForFile,
  screenshotHash,
  waitForScreenStable,
  pressUntilChanged,
};
