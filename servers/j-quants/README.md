# J-Quants MCP Server

J-Quants APIを通じて日本株の株価・財務情報を取得し、Claude等のAIアシスタントに提供するMCPサーバーです。

## 概要

このMCPサーバーは、[J-Quants API](https://jpx.gitbook.io/j-quants-ja)と連携し、以下の機能を提供します：

- 📊 **上場銘柄一覧取得**: 市場区分・業種で絞り込んだ銘柄一覧
- 📈 **株価データ取得**: 日次株価データ（始値・高値・安値・終値・出来高）
- 💰 **財務諸表取得**: 貸借対照表、損益計算書、キャッシュフロー計算書
- 🏢 **企業情報取得**: 企業の詳細情報と最新株価

## 技術スタック

- **言語**: TypeScript 5.x
- **ランタイム**: Node.js 20 LTS
- **MCPフレームワーク**: @modelcontextprotocol/sdk
- **テスト**: Vitest
- **コード品質**: ESLint + Prettier

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`を`.env`にコピーし、J-Quants APIのリフレッシュトークンを設定します：

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```bash
J_QUANTS_REFRESH_TOKEN=your_refresh_token_here
NODE_ENV=development
LOG_LEVEL=info
```

**リフレッシュトークンの取得方法**:
1. [J-Quants API](https://jpx-jquants.com/)にサインアップ（無料プラン可）
2. マイページからリフレッシュトークンを取得
3. `.env`ファイルに設定

### 3. ビルド

```bash
npm run build
```

## 開発

### 開発モードで起動

```bash
npm run dev
```

### テスト実行

```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジ付き
npm run test:coverage
```

### コード品質チェック

```bash
# 型チェック
npm run typecheck

# Lint
npm run lint

# フォーマット
npm run format
```

## Claude Desktopとの統合

1. Claude Desktopの設定ファイルを開く：
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. 以下の設定を追加：

```json
{
  "mcpServers": {
    "j-quants": {
      "command": "node",
      "args": [
        "/path/to/servers/j-quants/dist/index.js"
      ]
    }
  }
}
```

3. Claude Desktopを再起動

## MCPツール

### 1. get_listed_companies

上場銘柄一覧を取得します。

**パラメータ**:
- `market` (optional): 市場区分（例: "Prime", "Standard", "Growth"）
- `sector` (optional): 業種コード

**使用例** (Claude経由):
```
東証プライム市場の銘柄一覧を取得してください
```

### 2. get_stock_price

指定銘柄の株価データを取得します。

**パラメータ**:
- `code` (required): 銘柄コード（4桁、例: "7203"）
- `from_date` (optional): 開始日（YYYY-MM-DD形式）
- `to_date` (optional): 終了日（YYYY-MM-DD形式）

**使用例** (Claude経由):
```
トヨタ自動車（7203）の2023年10月の株価を教えてください
```

### 3. get_financial_statements

指定銘柄の財務諸表を取得します。

**パラメータ**:
- `code` (required): 銘柄コード（4桁）
- `statement_type` (optional): 財務諸表種別（"consolidated"または"non_consolidated"）

**使用例** (Claude経由):
```
ソニーグループ（6758）の最新の財務諸表を取得してください
```

### 4. get_company_info

指定銘柄の企業情報を取得します。

**パラメータ**:
- `code` (required): 銘柄コード（4桁）

**使用例** (Claude経由):
```
任天堂（7974）の企業情報を教えてください
```

## プロジェクト構造

```
servers/j-quants/
├── src/
│   ├── index.ts               # MCPサーバーエントリーポイント
│   ├── types/                 # TypeScript型定義
│   ├── tools/                 # MCPツール実装
│   ├── api/                   # J-Quants APIクライアント
│   ├── auth/                  # 認証・トークン管理
│   ├── utils/                 # ユーティリティ
│   └── config/                # 設定
├── tests/                     # テストファイル
├── data/                      # トークンキャッシュ
├── logs/                      # ログファイル
├── docs/                      # ドキュメント
├── package.json
├── tsconfig.json
└── README.md
```

## トラブルシューティング

### 認証エラー

**エラー**: "環境変数 J_QUANTS_REFRESH_TOKEN を設定してください"

**解決方法**:
1. `.env`ファイルが作成されているか確認
2. `J_QUANTS_REFRESH_TOKEN`が正しく設定されているか確認
3. J-Quants APIのリフレッシュトークンが有効か確認

### APIタイムアウト

**エラー**: "APIの応答がタイムアウトしました（5秒）"

**解決方法**:
1. ネットワーク接続を確認
2. J-Quants APIのステータスを確認: https://jpx-jquants.com/
3. しばらく時間をおいて再試行

### トークンキャッシュエラー

**エラー**: "トークンキャッシュファイルの読み込みに失敗しました"

**解決方法**:
1. `data/`ディレクトリが存在するか確認
2. `data/token.json`を削除して再認証を試行
3. ファイルの権限を確認

## ライセンス

MIT

## 関連リンク

- [J-Quants API ドキュメント](https://jpx.gitbook.io/j-quants-ja)
- [MCP公式ドキュメント](https://modelcontextprotocol.io/)
- [プロジェクト技術スタック](../../docs/tech-stack.md)
- [設計文書](./docs/design/)
- [要件定義書](./docs/spec/)
