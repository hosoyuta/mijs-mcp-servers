# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## 重要: 言語設定

**このプロジェクトでは、必ず日本語で返答してください。**
すべてのコミュニケーション、説明、コメント、ドキュメントは日本語で行ってください。

## プロジェクト概要

MIJS MCP Servers は、MIJS（Made in Japan Software）コミュニティの2025年秋合宿向けの学習プロジェクトです。ClaudeなどのAIアシスタントと連携するMCP（Model Context Protocol）サーバーを作成することを目的としています。

プロジェクトの特徴:
- 公開リポジトリ（機密情報をコミットしない）
- 教育・プロトタイプ目的（セキュリティ実装は最小限）
- 複数の貢献者が独立したMCPサーバーを開発
- 各サーバーは `servers/` ディレクトリ配下に独立して配置

## 技術スタック

- **言語**: TypeScript 5.x
- **ランタイム**: Node.js 20 LTS
- **MCPフレームワーク**: @modelcontextprotocol/sdk
- **テスト**: Vitest
- **コード品質**: ESLint + Prettier
- **データストレージ**: JSONファイル（`data/` ディレクトリ）

詳細は `/docs/tech-stack.md` を参照してください。

## リポジトリ構造

```
mijs-mcp-servers/
├── servers/
│   ├── example-server/     # サンプルMCPサーバーテンプレート
│   └── your-server/        # 個別の貢献者サーバー
├── docs/
│   ├── tech-stack.md       # 技術スタック決定の詳細
│   ├── getting-started.md  # セットアップ手順
│   └── mcp-basics.md       # MCPプロトコルの基礎
└── shared/                 # 共通ユーティリティ（オプション）
```

## 共通コマンド

### 個別MCPサーバー向け

まず、特定のサーバーディレクトリに移動: `cd servers/<server-name>`

#### 開発
```bash
npm install              # 依存関係のインストール
npm run dev             # 開発モードで起動（tsx watchによるホットリロード）
npm run build           # TypeScriptをJavaScriptにコンパイル
npm start               # コンパイル済みサーバーを実行
```

#### テスト
```bash
npm test                # Vitestですべてのテストを実行
npm run test:watch      # ウォッチモードでテスト実行
npm run test:coverage   # カバレッジレポート付きでテスト実行
```

#### コード品質
```bash
npm run typecheck       # 型チェック（ファイル出力なし）
npm run lint            # ESLint実行
npm run format          # Prettierでコードフォーマット
```

### Gitワークフロー

```bash
# フィーチャーブランチ作成
git checkout -b username/server-name

# 通常の開発サイクル
git add .
git commit -m "説明的なメッセージ"
git push origin username/server-name

# mainにマージする前にレビュー用PRを作成
```

ブランチ命名規則: `username/server-name` （例: `hosoyuta/weather-server`）

## アーキテクチャパターン

### 推奨MCPサーバー構造

各MCPサーバーは以下の構造に従うことを推奨します:

