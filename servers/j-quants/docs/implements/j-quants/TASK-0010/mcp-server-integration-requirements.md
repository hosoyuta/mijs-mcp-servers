# TASK-0010: MCPサーバー本体実装・統合 - 要件定義書

**タスクID**: TASK-0010
**タスク名**: MCPサーバー本体実装・統合（MCP Server Integration）
**関連要件**: REQ-1002, REQ-1004
**依存タスク**: TASK-0003, TASK-0006, TASK-0007, TASK-0008, TASK-0009
**作成日**: 2025-10-30
**作成者**: Claude (Sonnet 4.5)

---

## 📋 1. 機能の概要

🔵 **信頼性レベル**: 青信号（Phase 1タスク定義、package.json、READMEから確定）

### 何をする機能か

MCPサーバーのエントリーポイント (`src/index.ts`) を実装し、4つのMCPツールを登録・公開し、AIアシスタント（Claude等）からツールを呼び出せるようにする統合機能です。

### 解決する問題

**As a**: AIアシスタント利用者
**I want to**: J-Quants APIの株価・財務データをClaudeから簡単に取得したい
**So that**: 日本株の分析や投資判断をAIアシスタントの助けを借りて効率的に行える

### 想定されるユーザー

- Claudeを使用して日本株情報を分析したい投資家
- J-Quants APIデータをAIで処理したい開発者
- MIJS 2025年秋合宿の参加者（教育・学習目的）

### システム内での位置づけ

```
Claude Desktop
    ↓ (MCP Protocol)
[MCPサーバー本体] ← このタスクで実装
    ├── get_listed_companies    (TASK-0006実装済み)
    ├── get_stock_price         (TASK-0007実装済み)
    ├── get_financial_statements (TASK-0008実装済み)
    └── get_company_info        (TASK-0009実装済み)
        ↓
    [J-Quants API Client] (TASK-0004実装済み)
        ↓
    J-Quants API
```

**参照したEARS要件**: REQ-1002 (MCPサーバー起動), REQ-1004 (ツール登録)
**参照した設計文書**: README.md (システム構成), tech-stack.md (技術スタック)

---

## 📊 2. 入力・出力の仕様

🔵 **信頼性レベル**: 青信号（@modelcontextprotocol/sdk仕様、Phase 1タスク定義から確定）

### MCPサーバーの入出力

**入力**:
- Claude Desktop経由のMCPリクエスト (JSON-RPC 2.0形式)
- ツール呼び出し要求（ツール名、パラメータ）

**出力**:
- MCPレスポンス (JSON-RPC 2.0形式)
- ツール実行結果（JSON形式）
- エラーメッセージ（日本語、ユーザーフレンドリー）

### ツール登録定義

各ツールは以下の情報を登録：

```typescript
interface ToolDefinition {
  name: string;           // 例: "get_listed_companies"
  description: string;     // 日本語説明
  inputSchema: JSONSchema; // JSON Schema形式
}
```

#### 登録するツール（4件）

1. **get_listed_companies**
   - name: `"get_listed_companies"`
   - description: `"J-Quants APIから上場銘柄一覧を取得します"`
   - inputSchema: { market?: string, sector?: string }

2. **get_stock_price**
   - name: `"get_stock_price"`
   - description: `"指定銘柄の日次株価データを取得します"`
   - inputSchema: { code: string (required), from_date?: string, to_date?: string }

3. **get_financial_statements**
   - name: `"get_financial_statements"`
   - description: `"指定銘柄の財務諸表を取得します"`
   - inputSchema: { code: string (required), statement_type?: string }

4. **get_company_info**
   - name: `"get_company_info"`
   - description: `"指定銘柄の企業情報と最新株価を取得します"`
   - inputSchema: { code: string (required) }

### 環境変数

**入力**:
- `J_QUANTS_REFRESH_TOKEN`: J-Quants APIリフレッシュトークン（必須）
- `NODE_ENV`: development | production（オプション）
- `LOG_LEVEL`: error | warn | info | debug（オプション）

**参照したEARS要件**: REQ-1002 (環境変数必須チェック)
**参照した設計文書**: README.md (環境変数設定), package.json (npm scripts)

---

