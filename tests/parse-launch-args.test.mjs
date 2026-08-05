import assert from "node:assert/strict";
import test from "node:test";
import { parseLaunchArgs, findLaunchArgToken } from "../src/launch-args/parse-launch-args.js";

test("test/scenario/seed/savedirを含む文字列を解析する", () => {
  const result = parseLaunchArgs("test&scenario=basic_path&seed=1234&savedir=/tmp/x");
  assert.deepEqual(result, { test: true, scenario: "basic_path", seed: 1234, savedir: "/tmp/x" });
});

test("空文字・未指定は全てデフォルト値になる", () => {
  assert.deepEqual(parseLaunchArgs(""), { test: false, scenario: null, seed: null, savedir: null });
  assert.deepEqual(parseLaunchArgs(undefined), { test: false, scenario: null, seed: null, savedir: null });
});

test("先頭の -- や ? を除去してから解析する(ChromeDriver経由・Web版クエリ文字列への対応)", () => {
  assert.equal(parseLaunchArgs("--test&seed=42").test, true);
  assert.equal(parseLaunchArgs("--test&seed=42").seed, 42);
  assert.equal(parseLaunchArgs("?test&seed=42").test, true);
});

test("seedが数値変換できない場合はnullになる", () => {
  assert.equal(parseLaunchArgs("seed=abc").seed, null);
});

test("seedが整数文字列全体でない場合はnullになる(部分パースで別の値に化けさせない)", () => {
  assert.equal(parseLaunchArgs("seed=12abc").seed, null);
  assert.equal(parseLaunchArgs("seed=1.5").seed, null);
  assert.equal(parseLaunchArgs("seed=0x10").seed, null);
});

test("findLaunchArgTokenはnw.App.argv配列から起動引数を含む要素を探す", () => {
  const argv = [
    "--disable-popup-blocking",
    "--enable-automation",
    "--test&scenario=basic_path&seed=1234&savedir=/tmp/x",
    "--user-data-dir=/tmp/y",
  ];
  assert.equal(findLaunchArgToken(argv), "--test&scenario=basic_path&seed=1234&savedir=/tmp/x");
});

test("findLaunchArgTokenは該当要素が無ければargv[0]にフォールバックする", () => {
  assert.equal(findLaunchArgToken(["some&other=thing"]), "some&other=thing");
  assert.equal(findLaunchArgToken([]), "");
});
