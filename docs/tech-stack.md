# プロジェクト技術スタック定義

## 🔧 生成情報
- **生成日**: 2025-10-29
- **生成ツール**: init-tech-stack コマンド
- **プロジェクトタイプ**: API/バックエンドサービス (MCPサーバー)
- **チーム規模**: 小規模チーム（2-5人）
- **開発期間**: プロトタイプ/MVP（1-2ヶ月）

## 🎯 プロジェクト要件サマリー
- **目的**: MIJS 2025年秋合宿での教育・学習プロジェクト
- **パフォーマンス**: 軽負荷（教育・検証目的、同時利用者10人以下）
- **セキュリティ**: 最低限（教育目的、個人情報なし）
- **技術スキル**: JavaScript/TypeScript経験豊富
- **学習コスト許容度**: 積極的に新技術を導入
- **デプロイ先**: ローカル環境のみ
- **予算**: コスト最小化（無料・オープンソースツール優先）

## 🚀 コア技術

### 言語・ランタイム
- **言語**: TypeScript 5.x
- **ランタイム**: Node.js 20 LTS
- **パッケージマネージャー**: npm (Node.js標準)

### 選択理由
- チームのJavaScript/TypeScript経験を最大限活用
- 型安全性によるバグの早期発見
- MCPサーバーの標準的な実装環境
- Node.js 20 LTSで長期サポート保証

## 🔌 MCPフレームワーク

### MCPサーバーSDK
- **SDK**: @modelcontextprotocol/sdk
- **バージョン**: 最新版（npm install時の安定版）

### 選択理由
- MCP (Model Context Protocol) の公式実装
- Anthropic公式サポート、最新仕様への追従
- TypeScript完全対応
- 豊富なサンプルコードとドキュメント

### MCPサーバーの基本構成
- **ツール (Tools)**: AIが呼び出せる機能
- **リソース (Resources)**: AIが参照できるデータ
- **プロンプト (Prompts)**: 定型的なプロンプトテンプレート

## 💾 データストレージ

### メインストレージ
✅ **JSONファイル**

### 選択理由
- 最もシンプルな実装
- セットアップ・環境構築不要
- プロトタイプに最適
- デバッグ・データ確認が容易
- ファイルシステムのみで完結
- 無料、追加依存なし

### データ設計方針
- `data/` ディレクトリ配下にJSON形式で保存
- データファイルは `.gitignore` でバージョン管理から除外
- スキーマはTypeScriptインターフェースで定義
- 書き込み時はアトミックな操作で整合性確保

## 🛠️ 開発環境

### TypeScript開発
- **実行**: tsx (TypeScript直接実行)
- **ビルド**: tsc (TypeScript公式コンパイラ)
- **型チェック**: TypeScript strict mode

### テスト
- **テストフレームワーク**: Vitest
- **テストランナー**: Vitest CLI
- **アサーション**: Vitest標準

### コード品質
- **リンター**: ESLint
- **フォーマッター**: Prettier
- **型チェック**: TypeScript

### 開発補助ツール
- **ホットリロード**: tsx watch / nodemon
- **デバッグ**: Node.js Inspector (VS Code統合)

### 選択理由
- tsx: TypeScript直接実行、高速な開発体験
- Vitest: 高速、TypeScript標準サポート、モダンなAPI
- ESLint + Prettier: コード品質の標準ツール

## 📁 推奨ディレクトリ構造

```
mijs-mcp-servers/
├── servers/
│   ├── example-server/          # サンプルMCPサーバー
│   │   ├── src/
│   │   │   ├── index.ts        # エントリーポイント
│   │   │   ├── tools/          # MCPツール実装
│   │   │   ├── resources/      # MCPリソース実装
│   │   │   ├── prompts/        # MCPプロンプト実装
│   │   │   ├── types/          # 型定義
│   │   │   └── utils/          # ユーティリティ
│   │   ├── data/               # JSONデータストレージ
│   │   │   └── *.json          # データファイル
│   │   ├── tests/              # テストファイル
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   └── your-server/            # あなたのMCPサーバー
│       └── ...
├── shared/                      # 共通ライブラリ (オプション)
│   └── utils/
├── docs/                        # ドキュメント
│   ├── tech-stack.md           # 本ファイル
│   ├── getting-started.md
│   └── mcp-basics.md
├── .gitignore
└── README.md
```

