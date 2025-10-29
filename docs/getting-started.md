# Getting Started

## MCPサーバーの作成手順

### 1. 環境準備

- Node.js (v18以上)
- TypeScript
- エディタ（VS Code推奨）

### 2. 新しいサーバーの作成

```bash
# servers配下に新しいディレクトリを作成
mkdir servers/your-server-name
cd servers/your-server-name

# package.jsonの作成
npm init -y

# 必要な依存関係をインストール
npm install --save-dev typescript @types/node ts-node
```

### 3. TypeScriptの設定

`tsconfig.json` を作成して、TypeScriptの設定を行います。

### 4. 実装

`src/index.ts` にMCPサーバーの実装を記述します。

### 5. テスト

ローカルでサーバーを起動してテストします。

```bash
npm run dev
```
