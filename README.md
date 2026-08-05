# rmmz-e2e-kit

[![Test](https://github.com/kosuke-fujisawa/rmmz-e2e-kit/actions/workflows/test.yml/badge.svg)](https://github.com/kosuke-fujisawa/rmmz-e2e-kit/actions/workflows/test.yml)

RPG ツクール MZ(RMMZ)プロジェクト向けの NW.js 黒箱 E2E(ブラックボックスE2E)キットです。ゲーム内容(シナリオ・戦闘仕様)には依存しません。もともとは [negaboku](https://github.com/kosuke-fujisawa/negaboku)(`tools/mz-e2e/`)と [chiriyuku-monotachi](https://github.com/kosuke-fujisawa/chiriyuku-monotachi)(`tools/mz/e2e/`)の共通基盤として切り出したものですが、RPG ツクール MZ プロジェクト全般で利用できます。

## 対応プラットフォーム

`src/e2e/nwjs-driver.js`(`resolveChromedriverPath`)は現時点で **macOS のみ対応**です(RPG ツクール MZ が同梱する `nwjs-mac/chromedriver` の固定パスを前提にしています)。Windows/Linux 版 NW.js のパス解決は未実装です。`src/launch-args/parse-launch-args.js` はプラットフォーム非依存の純粋関数です。

## 含まれるもの

- `src/launch-args/parse-launch-args.js` — CLI起動引数(`test&scenario=...&seed=...&savedir=...`)の解析。純粋関数
- `src/e2e/nwjs-driver.js` — NW.js版MZプロジェクトの黒箱E2E向けヘルパー(Selenium起動、キー入力、画面変化待ち)

## スコープ外(意図的に含めないもの)

- MZ開発専用ブートストラッププラグイン本体。理由は2つ。(1) プラグインは配置ファイル名がプラグイン識別子を兼ねるため、プロジェクトごとに実ファイルを持つ必要がある。(2) このプラグインはMZ本体(NW.js)の中で全プレイヤーの起動時に毎回読み込まれるため、`require("rmmz-e2e-kit")`のような外部node_modules依存を持たせると、配布用パッケージに本キットが含まれない場合にゲームがクラッシュするリスクがある。そのため`parseLaunchArgs`相当の小さな純粋関数は、プラグイン側にそのまま複製して自己完結させる方針とする(このリポジトリがロジックの正本であり、変更する場合は両方に反映する。利用例は`negaboku/game/js/plugins/NegabokuDevBootstrap.js`を参照)
- データ検証(validate)・意味差分(semantic-diff)等: 現時点で chiriyuku-monotachi にのみ存在し、negaboku側では重複が未発生(Rule of Three未成立)のためスコープ外。将来negaboku側でも同種の重複が発生した場合は、**このリポジトリを分割するのではなく、このリポジトリ内にサブパスとして追加する**方針とする(例: `rmmz-e2e-kit/validate`)。理由は [tyranoscript-test-kit](https://github.com/kosuke-fujisawa/tyranoscript-test-kit) の前例による。あちらもE2E(Playwright)と静的解析(`check-scenario`)を1リポジトリにまとめており、依存関係の違い(静的解析側はNode.js標準ライブラリのみ、E2E側だけ`@playwright/test`をpeerDependenciesに持つ)はリポジトリ分割ではなくサブパス分割とpeerDependenciesで解決している。当初「別リポジトリとして切り出す」と記載していたが、この前例と矛盾するため訂正した

## 使い方

各プロジェクトの`package.json`から参照する。

```json
{
  "dependencies": {
    "rmmz-e2e-kit": "github:kosuke-fujisawa/rmmz-e2e-kit#main"
  }
}
```

ローカルで並行開発する場合は相対パスの `file:` 依存も使える(`"rmmz-e2e-kit": "file:../rmmz-e2e-kit"`)。

```js
const { parseLaunchArgs, createNwjsDriver, pressKey, pressUntilChanged, waitForFile } = require("rmmz-e2e-kit");

// MZプロジェクト(NW.js)を起動して黒箱E2Eする最小例
const driver = await createNwjsDriver({
  chromedriverPath: resolveChromedriverPath(mzAppPath), // 例: ~/Library/Application Support/Steam/steamapps/common/RPG Maker MZ/RPGMZ.app
  projectDir: "/path/to/your-mz-project",
  userDataDir: "/tmp/your-e2e-profile",
  launchArgs: "test&scenario=basic_path&seed=1234&savedir=/tmp/your-e2e-savedir",
});
```

起動引数(`test&scenario=...`)を実際にゲーム側で読み取るには、プロジェクト側に薄い開発専用プラグインが必要です。実装例は [negaboku/game/js/plugins/NegabokuDevBootstrap.js](https://github.com/kosuke-fujisawa/negaboku/blob/main/game/js/plugins/NegabokuDevBootstrap.js)(private repo)を参照してください。

## テスト

```bash
npm install
npm test
```

純粋関数(`parseLaunchArgs`、`findLaunchArgToken`)のみ自動テスト対象で、GitHub Actions(`.github/workflows/test.yml`)でも実行しています。`e2e/nwjs-driver.js`側はライセンス済みのRPGツクールMZインストールが必要なため、実際のMZプロジェクトに対する黒箱E2Eの中で検証してください(各利用プロジェクトの`tools/mz*/e2e/`を参照)。

## ライセンス

[MIT](LICENSE)
