🎉 Special Thanks To [ccusage](https://www.npmjs.com/package/ccusage) 🎉


# claude-usage-tracker-for-mac

Claude Codeの使用料金を可視化する Mac用のメニューバーアプリケーション

ローカルのClaude Codeの使用履歴ファイルを直接読み込みコストを計算する npm ライブラリの ccusage ( https://www.npmjs.com/package/ccusage ) を利用することで、Claude Codeの使用料金を可視化することができます。

```shell
$ npx ccusage@latest daily --json
{
  "daily": [
    {
      "date": "2025-06-01",
      "inputTokens": 599,
      "outputTokens": 45836,
      "cacheCreationTokens": 285449,
      "cacheReadTokens": 3475896,
      "totalTokens": 3807780,
      "totalCost": 14.012697750000006
    },
    {
      "date": "2025-05-29",
      "inputTokens": 323,
      "outputTokens": 10406,
      "cacheCreationTokens": 69519,
      "cacheReadTokens": 458588,
      "totalTokens": 538836,
      "totalCost": 0.55533165
    }
  ],
  "totals": {
    "inputTokens": 922,
    "outputTokens": 56242,
    "cacheCreationTokens": 354968,
    "cacheReadTokens": 3934484,
    "totalTokens": 4346616,
    "totalCost": 14.568029400000006
  }
}
```

TypeScript を使用して開発されており、Electronを使用してデスクトップアプリケーションとして実行されます。

## 利用技術

- TypeScript
- Electron
- ccusage ( https://www.npmjs.com/package/ccusage )
- Biome ( linting, formatting )

## 実装方針

- 最小限の機能を実装し、必要に応じて拡張
- ユーザーインターフェースはシンプルで直感的に
- メニューバーアプリケーションとしての操作性を重視
- MacOSのデザインガイドラインに従う
- ユーザーのプライバシーを尊重し、ローカルファイルのみを使用
