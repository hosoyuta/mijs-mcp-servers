# MIJS MCP Servers

## 概要

このプロジェクトは、MIJS（Made in Japan Software）コミュニティのニューテクノロジー委員会における2025年秋合宿用のプロジェクトです。

MCP（Model Context Protocol）サーバーの実装を通じて、新しい技術を学習・体験することを目的としています。

## プロジェクトの目的

- MCPサーバーの作成方法を学ぶ
- 生成AI（Claude Code等）を活用した開発体験
- 教育・調査目的での技術検証
- まずは動作するものを作ることを優先（認証などの細かな実装は後回し）

## プロジェクト構成

```
mijs-mcp-servers/
├── README.md
├── servers/
│   ├── weather-server/        # 天気情報MCPサーバー（例）
│   │   ├── README.md          # サーバーの説明
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── index.ts
│   ├── task-manager/          # タスク管理MCPサーバー（例）
│   │   └── ...
│   └── your-server/           # あなたのMCPサーバー
│       └── ...
├── shared/                    # 共通ライブラリ（オプション）
│   └── utils/
└── docs/                      # ドキュメント
    ├── getting-started.md
    └── mcp-basics.md
```

## 開発ワークフロー

### 1. 新しいMCPサーバーを作成する

```bash
# mainブランチから作業ブランチを作成
git checkout -b username/server-name

# servers以下に新しいサーバーディレクトリを作成
mkdir servers/your-server-name
cd servers/your-server-name

# 開発を進める
```

### 2. 完成したらPull Requestを作成

- 他の参加者がレビュー
- 問題なければ `main` にマージ

### 3. ブランチ命名規則

- 形式: `username/server-name`
- 例: `hosoyuta/weather-server`, `tanaka/task-manager`

## 注意事項

- このリポジトリは公開されています
- 個人情報やセンシティブな情報は含めないでください
- 教育目的のプロジェクトであり、本番環境での使用は想定していません

## 参照

本プロジェクトは以下のリポジトリを参照しています：
- https://github.com/hosoyuta/mijs-mcp-servers

## ライセンス

MIT License

## コントリビューション

MIJS コミュニティメンバーによる貢献を歓迎します。