## 🛡️ 3. 制約条件

🔵 **信頼性レベル**: 青信号（Phase 1タスク定義、tech-stack.mdから確定）

### パフォーマンス要件

- **起動時間**: 5秒以内にMCPサーバーが起動完了
- **レスポンス時間**: ツール実行レスポンスが5秒以内
- **メモリ使用量**: 500MB以下

### セキュリティ要件

- **環境変数保護**: `.env`ファイルを`.gitignore`で除外
- **トークン管理**: TokenManagerによる認証情報の適切な管理
- **エラーメッセージ**: 内部実装の詳細を漏洩しない

### 互換性要件

- **@modelcontextprotocol/sdk**: バージョン 1.0.4以上
- **Node.js**: 20.0.0以上（LTS）
- **TypeScript**: 5.6.3以上（strict mode）

### アーキテクチャ制約

- **ツール分離**: 各ツール実装は独立したモジュール (`src/tools/*.ts`)
- **依存性注入**: ツール関数はクライアントを外部注入可能
- **エラーハンドリング**: uncaughtException, unhandledRejectionをキャッチ

### データベース制約

- **トークンキャッシュ**: `data/token.json` に保存（JSONファイル）
- **アトミック書き込み**: キャッシュ更新時の整合性確保

### API制約

- **MCP Protocol**: JSON-RPC 2.0準拠
- **@modelcontextprotocol/sdk API**: Server, StdioServerTransportを使用

**参照したEARS要件**: REQ-1002 (起動要件), NFR-001 (パフォーマンス), NFR-101 (セキュリティ)
**参照した設計文書**: tech-stack.md (技術スタック), package.json (依存関係)

---

## 📝 4. 想定される使用例

🔵 **信頼性レベル**: 青信号（Phase 1タスク定義、READMEから確定）

### 基本的な使用パターン

#### パターン1: サーバー起動（正常系）

**条件**:
- `.env`ファイルに`J_QUANTS_REFRESH_TOKEN`が設定済み
- `npm run dev`または`npm start`を実行

**期待される動作**:
1. TokenManager初期化成功
2. IDトークン取得成功（キャッシュまたはAPI）
3. 4つのツールが登録される
4. MCPサーバーが起動完了
5. 起動完了メッセージがログ出力

#### パターン2: Claude経由でツール実行（正常系）

**条件**:
- MCPサーバーが起動済み
- Claude Desktopがサーバーに接続済み
- ユーザーが「東証プライム市場の銘柄一覧を取得してください」と入力

**期待される動作**:
1. Claudeが`get_listed_companies`ツールを選択
2. パラメータ`{ market: "Prime" }`でツール呼び出し
3. MCPサーバーがツール関数を実行
4. 銘柄一覧データをJSON形式で返却
5. Claudeがユーザーに結果を表示

#### パターン3: エラーケース（環境変数未設定）

**条件**:
- `.env`ファイルが存在しない、または`J_QUANTS_REFRESH_TOKEN`が未設定
- `npm start`を実行

**期待される動作**:
1. TokenManager初期化時にエラー検出
2. エラーログ出力: "環境変数 J_QUANTS_REFRESH_TOKEN を設定してください"
3. プロセスが正常終了（exit code: 1）

#### パターン4: ツール実行エラー（不正なパラメータ）

**条件**:
- Claudeが`get_stock_price`を呼び出し
- パラメータ`{ code: "123" }`（3桁、4桁必須）

**期待される動作**:
1. ツール関数がValidationErrorをスロー
2. MCPサーバーがエラーをキャッチ
3. ユーザーフレンドリーなエラーメッセージを返却: "銘柄コードは4桁の数字である必要があります"
4. Claudeがユーザーにエラーを表示

### エッジケース

#### エッジ1: 起動時認証失敗

**条件**: リフレッシュトークンが無効または期限切れ

**期待される動作**:
- エラーログ出力: "J-Quants API認証に失敗しました"
- プロセス終了

#### エッジ2: ツール実行中の予期しないエラー

**条件**: ツール実装内で予期しない例外が発生

**期待される動作**:
- エラーをキャッチ
- エラーログ出力（詳細情報）
- ユーザーには簡潔なエラーメッセージ: "予期しないエラーが発生しました"