```
servers/<server-name>/
├── src/
│   ├── index.ts           # MCPサーバーエントリーポイント
│   ├── tools/             # MCPツール実装
│   ├── resources/         # MCPリソース実装
│   ├── prompts/           # MCPプロンプトテンプレート
│   ├── types/             # TypeScript型定義
│   ├── api/               # 外部APIクライアント
│   ├── auth/              # 認証・トークン管理
│   ├── utils/             # ユーティリティ関数
│   └── config/            # 設定
├── tests/                 # テストファイル（*.test.ts）
├── data/                  # JSONデータストレージ（gitignore対象）
├── docs/                  # サーバー固有のドキュメント
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### MCPサーバーの主要コンポーネント

MCPサーバーは3つの主要コンポーネントを公開できます:
1. **ツール (Tools)**: Claudeがアクションを実行するために呼び出せる関数
2. **リソース (Resources)**: Claudeが読み取れるデータソース
3. **プロンプト (Prompts)**: 一般的なタスク用の定義済みプロンプトテンプレート

## REST API統合の注意事項

外部REST APIを統合する際の一般的なベストプラクティス:

1. **認証エラー CB_IL02などの対応**: このようなエラーは、リクエストJSONの形式が誤っていることを示します:
   - リクエストURLが正しいか検証
   - リクエストヘッダーを確認（Content-Type: application/jsonなど）
   - リクエストボディの構造がAPIドキュメントと一致するか検証
   - APIドキュメントを検索して正しいフォーマットを確認

2. **トークン管理**:
   - 環境変数（`.env` ファイル）から認証情報を読み込む
   - トークンをキャッシュして不要なAPI呼び出しを削減
   - 有効期限を追跡し、自動的に更新

3. **APIリトライロジック**:
   - 一時的なエラー（503メンテナンス、5xxサーバーエラー）でリトライ
   - 認証失敗（401）や不正なリクエスト（400）ではリトライしない
   - 指数バックオフを使用（例: 1秒、2秒、4秒）
   - タイムアウトを設定（例: 5秒）

## テストアプローチ

プロジェクトはTDD（テスト駆動開発）手法を推奨:

1. **テストを先に書く**: 正常、エラー、境界条件をカバーするテストケースを定義
2. **最小限のコードを実装**: テストを通過するのに十分なコードのみを書く
3. **リファクタリング**: テストを緑のまま保ちながらコードをクリーンアップ

テストケースの分類:
- 正常ケース: 基本機能
- エラーケース: 失敗シナリオ
- 境界ケース: エッジ条件

## 環境変数

各サーバーは `.env` ファイルを介して独自の環境変数を管理:

```bash
# .env ファイルの例
API_KEY=your_api_key_here
NODE_ENV=development
LOG_LEVEL=info
```

**重要**: `.env` ファイルはgitignoreされており、決してコミットしないでください。

## Claude Desktopとの統合

Claude DesktopでMCPサーバーをテストするには:

1. サーバーをビルド: `npm run build`
2. Claude Desktop設定ファイルを編集:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
3. サーバー設定を追加:
```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["/absolute/path/to/servers/server-name/dist/index.js"]
    }
  }
}
```
4. Claude Desktopを再起動

## 重要な制約

1. **機密データなし**: これは公開リポジトリです
   - APIキー、トークン、認証情報をコミットしない
   - シークレットには `.env` ファイルを使用（gitignore対象）
   - コードやコミットに個人情報を含めない

2. **教育目的**:
   - まず動作させることに焦点を当てる
   - 認証とセキュリティは最小限で可
   - ドキュメントは推奨されるが必須ではない

3. **独立したサーバー**:
   - `servers/` 配下の各サーバーは自己完結型
   - サーバー間に依存関係なし
   - 各サーバーは独自の `package.json` と `node_modules` を持つ

## ドキュメント

プロジェクト全体のドキュメント:
- `/docs/tech-stack.md`: 技術スタック決定と根拠の詳細
- `/docs/getting-started.md`: 新規貢献者向けのセットアップ手順
- `/docs/mcp-basics.md`: MCPプロトコルの基礎

各サーバーは独自の `README.md` に使用方法とドキュメントを記載してください。

## よくある問題

### REST APIリクエストエラー（CB_IL02など）
無効なリクエストを示すAPIエラーを受信した場合:
1. WebFetchまたは検索を使用して正しいAPIエンドポイント形式を確認
2. APIドキュメントに対してリクエストボディ構造を確認
3. ヘッダーを検証（特にContent-Type）
4. 認証トークンが有効で適切にフォーマットされていることを確認

### トークンキャッシング問題
トークンキャッシングが失敗する場合:
1. `data/` ディレクトリが存在することを確認
2. ファイルのアクセス権限を確認
3. キャッシュファイルを削除して強制的に再認証
4. 環境変数が正しく設定されていることを確認

### ビルド/型エラー
1. `npm run typecheck` を実行してすべての型エラーを表示
2. `@types/node` のバージョンがNode.jsのバージョンと一致することを確認
3. `tsconfig.json` のstrictモード設定を確認
4. 依存関係を再インストール: `rm -rf node_modules && npm install`

## 参考リンク

- [MCP公式ドキュメント](https://modelcontextprotocol.io/)
- [MCP仕様](https://spec.modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCPサーバー例](https://github.com/modelcontextprotocol/servers)
