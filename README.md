# rmmz-test-kit

[![Test](https://github.com/kosuke-fujisawa/rmmz-test-kit/actions/workflows/test.yml/badge.svg)](https://github.com/kosuke-fujisawa/rmmz-test-kit/actions/workflows/test.yml)

RPG ツクール MZ(RMMZ)プロジェクト向けのテスト基盤です。ゲーム画面を実際に操作して起動・遷移を確認する「黒箱E2Eテスト」のためのヘルパー関数群を提供します。ゲーム内容(シナリオ・戦闘仕様)には依存しません。もともとは [negaboku](https://github.com/kosuke-fujisawa/negaboku)(`tools/mz-e2e/`)と [chiriyuku-monotachi](https://github.com/kosuke-fujisawa/chiriyuku-monotachi)(`tools/mz/e2e/`)の共通基盤として切り出したものですが、RPG ツクール MZ プロジェクト全般で利用できます。設計は姉妹リポジトリ [tyranoscript-test-kit](https://github.com/kosuke-fujisawa/tyranoscript-test-kit)(TyranoScript作品向け)に合わせています。

## 目次

- [前提条件](#前提条件)
- [対応プラットフォーム](#対応プラットフォーム)
- [含まれるもの・サブパス構成](#含まれるものサブパス構成)
- [スコープ外(意図的に含めないもの)](#スコープ外意図的に含めないもの)
- [使い方](#使い方)
- [テスト](#テスト)
- [ライセンス](#ライセンス)

## 前提条件

- Node.js 20 以上
- RPG ツクール MZ の実行環境(黒箱E2E機能を使う場合。ライセンス済みのMZ本体が必要です)
- macOS(黒箱E2E機能を使う場合。詳細は[対応プラットフォーム](#対応プラットフォーム)を参照)
- 起動引数パーサー(`rmmz-test-kit/launch-args`)のみを使う場合、上記のうちNode.js以外は不要です。

## 対応プラットフォーム

`./e2e`(`resolveChromedriverPath`)は現時点で **macOS のみ対応**です(RPG ツクール MZ が同梱する `nwjs-mac/chromedriver` の固定パスを前提にしています)。Windows/Linux 版 NW.js のパス解決は未実装です。`./launch-args` はプラットフォーム非依存の純粋関数です。

## 含まれるもの・サブパス構成

依存関係の異なる機能はサブパスで分離しています。「E2Eは要らないが起動引数パーサーだけ使いたい」ような場合に、`rmmz-test-kit/launch-args` は実行時に `selenium-webdriver` を読み込みません。

| サブパス | 内容 | 依存 |
|---|---|---|
| `rmmz-test-kit`(`.`) | 全機能をまとめて再エクスポート | `selenium-webdriver`(peer) |
| `rmmz-test-kit/e2e` | NW.js版MZプロジェクトの黒箱E2E向けヘルパー(Selenium起動、キー入力、画面変化待ち) | `selenium-webdriver`(peer) |
| `rmmz-test-kit/launch-args` | CLI起動引数(`test&scenario=...&seed=...&savedir=...`)の解析。純粋関数 | なし |

`selenium-webdriver` は `peerDependencies` です。利用側プロジェクトが自分の `package.json` に持つバージョンを使います(`tyranoscript-test-kit` が `@playwright/test` を peerDependencies にしているのと同じ設計)。ただし peer dependency の解決自体はサブパス単位ではなくパッケージ単位で行われるため、`package.json` では `peerDependenciesMeta` で `selenium-webdriver` を `optional: true` にしています。これにより `rmmz-test-kit/launch-args` だけを使う場合は `selenium-webdriver` のインストール自体も不要です。

将来データ検証(validate)・意味差分(semantic-diff)等を追加する場合も、別リポジトリへ分割せず `rmmz-test-kit/validate` のようなサブパスとしてこのリポジトリへ追加する方針です(現時点では chiriyuku-monotachi の `tools/mz/validate`・`tools/mz/semantic-diff` にのみ存在し、negaboku側で重複が未発生のためスコープ外)。

## スコープ外(意図的に含めないもの)

MZ開発専用ブートストラッププラグイン本体は含みません。理由は2つ。(1) プラグインは配置ファイル名がプラグイン識別子を兼ねるため、プロジェクトごとに実ファイルを持つ必要がある。(2) このプラグインはMZ本体(NW.js)の中で全プレイヤーの起動時に毎回読み込まれるため、`require("rmmz-test-kit")`のような外部node_modules依存を持たせると、配布用パッケージに本キットが含まれない場合にゲームがクラッシュするリスクがある。そのため`parseLaunchArgs`相当の小さな純粋関数は、プラグイン側にそのまま複製して自己完結させる方針とする(このリポジトリがロジックの正本であり、変更する場合は両方に反映する。利用例は[negaboku/game/js/plugins/NegabokuDevBootstrap.js](https://github.com/kosuke-fujisawa/negaboku/blob/main/game/js/plugins/NegabokuDevBootstrap.js)(private repo)を参照)

## 使い方

各プロジェクトの`package.json`から参照する。`selenium-webdriver`はpeerDependenciesのため、利用側でも別途インストールが必要。

```json
{
  "dependencies": {
    "rmmz-test-kit": "github:kosuke-fujisawa/rmmz-test-kit#main"
  },
  "devDependencies": {
    "selenium-webdriver": "^4.46.0"
  }
}
```

> **注意:** `#main` はブランチ名参照のため、`main` に新しいコミットが積まれると利用側の解決先も追従して変わります(内容が意図せず変わりうる)。再現性を重視する場合は、リリースタグ(例: `#v0.1.0`。ただし本リポジトリは現時点でリリースタグを発行していないため、これは形式の例示であり実在するタグではない)や、コミットハッシュを固定する `#<完全なコミットSHA>` 形式の参照を推奨する。

ローカルで並行開発する場合は相対パスの `file:` 依存も使える(`"rmmz-test-kit": "file:../rmmz-test-kit"`)。

```js
const { resolveChromedriverPath, createNwjsDriver, pressKey, pressUntilChanged, waitForFile } = require("rmmz-test-kit/e2e");
// 起動引数パーサーだけでよい場合は selenium-webdriver 不要:
// const { parseLaunchArgs } = require("rmmz-test-kit/launch-args");

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

このリポジトリ自体の開発(clone してのテスト実行)には、`package-lock.json` を用いた再現可能なインストールとして `npm ci` を使用する。

```bash
npm ci
npm test
```

`.npmrc` により `ignore-scripts=true` を設定しているため、依存パッケージの `install`/`postinstall` 等のライフサイクルスクリプトは実行されない。

純粋関数(`parseLaunchArgs`、`findLaunchArgToken`)のみ自動テスト対象で、GitHub Actions(`.github/workflows/test.yml`)でも実行しています。`e2e/nwjs-driver.js`側はライセンス済みのRPGツクールMZインストールが必要なため、実際のMZプロジェクトに対する黒箱E2Eの中で検証してください(各利用プロジェクトの`tools/mz*/e2e/`を参照)。

## ライセンス

[MIT](LICENSE)
