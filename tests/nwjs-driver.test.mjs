import assert from "node:assert/strict";
import test from "node:test";
import { pressUntilChanged } from "../src/e2e/nwjs-driver.js";

function createFakeActionsChain() {
  const chain = {
    keyDown: () => chain,
    pause: () => chain,
    keyUp: () => chain,
    perform: async () => {},
  };
  return chain;
}

/**
 * takeScreenshotの戻り値を順番に差し替えるフェイクdriver。
 * "ERROR" を指定するとその回だけ取得失敗(例外)を模擬する。
 */
function createFakeDriver(screenshotSequence) {
  let index = 0;
  return {
    actions: () => createFakeActionsChain(),
    takeScreenshot: async () => {
      const value = screenshotSequence[index] ?? screenshotSequence[screenshotSequence.length - 1];
      index += 1;
      if (value === "ERROR") {
        throw new Error("screenshot failed");
      }
      return Buffer.from(value);
    },
  };
}

test("pressUntilChangedは画面が変化したらtrueを返す", async () => {
  const driver = createFakeDriver(["a", "b"]);
  const changed = await pressUntilChanged(driver, "Right", { wait: 0, retries: 2 });
  assert.equal(changed, true);
});

test("pressUntilChangedは画面が変化しなければfalseを返す", async () => {
  const driver = createFakeDriver(["a", "a", "a"]);
  const changed = await pressUntilChanged(driver, "Right", { wait: 0, retries: 2 });
  assert.equal(changed, false);
});

test("初回スクリーンショット取得に失敗した場合、以降取得が成功しても誤ってtrueにしない", async () => {
  const driver = createFakeDriver(["ERROR", "b", "b"]);
  const changed = await pressUntilChanged(driver, "Right", { wait: 0, retries: 2 });
  assert.equal(changed, false);
});