### データフロー

```
[Claude Desktop]
    ↓ MCP Request (JSON-RPC)
[src/index.ts] ← MCPサーバー本体
    ├─ ツール呼び出し検証
    ├─ パラメータ解析
    └─ ツール関数実行
        ↓
[src/tools/*.ts] ← ツール実装
    ├─ バリデーション
    ├─ APIクライアント呼び出し
    └─ データ返却
        ↓
[src/index.ts]
    ├─ 結果を JSON 形式に整形
    └─ MCP Response 返却
        ↓
[Claude Desktop]
```

**参照したEARS要件**: REQ-1002 (起動フロー), REQ-1004 (ツール実行), EDGE-001 (エラーケース)
**参照した設計文書**: README.md (使用例), tech-stack.md (データフロー)

---

## 🔗 5. EARS要件・設計文書との対応関係

### 参照したユーザストーリー

- **ストーリー1**: AIアシスタント利用者が日本株情報を効率的に取得したい
- **ストーリー2**: 開発者がJ-Quants APIデータをAIで処理したい

### 参照した機能要件

- **REQ-1002**: MCPサーバーが起動し、正常に動作すること
- **REQ-1004**: 4つのMCPツールが正しく登録され、呼び出し可能であること

### 参照した非機能要件

- **NFR-001**: レスポンス時間5秒以内
- **NFR-101**: 環境変数による認証情報管理
- **NFR-201**: TypeScript strict mode準拠

### 参照したEdgeケース

- **EDGE-001**: 環境変数未設定時の適切なエラーハンドリング
- **EDGE-002**: 起動時認証失敗の処理
- **EDGE-003**: ツール実行時の予期しないエラー処理

### 参照した受け入れ基準

- MCPサーバーが5秒以内に起動完了すること
- 4つのツールすべてが登録されていること
- 各ツールが正常に実行できること
- エラーメッセージが日本語で分かりやすいこと

### 参照した設計文書

#### アーキテクチャ
- **README.md**: システム構成、プロジェクト構造

#### データフロー
- **tech-stack.md**: MCP Protocol通信フロー

#### 型定義
- **package.json**: 依存関係、npm scripts
- **@modelcontextprotocol/sdk**: Server, StdioServerTransport型定義

#### API仕様
- **MCP Protocol**: JSON-RPC 2.0形式
- **@modelcontextprotocol/sdk**: setRequestHandler API

---

## ✅ 要件の明確性チェック

### 要件の曖昧さ

✅ **なし**
- MCPサーバーの起動フローが明確
- ツール登録方法が具体的
- エラーハンドリングパターンが明確

### 入出力定義

✅ **完全**
- MCP Protocol (JSON-RPC 2.0形式)
- 4つのツール定義（name, description, inputSchema）
- 環境変数の定義
- エラーレスポンスの形式

### 制約条件

✅ **明確**
- パフォーマンス要件（起動5秒以内、レスポンス5秒以内）
- 技術スタック (@modelcontextprotocol/sdk v1.0.4+, Node.js 20+)
- アーキテクチャ制約（ツール分離、依存性注入）

### 実装可能性

✅ **確実**
- 依存ライブラリが明確 (@modelcontextprotocol/sdk)
- 実装パターンが明確（Server, StdioServerTransport使用）
- テスト戦略が明確（統合テスト）
- すべての依存タスク（TASK-0003~0009）が完了済み

---

## 📊 品質判定: ✅ 高品質

**判定結果**:
- 要件の曖昧さ: ✅ なし
- 入出力定義: ✅ 完全
- 制約条件: ✅ 明確
- 実装可能性: ✅ 確実

**信頼性レベル分布**:
- 🔵 青信号: 100% （すべての要件がPhase 1タスク定義、設計文書、ツール実装から確定）
- 🟡 黄信号: 0%
- 🔴 赤信号: 0%

**要件の完全性**: すべての依存タスクが完了し、MCPサーバー統合に必要な情報が揃っている

---

**作成者**: Claude (Sonnet 4.5)
**最終更新**: 2025-10-30
**ステータス**: ✅ 要件定義完了（次フェーズ: テストケース洗い出し）
