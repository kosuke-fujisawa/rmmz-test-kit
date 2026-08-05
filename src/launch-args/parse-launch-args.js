"use strict";

/**
 * "test&scenario=basic_path&seed=1234&savedir=/tmp/x" のような文字列を解析する。
 * DOMやnw.js APIに依存しない純粋関数。RPGツクールMZの開発専用ブートストラッププラグイン
 * (例: negaboku/game/js/plugins/NegabokuDevBootstrap.js)から共通で使う。
 * @param {string} raw
 * @returns {{test: boolean, scenario: string|null, seed: number|null, savedir: string|null}}
 */
function parseLaunchArgs(raw) {
  const result = { test: false, scenario: null, seed: null, savedir: null };
  if (!raw) {
    return result;
  }
  const tokens = String(raw)
    .replace(/^(--|\?)/, "")
    .split("&")
    .map(token => token.trim())
    .filter(token => token.length > 0);
  for (const token of tokens) {
    const eq = token.indexOf("=");
    if (eq === -1) {
      if (token === "test") {
        result.test = true;
      }
      continue;
    }
    const key = token.slice(0, eq);
    const value = decodeURIComponent(token.slice(eq + 1));
    if (key === "scenario") {
      result.scenario = value || null;
    } else if (key === "seed") {
      result.seed = /^-?\d+$/.test(value) ? Number.parseInt(value, 10) : null;
    } else if (key === "savedir") {
      result.savedir = value || null;
    }
  }
  return result;
}

/**
 * nw.App.argv配列から、test/scenario=/seed=/savedir=のいずれかを含む要素を探す。
 *
 * 直接 `nw <path> "test&..."` で起動した場合はargv[0]にそのまま入るが、
 * NW.js専用ChromeDriver経由(`goog:chromeOptions.args`)で起動した場合は
 * chromedriver自身が付与する `--disable-popup-blocking` 等の前に別の順序で並び、
 * かつ非スイッチ引数にも `--` が前置されることがある(chiriyuku-monotachiでの実機検証で確認済み)。
 * @param {string[]} argv
 * @returns {string}
 */
function findLaunchArgToken(argv) {
  const pattern = /(^|&)(test(&|$)|scenario=|seed=|savedir=)/;
  const candidate = (argv || []).find(arg => pattern.test(String(arg).replace(/^--/, "")));
  if (candidate !== undefined) {
    return candidate;
  }
  return argv && argv.length > 0 ? argv[0] : "";
}

module.exports = { parseLaunchArgs, findLaunchArgToken };