## 🔒 セキュリティ

### 基本方針
- **認証**: なし（教育目的のため省略）
- **認可**: なし（教育目的のため省略）
- **データ保護**: 個人情報を含めない
- **公開リポジトリ**: `.gitignore` で機密情報を除外

### .gitignore 必須項目
```
# データファイル
data/
*.json

# 環境変数
.env
.env.local

# Node.js
node_modules/
dist/
```

## 📊 品質基準

### コード品質
- **ESLint**: エラー0件
- **Prettier**: 全ファイルフォーマット済み
- **TypeScript**: strict mode、型エラー0件

### テスト基準
- **カバレッジ**: 設定なし（教育目的のため任意）
- **テスト実行**: 全テスト成功

### ドキュメント
- **README.md**: 各サーバーごとに作成
- **コメント**: 複雑なロジックには説明を記載

## 🚀 セットアップ手順

### 1. プロジェクトクローン
```bash
git clone https://github.com/hosoyuta/mijs-mcp-servers.git
cd mijs-mcp-servers
```

### 2. 新しいMCPサーバーの作成
```bash
# サーバーディレクトリ作成
mkdir -p servers/my-server
cd servers/my-server

# package.json初期化
npm init -y

# 必要な依存関係をインストール
npm install @modelcontextprotocol/sdk
npm install --save-dev typescript tsx vitest eslint prettier @types/node

# TypeScript設定
npx tsc --init
```

### 3. 基本的なpackage.json設定

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest",
    "lint": "eslint src",
    "format": "prettier --write src"
  }
}
```

### 4. 開発開始
```bash
# 開発モードで起動（ホットリロード）
npm run dev

# テスト実行
npm test

# ビルド
npm run build
```

## 🧪 開発ワークフロー

### 日常的な開発
1. ブランチ作成: `git checkout -b username/server-name`
2. コード実装: `npm run dev` でホットリロード開発
3. テスト作成: `npm test` でテスト実行
4. コード品質: `npm run lint && npm run format`
5. コミット: 動作確認後にコミット
6. Push & PR: リモートにプッシュしてPR作成

### MCPサーバーのテスト方法
1. **ローカル実行**: `npm run dev` でサーバー起動
2. **Claude連携**: Claude Desktopの設定ファイルにサーバーを登録
3. **動作確認**: Claude経由でツールを呼び出してテスト

### Claude Desktop連携設定例
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/servers/my-server/dist/index.js"]
    }
  }
}
```

## 📚 参考リソース

### MCP公式
- [MCP公式ドキュメント](https://modelcontextprotocol.io/)
- [MCP仕様](https://spec.modelcontextprotocol.io/)
- [MCP SDK (TypeScript)](https://github.com/modelcontextprotocol/typescript-sdk)

### サンプル実装
- [公式MCPサーバー例](https://github.com/modelcontextprotocol/servers)
- [参考リポジトリ](https://github.com/hosoyuta/mijs-mcp-servers)

### TypeScript/Node.js
- [TypeScript公式](https://www.typescriptlang.org/)
- [Node.js公式](https://nodejs.org/)

## 🔄 技術スタック更新

このファイルは必要に応じて更新してください：

### 更新が必要なケース
1. **新しいライブラリの追加**: 便利なツールを発見した場合
2. **要件の変更**: パフォーマンス・セキュリティ要件の変更
3. **学習の結果**: より良い技術選択を発見した場合
4. **チーム合意**: チームで別の技術を選択した場合

### 更新方法
- 直接 `docs/tech-stack.md` を編集
- または `/tsumiki:init-tech-stack` コマンドを再実行

## 🔄 更新履歴
- 2025-10-29: 初回生成 (init-tech-stack コマンドにより自動生成)
  - TypeScript + Node.js
  - @modelcontextprotocol/sdk
  - JSONファイルストレージ
  - Vitest + ESLint + Prettier
