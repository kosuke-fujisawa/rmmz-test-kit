# rmmz-e2e-kit

RPG ツクール MZ(RMMZ)プロジェクト向けの NW.js 黒箱 E2E(ブラックボックスE2E)キットです。ゲーム内容(シナリオ・戦闘仕様)には依存しません。[negaboku](https://github.com/kosuke-fujisawa/negaboku)(`tools/mz-e2e/`)と [chiriyuku-monotachi](https://github.com/kosuke-fujisawa/chiriyuku-monotachi)(`tools/mz/e2e/`)の共通基盤として使うことを想定しています。

## 含まれるもの

- `src/launch-args/parse-launch-args.js` — CLI起動引数(`test&scenario=...&seed=...&savedir=...`)の解析。純粋関数
- `src/e2e/nwjs-driver.js` — NW.js版MZプロジェクトの黒箱E2E向けヘルパー(Selenium起動、キー入力、画面変化待ち)

## スコープ外(意図的に含めないもの)

- MZ開発専用ブートストラッププラグイン本体(例: `negaboku/game/js/plugins/NegabokuDevBootstrap.js`)。理由は2つ。(1) プラグインは配置ファイル名がプラグイン識別子を兼ねるため、プロジェクトごとに実ファイルを持つ必要がある。(2) このプラグインはMZ本体(NW.js)の中で全プレイヤーの起動時に毎回読み込まれるため、`require("rmmz-e2e-kit")`のような外部node_modules依存を持たせると、配布用パッケージに本キットが含まれない場合にゲームがクラッシュするリスクがある。そのため`parseLaunchArgs`相当の小さな純粋関数は、プラグイン側にそのまま複製して自己完結させる方針とする(このリポジトリがロジックの正本であり、変更する場合は両方に反映する)
- データ検証(validate)・意味差分(semantic-diff)等: `data/*.json` を静的に読むだけで、ブラウザもMZインストールも不要な別種のツール。依存関係(selenium-webdriver)と実行環境(ライセンス済みMZインストールが要る/不要)が異なるため、本キットには含めず、必要になった時点で別リポジトリとして切り出す方針とする(現時点では chiriyuku-monotachi の `tools/mz/validate`・`tools/mz/semantic-diff` にのみ存在する)

## 経緯

chiriyuku-monotachiで実機検証済みだったNW.js黒箱E2Eのパターン(入力タイミング、シーン遷移直後の入力欠落への対処等)を、negabokuのMVPスライス1実装時に移植した際、ロジックの大部分が完全に同一だったため、2プロジェクト目のコピーが発生した時点で切り出した。

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
```

## テスト

```bash
npm install
npm test
```

純粋関数(`parseLaunchArgs`、`findLaunchArgToken`)のみ自動テスト対象です。`e2e/nwjs-driver.js`側は実際のMZプロジェクトに対する黒箱E2Eの中で検証します(各利用プロジェクトの`tools/mz*/e2e/`を参照)。
