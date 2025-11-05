# Phase 1: 基盤構築 - 詳細タスク計画書

## Phase 1 概要

**フェーズ名**: Phase 1: 基盤構築（Foundation）
**期間**: 10日間（80時間）
**目標**: J-Quants MCP Serverの基盤を構築し、4つのコアMCPツールを実装・動作確認する
**タスク数**: 10タスク（TASK-0001～TASK-0010）

### Phase 1 成果物

1. ✅ TypeScript + Node.js プロジェクト環境構築完了
2. ✅ MCP SDK統合完了
3. ✅ 認証・トークン管理機構完成
4. ✅ J-Quants APIクライアント基礎実装完成
5. ✅ エラーハンドリング・バリデーション基盤完成
6. ✅ 4つのコアMCPツール実装完成
   - get_listed_companies
   - get_stock_price
   - get_financial_statements
   - get_company_info
7. ✅ 統合テスト実施（4つのツール動作確認）
8. ✅ Phase 1 ドキュメント完成

### Phase 1 関連要件

**認証・接続要件**: REQ-001, REQ-002, REQ-003, REQ-004
**技術要件**: REQ-1001, REQ-1002, REQ-1003, REQ-1004
**セキュリティ要件**: REQ-1101, REQ-1102
**コアツール要件**: REQ-101, REQ-102, REQ-201, REQ-202, REQ-203, REQ-301, REQ-302, REQ-401, REQ-402
**エラーハンドリング基本**: REQ-601, REQ-602, REQ-701

---

## 週単位実施計画

### 第1週：環境構築・認証・基盤実装（Day 1-5）

| 日付 | タスクID | タスク名 | 時間 | 種別 | 概要 |
|------|---------|---------|------|------|------|
| Day 1 | TASK-0001 | プロジェクト初期セットアップ | 8h | DIRECT | package.json, tsconfig.json, 基本的な依存関係インストール |
| Day 2 | TASK-0002 | TypeScript型定義作成 | 8h | DIRECT | src/types/index.ts, 50+ の型・インターフェース定義 |
| Day 3 | TASK-0003 | 認証・トークン管理実装 | 8h | TDD | src/auth/token-manager.ts, トークン取得・キャッシュ機構 |
| Day 4 | TASK-0004 | J-Quants APIクライアント基礎 | 8h | TDD | src/api/j-quants-client.ts, 基本構造・認証メソッド |
| Day 5 | TASK-0005 | エラーハンドリング・バリデーション | 8h | TDD | 3つのユーティリティモジュール |

**第1週成果**: 認証機構完成、APIクライアント骨組み完成、ユーティリティ基盤完成

### 第2週：MCPツール実装・統合（Day 6-10）

| 日付 | タスクID | タスク名 | 時間 | 種別 | 概要 |
|------|---------|---------|------|------|------|
| Day 6 | TASK-0006 | MCPツール1: get_listed_companies | 8h | TDD | 上場銘柄一覧取得ツール |
| Day 7 | TASK-0007 | MCPツール2: get_stock_price | 8h | TDD | 株価データ取得ツール |
| Day 8 | TASK-0008 | MCPツール3: get_financial_statements | 8h | TDD | 財務諸表取得ツール |
| Day 9 | TASK-0009 | MCPツール4: get_company_info | 8h | TDD | 企業情報取得ツール |
| Day 10 | TASK-0010 | MCPサーバー本体実装・統合 | 8h | TDD | src/index.ts, ツール登録・MCPサーバー起動 |

**第2週成果**: 4つのコアツール実装完成、MCPサーバー統合完成、動作確認完成

---

## 日別詳細タスク定義

### Day 1: TASK-0001: プロジェクト初期セットアップ

**[x] TASK-0001: プロジェクト初期セットアップ** ✅ **完了** (実装済み)

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0001 |
| **タスク名** | プロジェクト初期セットアップ（Project Initialization） |
| **推定時間** | 8時間 |
| **種別** | DIRECT |
| **関連要件** | REQ-1001, REQ-1002, REQ-1003, REQ-1004, REQ-1101, REQ-1102 |
| **依存タスク** | なし（開始タスク） |

#### 説明

J-Quants MCP Serverプロジェクトの初期セットアップを実施します。TypeScript 5.x + Node.js 20 LTS の開発環境構築、必要な依存関係のインストール、プロジェクト設定ファイルの作成を行います。

#### 実装内容

1. **package.json の作成**
   - プロジェクト基本情報（name, version, description）
   - 依存関係の定義：
     - コア: `@modelcontextprotocol/sdk`, `typescript`, `node-fetch` または `axios`
     - 開発: `typescript`, `@types/node`, `vitest`, `@vitest/ui`, `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `prettier`, `dotenv`
   - npm scripts: `build`, `dev`, `start`, `lint`, `format`, `test`

2. **tsconfig.json の作成**
   - `strict: true` 設定（NFR-201）
   - `target: ES2020`, `module: ESNext`
   - `resolveJsonModule: true`, `esModuleInterop: true`
   - `outDir: ./dist`, `rootDir: ./src`
   - `skipLibCheck: true`

3. **.env.example の作成**
   - `J_QUANTS_REFRESH_TOKEN=your_refresh_token_here`
   - `NODE_ENV=development|production`
   - `LOG_LEVEL=info|debug|error`

4. **.gitignore の作成**
   - `.env`, `data/`, `logs/`, `dist/`, `node_modules/`, `.DS_Store`

5. **ディレクトリ構造の初期化**
   ```
   servers/j-quants/
   ├── src/
   │   ├── types/
   │   ├── tools/
   │   ├── api/
   │   ├── auth/
   │   ├── utils/
   │   ├── config/
   │   └── index.ts
   ├── tests/
   ├── data/
   ├── logs/
   ├── docs/
   ├── .env
   ├── .env.example
   ├── .gitignore
   ├── package.json
   ├── tsconfig.json
   └── README.md
   ```

6. **基本的なREADME.md の作成**
   - プロジェクト概要
   - インストール手順
   - セットアップ手順（環境変数設定）
   - 実行方法

#### 完了基準

- [ ] package.json が作成でき、`npm install` で全依存関係が正常にインストールされる
- [ ] tsconfig.json が正常に読み込まれ、TypeScript コンパイラが起動可能
- [ ] すべてのディレクトリが作成されている
- [ ] .env.example が正しい形式で存在
- [ ] .gitignore が .env, dist/, logs/, data/ を含んでいる
- [ ] README.md にセットアップ手順が記載されている

#### テスト要件（確認項目）

- 依存関係インストール完了: `npm install` 実行後、node_modules/ に全パッケージが存在
- TypeScript コンパイル確認: `npx tsc --version` で TypeScript 5.x 以上が表示される
- ESLint・Prettier 動作確認: `npx eslint --version`, `npx prettier --version` で動作確認

#### 作成・修正ファイル

```
servers/j-quants/
├── package.json (新規)
├── tsconfig.json (新規)
├── .env.example (新規)
├── .gitignore (新規)
├── README.md (新規)
├── src/ (ディレクトリ新規)
│   ├── types/ (ディレクトリ新規)
│   ├── tools/ (ディレクトリ新規)
│   ├── api/ (ディレクトリ新規)
│   ├── auth/ (ディレクトリ新規)
│   ├── utils/ (ディレクトリ新規)
│   ├── config/ (ディレクトリ新規)
├── tests/ (ディレクトリ新規)
├── data/ (ディレクトリ新規)
└── logs/ (ディレクトリ新規)
```

---

### Day 2: TASK-0002: TypeScript型定義作成

**[x] TASK-0002: TypeScript型定義作成** ✅ **完了** (実装済み)

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0002 |
| **タスク名** | TypeScript型定義作成（Type Definitions） |
| **推定時間** | 8時間 |
| **種別** | DIRECT |
| **関連要件** | REQ-102, REQ-202, REQ-302, REQ-402 |
| **依存タスク** | TASK-0001 |

#### 説明

J-Quants MCP Serverで使用するすべてのTypeScript型・インターフェース・列挙型を `src/types/index.ts` に定義します。API レスポンス、ツール入出力、内部処理用型を網羅的に定義し、型安全性を確保します。

#### 実装内容

1. **インターフェース定義（20+種類）**
   - `Company`: 銘柄情報（code, name, market, sector）
   - `StockPrice`: 株価データ（code, date, open, high, low, close, volume）
   - `FinancialStatements`: 財務諸表（code, fiscal_year, balance_sheet, profit_loss, cash_flow）
   - `BalanceSheet`: 貸借対照表
   - `ProfitLoss`: 損益計算書
   - `CashFlow`: キャッシュフロー計算書
   - `CompanyInfo`: 企業情報（code, name, market, sector, latest_price）
   - `TokenCacheData`: トークンキャッシュ（token, expires_at, issued_at）
   - `APIResponse`: API通用レスポンス型
   - `APIError`: APIエラー型
   - `ValidationError`: バリデーションエラー型

2. **列挙型定義**
   - `Market`: 市場区分（TOPIX, TSE_MOTHERS, JASDAQ_STANDARD, JASDAQ_GROWTH）
   - `Sector`: 業種コード（全業種対応）
   - `StatementType`: 財務諸表種別（CONSOLIDATED, NON_CONSOLIDATED）
   - `LogLevel`: ログレベル（ERROR, WARN, INFO, DEBUG）
   - `ErrorCode`: エラーコード（INVALID_CODE, INVALID_DATE, API_ERROR等）

3. **定数定義**
   - API エンドポイント定数
   - エラーメッセージ定数（日本語）
   - バリデーションルール定数
   - リトライ設定定数（MAX_RETRIES: 3, RETRY_DELAY: 1000）
   - タイムアウト設定（REQUEST_TIMEOUT: 5000）

4. **ユーティリティ型**
   - `ToolParameter`: MCPツールパラメータ基本型
   - `ToolResult`: MCPツール戻り値型
   - `AsyncFunction`: 非同期関数型

#### 完了基準

- [ ] `src/types/index.ts` が 50+ の型定義を含む
- [ ] すべてのインターフェースが `export interface` で定義されている
- [ ] 列挙型が `export enum` で定義されている
- [ ] 定数が `export const` で定義されている
- [ ] すべての型がコメント付きで説明されている（JSDoc形式）
- [ ] TypeScript strict mode でコンパイルエラーなし

#### テスト要件（確認項目）

- TypeScript コンパイル確認: `npx tsc --noEmit` で型エラーなし
- 型の正確性: 各インターフェースが適切に定義され、プロパティが正確
- 列挙型の完全性: 市場区分、業種コードが必要な値すべてを含む

#### 作成・修正ファイル

```
servers/j-quants/
└── src/
    └── types/
        └── index.ts (新規作成、50+ 型定義)
```

---

### Day 3: TASK-0003: 認証・トークン管理実装

**[x] TASK-0003: 認証・トークン管理実装** ✅ **完了** (TDD開発完了)

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0003 |
| **タスク名** | 認証・トークン管理実装（Authentication & Token Management） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | REQ-001, REQ-002, REQ-003, REQ-004, REQ-604 |
| **依存タスク** | TASK-0002 |

#### 説明

J-Quants APIへの認証機能とトークン管理を実装します。リフレッシュトークンから IDトークンを取得し、有効期限を管理し、期限切れ時に自動的に再取得する機構を構築します。取得したトークンは JSON ファイルにキャッシュします。

#### 実装内容

1. **TokenManager クラス実装 (src/auth/token-manager.ts)**

   主要メソッド:
   - `constructor(refreshToken: string, cacheDir: string = 'data')`
   - `getIdToken(): Promise<string>` - IDトークン取得（キャッシュ優先、期限切れで再取得）
   - `cacheToken(token: string, expiresAt: number): void` - トークンキャッシュ保存
   - `loadCachedToken(): TokenCacheData | null` - キャッシュ読み込み
   - `isTokenExpired(expiresAt: number): boolean` - 有効期限チェック（余裕5分）
   - `refreshToken(): Promise<string>` - トークン再取得

2. **認証フロー実装**
   - リフレッシュトークンから IDトークン取得（POST /token/auth_user）
   - レスポンスから IDトークン抽出（response.id_token）
   - 有効期限計算（issued_at + expires_in - 300秒余裕）

3. **トークンキャッシュ機構 (data/token.json)**
   ```json
   {
     "token": "eyJh...",
     "issued_at": 1699000000000,
     "expires_at": 1699003600000
   }
   ```

4. **エラーハンドリング**
   - 環境変数未設定エラー → "環境変数 J_QUANTS_REFRESH_TOKEN を設定してください"
   - 認証失敗エラー → 再取得試行
   - ネットワークエラー → REQ-601 に従ったリトライ処理

5. **環境変数読み込み (src/config/constants.ts)**
   - `J_QUANTS_REFRESH_TOKEN` から refresh token を読み込み
   - `NODE_ENV`, `LOG_LEVEL` の読み込み

#### TDD テスト要件

**Red フェーズ**:
- IDトークン取得テスト（キャッシュなし）→ FAIL
- トークンキャッシュ読み込みテスト → FAIL
- キャッシュ有効期限切れテスト → FAIL
- トークン自動再取得テスト → FAIL

**Green フェーズ**:
- 実装によってすべてのテストをPASS

**Refactor フェーズ**:
- コード可読性改善
- エラーハンドリング統一

#### テストケース詳細

```typescript
// test/auth/token-manager.test.ts の要件テストケース

1. getIdToken() - キャッシュなし時
   - リフレッシュトークンでJ-Quants APIを呼び出し
   - IDトークン取得
   - data/token.json に保存
   ✓ 返却されたトークンが正しい形式

2. getIdToken() - キャッシュあり・有効時
   - キャッシュから直接読み込み
   - API呼び出しなし
   ✓ キャッシュのトークンが返却される

3. isTokenExpired() - 有効期限判定
   - 現在時刻 < 有効期限 - 300秒 → false
   - 現在時刻 >= 有効期限 - 300秒 → true
   ✓ 判定が正確

4. refreshToken() - 自動再取得
   - 有効期限切れのトークン検出
   - 新しいトークン取得
   - キャッシュ更新
   ✓ 新しいトークンが返却される

5. エラーハンドリング
   - 環境変数未設定 → エラーメッセージ返却
   - API呼び出し失敗 → 例外スロー
```

#### 完了基準

- [ ] `src/auth/token-manager.ts` が完成し、5つの主要メソッドが実装されている
- [ ] `src/config/constants.ts` が環境変数読み込みを実装
- [ ] `data/token.json` にトークンキャッシュが正常に保存・読み込み可能
- [ ] 有効期限チェックが 300秒の余裕を含めて正確
- [ ] すべてのテストケース（PASS 条件）がパスしている
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   ├── auth/
│   │   └── token-manager.ts (新規)
│   └── config/
│       └── constants.ts (新規)
├── tests/
│   └── auth/
│       └── token-manager.test.ts (新規)
└── data/
    └── token.json (実行時生成)
```

---

### Day 4: TASK-0004: J-Quants APIクライアント基礎

**[x] TASK-0004: J-Quants APIクライアント基礎** ✅ **完了** (TDD開発完了)

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0004 |
| **タスク名** | J-Quants APIクライアント基礎（J-Quants Client Foundation） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | REQ-001, REQ-002, REQ-003, REQ-004, REQ-601, REQ-602, REQ-603 |
| **依存タスク** | TASK-0003 |

#### 説明

J-Quants APIとの通信を担当する `JQuantsClient` クラスを実装します。HTTP リクエスト送信、認証トークン付与、基本的なリトライロジック、タイムアウト処理を実装し、APIアクセスの基礎を構築します。

#### 実装内容

1. **JQuantsClient クラス (src/api/j-quants-client.ts)**

   主要メソッド:
   - `constructor(tokenManager: TokenManager)`
   - `private async request<T>(url: string, options?: RequestOptions): Promise<T>` - 基本HTTPリクエスト
   - `private async retryableRequest<T>(fn: () => Promise<T>): Promise<T>` - リトライ付きリクエスト
   - `getListedInfo(): Promise<Company[]>` - 銘柄一覧取得（GET /listed_info）
   - `getDailyQuotes(code: string, from?: string, to?: string): Promise<StockPrice[]>` - 株価取得（GET /daily_quotes）
   - `getStatements(code: string, type?: string): Promise<FinancialStatements>` - 財務諸表取得（GET /statements）
   - `getCompanyInfo(code: string): Promise<CompanyInfo>` - 企業情報取得（GET /listed_info/{code}）

2. **エンドポイント定義 (src/api/endpoints.ts)**
   ```typescript
   export const JQUANTS_API_BASE = 'https://api.jquants.com/v1';
   export const ENDPOINTS = {
     AUTH: '/token/auth_user',
     LISTED_INFO: '/listed_info',
     DAILY_QUOTES: '/daily_quotes',
     STATEMENTS: '/statements',
     // ...
   };
   ```

3. **リトライロジック実装**
   - 最大3回まで自動リトライ（REQ-601）
   - リトライ対象エラー: 5xx, 429, タイムアウト
   - Exponential backoff: 1秒, 2秒, 4秒
   - 4xx（400-499） 以外の恒久的エラーはリトライなし

4. **タイムアウト処理（REQ-603）**
   - リクエストタイムアウト: 5秒
   - AbortController を使用

5. **エラーハンドリング**
   - APIエラーレスポンス解析
   - HTTPステータスコードの判定
   - エラーログ記録（src/utils/logger.ts 参照）

6. **リクエストオプション定義**
   ```typescript
   interface RequestOptions {
     method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
     headers?: Record<string, string>;
     body?: string;
     timeout?: number; // デフォルト 5000
     retries?: number; // デフォルト 3
   }
   ```

#### TDD テスト要件

**Red フェーズ**:
- 基本HTTPリクエスト → FAIL
- リトライロジック → FAIL
- タイムアウト処理 → FAIL
- 認証ヘッダー付与 → FAIL

**Green フェーズ**:
- 実装によってすべてのテストをPASS

**Refactor フェーズ**:
- エラーハンドリング改善
- コード重複排除

#### テストケース詳細

```typescript
// test/api/j-quants-client.test.ts の要件テストケース

1. 基本HTTPリクエスト
   - GET /listed_info を呼び出し
   - Authorization ヘッダーに Bearer {token} を付与
   ✓ 正しいレスポンスが返却される

2. リトライロジック
   - 1回目: 500 エラー
   - 2回目: 500 エラー
   - 3回目: 200 OK
   ✓ 3回目で成功し、結果が返却される

3. 最大リトライ回数超過
   - 3回失敗
   ✓ エラーがスロー

4. タイムアウト処理
   - リクエスト実行 → 5秒以上待機
   ✓ タイムアウトエラー発生

5. リトライ不可能なエラー
   - 400 Bad Request（バリデーションエラー）
   ✓ リトライなして、即座にエラー
```

#### 完了基準

- [ ] `src/api/j-quants-client.ts` が完成し、6つのメインメソッドが実装
- [ ] `src/api/endpoints.ts` が全エンドポイント定義
- [ ] リトライロジックが Exponential backoff で実装
- [ ] タイムアウト処理が AbortController で実装（5秒）
- [ ] すべてのテストケース（PASS 条件）がパス
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   └── api/
│       ├── j-quants-client.ts (新規)
│       └── endpoints.ts (新規)
└── tests/
    └── api/
        └── j-quants-client.test.ts (新規)
```

---

### Day 5: TASK-0005: エラーハンドリング・バリデーション

**[x] TASK-0005: エラーハンドリング・バリデーション** ✅ **完了** (TDD開発完了)

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0005 |
| **タスク名** | エラーハンドリング・バリデーション実装（Error Handling & Validation） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | REQ-601, REQ-602, REQ-603, REQ-701, NFR-301 |
| **依存タスク** | TASK-0002, TASK-0004 |

#### 説明

ユーティリティモジュールを実装します。エラーハンドリング、パラメータバリデーション、ロギング機能を提供し、全体的なロジックの安定性と保守性を向上させます。

#### 実装内容

1. **エラーハンドラー (src/utils/error-handler.ts)**

   主要メソッド:
   - `handleApiError(error: any, context: string): never` - APIエラー処理（ログ記録後例外スロー）
   - `getErrorMessage(errorCode: ErrorCode, context?: any): string` - エラーメッセージ取得（日本語）
   - `isRetryableError(error: any): boolean` - リトライ可能エラー判定
   - `formatErrorResponse(error: any): ErrorResponse` - エラーレスポンス整形

   エラーメッセージ例（日本語）:
   ```typescript
   const errorMessages: Record<ErrorCode, string> = {
     INVALID_CODE: '指定された銘柄コード（{code}）は存在しません',
     INVALID_DATE: '日付はYYYY-MM-DD形式で指定してください',
     API_ERROR: 'J-Quants APIへの接続に失敗しました',
     TIMEOUT: 'APIの応答がタイムアウトしました（5秒）',
     MISSING_PARAM: '必須パラメータ {param} が指定されていません',
     // ...
   };
   ```

2. **バリデーター (src/utils/validator.ts)**

   主要メソッド:
   - `validateCode(code: string): void` - 銘柄コード検証（4桁数字）
   - `validateDate(date: string): void` - 日付検証（YYYY-MM-DD形式）
   - `validateDateRange(from: string, to: string): void` - 日付範囲検証
   - `validateRequiredParam(value: any, paramName: string): void` - 必須パラメータ検証
   - `validateEnum<T>(value: any, enumObj: T, paramName: string): void` - 列挙型検証

   バリデーションルール:
   - 銘柄コード: `/^[0-9]{4}$/` （4桁数字）
   - 日付: `/^\d{4}-\d{2}-\d{2}$/` （YYYY-MM-DD）
   - 市場区分: `Market` 列挙型に含まれるか
   - 業種コード: `Sector` 列挙型に含まれるか

3. **ロガー (src/utils/logger.ts)**

   主要メソッド:
   - `error(message: string, context?: any): void` - エラーログ（logs/error.log）
   - `info(message: string, context?: any): void` - 情報ログ（オプション）
   - `debug(message: string, context?: any): void` - デバッグログ（NODE_ENV=development 時）
   - `setLogLevel(level: LogLevel): void` - ログレベル変更

   ログフォーマット:
   ```
   [2025-10-29T15:22:30.123Z] ERROR: エラーメッセージ
   Context: { code: '1234', message: 'API Error' }
   ```

4. **リトライ・遅延ユーティリティ (src/utils/retry.ts)**
   - `sleep(ms: number): Promise<void>` - 遅延関数
   - `calculateBackoffDelay(attempt: number, baseDelay: number = 1000): number` - Exponential backoff 計算
   - `retryableRequest<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T>` - リトライ関数

#### TDD テスト要件

**Red フェーズ**:
- エラーメッセージ取得 → FAIL
- バリデーション（正常値） → FAIL
- バリデーション（異常値） → FAIL（エラー発生を期待）
- ログ記録 → FAIL

**Green フェーズ**:
- 実装によってすべてのテストをPASS

**Refactor フェーズ**:
- ログフォーマット改善
- バリデーションロジック整理

#### テストケース詳細

```typescript
// test/utils/ の要件テストケース

## error-handler.test.ts
1. getErrorMessage() - 銘柄コード不正
   - errorCode: INVALID_CODE, context: { code: '9999' }
   ✓ 返却メッセージ: "指定された銘柄コード（9999）は存在しません"

2. getErrorMessage() - 日付形式不正
   - errorCode: INVALID_DATE
   ✓ 返却メッセージ: "日付はYYYY-MM-DD形式で指定してください"

3. isRetryableError() - 5xx エラー
   - error: { status: 500 }
   ✓ true を返却

4. isRetryableError() - 4xx エラー
   - error: { status: 400 }
   ✓ false を返却

## validator.test.ts
1. validateCode() - 正常な銘柄コード
   - code: '1234'
   ✓ エラーなし

2. validateCode() - 不正な銘柄コード
   - code: '123' または 'ABCD'
   ✓ ValidationError スロー

3. validateDate() - 正常な日付
   - date: '2025-10-29'
   ✓ エラーなし

4. validateDate() - 不正な日付
   - date: '2025-13-40' または '29/10/2025'
   ✓ ValidationError スロー

5. validateDateRange() - 正常な範囲
   - from: '2025-01-01', to: '2025-12-31'
   ✓ エラーなし

6. validateDateRange() - 逆順（from > to）
   - from: '2025-12-31', to: '2025-01-01'
   ✓ ValidationError スロー

## logger.test.ts
1. error() ログ記録
   - message: 'Test error'
   ✓ logs/error.log に記録される
   ✓ タイムスタンプ, ログレベル, メッセージが含まれる
```

#### 完了基準

- [ ] `src/utils/error-handler.ts` が実装され、エラーメッセージが日本語で定義
- [ ] `src/utils/validator.ts` が5つの検証メソッドを実装
- [ ] `src/utils/logger.ts` が error, debug メソッドを実装し、logs/ にファイル出力
- [ ] `src/utils/retry.ts` が実装
- [ ] すべてのテストケース（PASS 条件）がパス
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   └── utils/
│       ├── error-handler.ts (新規)
│       ├── validator.ts (新規)
│       ├── logger.ts (新規)
│       └── retry.ts (新規)
├── tests/
│   └── utils/
│       ├── error-handler.test.ts (新規)
│       ├── validator.test.ts (新規)
│       ├── logger.test.ts (新規)
│       └── retry.test.ts (新規)
└── logs/
    ├── error.log (実行時生成)
    └── debug.log (実行時生成)
```

---

### Day 6: TASK-0006: MCPツール1: get_listed_companies

**[x] TASK-0006: MCPツール1: get_listed_companies** ✅ **完了** (TDD開発完了 - 9テストケース全通過)

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0006 |
| **タスク名** | MCPツール1: get_listed_companies（Listed Companies Tool） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | REQ-101, REQ-102, REQ-501, REQ-502, REQ-701 |
| **依存タスク** | TASK-0004, TASK-0005 |

#### 説明

上場銘柄一覧を取得するMCPツール `get_listed_companies` を実装します。オプションパラメータ（市場区分、業種）でフィルタリングが可能です。

#### 実装内容

1. **ツール実装 (src/tools/get-listed-companies.ts)**

   関数シグネチャ:
   ```typescript
   async function getListedCompanies(
     params: {
       market?: string;  // オプション: TSE, MOTHERS, JASDAQ_STANDARD, JASDAQ_GROWTH
       sector?: string;  // オプション: 業種コード（e.g., '1720'）
     }
   ): Promise<{ companies: Company[] }>
   ```

   処理フロー:
   - パラメータバリデーション（validator.ts）
   - J-Quants APIへのリクエスト（j-quants-client.ts）
   - レスポンスデータをマッピング
   - フィルタリング適用（market, sector）
   - 結果を返却

2. **入力パラメータ**
   - `market`（オプション）: 市場区分フィルタ
   - `sector`（オプション）: 業種コードフィルタ

3. **出力形式**
   ```json
   {
     "companies": [
       {
         "code": "1234",
         "name": "トヨタ自動車",
         "market": "TSE",
         "sector": "0050" // 自動車・同部品
       },
       // ...
     ]
   }
   ```

4. **バリデーション**
   - market が指定された場合、Market 列挙型に含まれるか確認
   - sector が指定された場合、Sector 列挙型に含まれるか確認

5. **エラーハンドリング**
   - APIエラー → error-handler.ts で処理
   - バリデーションエラー → validator.ts で処理
   - レスポンス形式エラー → エラーメッセージ返却

#### TDD テスト要件

**Red フェーズ**:
- パラメータなし実行 → FAIL
- パラメータあり実行 → FAIL
- フィルタリング → FAIL

**Green フェーズ**:
- 実装によってすべてのテストをPASS

**Refactor フェーズ**:
- フィルタリングロジック最適化
- コード可読性改善

#### テストケース詳細

```typescript
// test/tools/get-listed-companies.test.ts

1. パラメータなし
   - params: {}
   ✓ すべての上場銘柄が返却される
   ✓ companies 配列に 3000+ の企業が含まれる

2. market フィルタ
   - params: { market: 'TSE' }
   ✓ TSE のみの企業が返却される
   ✓ 他の市場の企業は含まれない

3. sector フィルタ
   - params: { sector: '0050' }
   ✓ 業種 0050 のみの企業が返却される

4. 複合フィルタ（market + sector）
   - params: { market: 'TSE', sector: '0050' }
   ✓ TSE 且つ 0050 業種の企業のみが返却される

5. 不正な market パラメータ
   - params: { market: 'INVALID' }
   ✓ ValidationError スロー, エラーメッセージ返却

6. 不正な sector パラメータ
   - params: { sector: 'INVALID' }
   ✓ ValidationError スロー, エラーメッセージ返却
```

#### 完了基準

- [ ] `src/tools/get-listed-companies.ts` が実装
- [ ] バリデーション機能が正常に動作
- [ ] フィルタリング機能が正常に動作
- [ ] すべてのテストケース（PASS 条件）がパス
- [ ] レスポンス形式が仕様に準拠
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   └── tools/
│       └── get-listed-companies.ts (新規)
└── tests/
    └── tools/
        └── get-listed-companies.test.ts (新規)
```

---

### Day 7: TASK-0007: MCPツール2: get_stock_price

**[x] TASK-0007: MCPツール2: get_stock_price** ✅ **完了** (TDD開発完了 - 9テストケース全通過)

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0007 |
| **タスク名** | MCPツール2: get_stock_price（Stock Price Tool） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | REQ-201, REQ-202, REQ-203, REQ-503, REQ-504, REQ-701 |
| **依存タスク** | TASK-0004, TASK-0005 |

#### 説明

指定銘柄の日次株価データを取得するMCPツール `get_stock_price` を実装します。日付範囲でフィルタリング可能で、結果は日付降順（新しい順）で返却します。

#### 実装内容

1. **ツール実装 (src/tools/get-stock-price.ts)**

   関数シグネチャ:
   ```typescript
   async function getStockPrice(
     params: {
       code: string;      // 必須: 銘柄コード（4桁数字）
       from_date?: string; // オプション: 開始日（YYYY-MM-DD）
       to_date?: string;   // オプション: 終了日（YYYY-MM-DD）
     }
   ): Promise<{ code: string; prices: StockPrice[] }>
   ```

   処理フロー:
   - 必須パラメータ（code）のバリデーション
   - 日付パラメータのバリデーション（指定された場合）
   - J-Quants APIへのリクエスト（getDailyQuotes）
   - 日付範囲でフィルタリング
   - 日付降順でソート
   - 結果を返却

2. **入力パラメータ**
   - `code`（必須）: 銘柄コード（4桁数字）
   - `from_date`（オプション）: 開始日（YYYY-MM-DD、この日以降のデータ取得）
   - `to_date`（オプション）: 終了日（YYYY-MM-DD、この日以前のデータ取得）

3. **出力形式**
   ```json
   {
     "code": "1234",
     "prices": [
       {
         "code": "1234",
         "date": "2025-10-29",
         "open": 3000.0,
         "high": 3100.0,
         "low": 2950.0,
         "close": 3050.0,
         "volume": 1000000
       },
       // ... 日付降順
     ]
   }
   ```

4. **バリデーション**
   - code が指定されているか、4桁数字か
   - from_date, to_date が YYYY-MM-DD 形式か
   - from_date <= to_date か

5. **データフロー制約対応（REQ-1201, REQ-1202）**
   - 直近12週間のデータ取得時、警告メッセージを表示（オプション）
   - 過去2年以前のデータ取得時、警告メッセージを表示（オプション）

#### TDD テスト要件

**Red フェーズ**:
- code パラメータ未指定 → FAIL
- 正常なコード指定 → FAIL
- 日付範囲指定 → FAIL
- 日付降順ソート → FAIL

**Green フェーズ**:
- 実装によってすべてのテストをPASS

**Refactor フェーズ**:
- フィルタリング・ソートロジック最適化
- エラーメッセージ改善

#### テストケース詳細

```typescript
// test/tools/get-stock-price.test.ts

1. パラメータなし
   - params: {}
   ✓ ValidationError スロー: "必須パラメータ code が指定されていません"

2. code のみ指定（正常）
   - params: { code: '1234' }
   ✓ 過去全データが返却される
   ✓ prices 配列が日付降順

3. code + from_date
   - params: { code: '1234', from_date: '2025-01-01' }
   ✓ 2025-01-01 以降のデータのみ返却
   ✓ 2024年のデータは含まれない

4. code + to_date
   - params: { code: '1234', to_date: '2025-12-31' }
   ✓ 2025-12-31 以前のデータのみ返却
   ✓ 2026年のデータは含まれない

5. code + from_date + to_date
   - params: { code: '1234', from_date: '2025-01-01', to_date: '2025-12-31' }
   ✓ 指定範囲内のデータのみ返却

6. 不正な code
   - params: { code: '123' } または { code: 'ABCD' }
   ✓ ValidationError スロー

7. 不正な日付形式
   - params: { code: '1234', from_date: '2025/01/01' }
   ✓ ValidationError スロー

8. from_date > to_date
   - params: { code: '1234', from_date: '2025-12-31', to_date: '2025-01-01' }
   ✓ ValidationError スロー

9. 存在しないコード
   - params: { code: '9999' }
   ✓ APIエラー or 空配列を返却

10. 日付降順確認
    - 複数の株価データを取得
    ✓ prices[0].date > prices[1].date > ... となっている
```

#### 完了基準

- [ ] `src/tools/get-stock-price.ts` が実装
- [ ] 必須パラメータバリデーション実装
- [ ] 日付範囲フィルタリング実装
- [ ] 日付降順ソート実装
- [ ] すべてのテストケース（PASS 条件）がパス
- [ ] レスポンス形式が仕様に準拠
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   └── tools/
│       └── get-stock-price.ts (新規)
└── tests/
    └── tools/
        └── get-stock-price.test.ts (新規)
```

---

### Day 8: TASK-0008: MCPツール3: get_financial_statements

**[x] TASK-0008: MCPツール3: get_financial_statements** ✅ **完了** (TDD開発完了 - 9テストケース全通過、要件網羅率100%)

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0008 |
| **タスク名** | MCPツール3: get_financial_statements（Financial Statements Tool） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | REQ-301, REQ-302, REQ-701 |
| **依存タスク** | TASK-0004, TASK-0005 |

#### 説明

指定銘柄の財務諸表（貸借対照表・損益計算書・キャッシュフロー計算書）を取得するMCPツール `get_financial_statements` を実装します。

#### 実装内容

1. **ツール実装 (src/tools/get-financial-statements.ts)**

   関数シグネチャ:
   ```typescript
   async function getFinancialStatements(
     params: {
       code: string;           // 必須: 銘柄コード（4桁数字）
       statement_type?: string; // オプション: CONSOLIDATED | NON_CONSOLIDATED
     }
   ): Promise<{
     code: string;
     fiscal_year: string;
     balance_sheet: BalanceSheet;
     profit_loss: ProfitLoss;
     cash_flow: CashFlow;
   }>
   ```

   処理フロー:
   - 必須パラメータ（code）のバリデーション
   - statement_type のバリデーション（指定された場合）
   - J-Quants APIへのリクエスト（getStatements）
   - 財務データをマッピング
   - 結果を返却

2. **入力パラメータ**
   - `code`（必須）: 銘柄コード（4桁数字）
   - `statement_type`（オプション）: 連結 (CONSOLIDATED) or 非連結 (NON_CONSOLIDATED)

3. **出力形式**
   ```json
   {
     "code": "1234",
     "fiscal_year": "2024",
     "balance_sheet": {
       "total_assets": 10000000000,
       "current_assets": 5000000000,
       "current_liabilities": 3000000000,
       "stockholders_equity": 6000000000
     },
     "profit_loss": {
       "revenue": 500000000,
       "operating_income": 50000000,
       "net_income": 30000000
     },
     "cash_flow": {
       "operating_cash_flow": 40000000,
       "investing_cash_flow": -10000000,
       "financing_cash_flow": -5000000
     }
   }
   ```

4. **バリデーション**
   - code が指定されているか、4桁数字か
   - statement_type が指定された場合、StatementType 列挙型に含まれるか

5. **エラーハンドリング**
   - code が存在しない → "指定された銘柄コード（XXXX）は存在しません"
   - 財務データが存在しない → "財務諸表データが利用できません"

#### TDD テスト要件

**Red フェーズ**:
- code パラメータ未指定 → FAIL
- 正常なコード指定 → FAIL
- statement_type 指定 → FAIL
- データ形式 → FAIL

**Green フェーズ**:
- 実装によってすべてのテストをPASS

**Refactor フェーズ**:
- データマッピングロジック最適化
- エラーメッセージ改善

#### テストケース詳細

```typescript
// test/tools/get-financial-statements.test.ts

1. パラメータなし
   - params: {}
   ✓ ValidationError スロー: "必須パラメータ code が指定されていません"

2. code のみ指定（正常）
   - params: { code: '1234' }
   ✓ 最新の財務諸表が返却される
   ✓ balance_sheet, profit_loss, cash_flow を含む

3. statement_type = CONSOLIDATED
   - params: { code: '1234', statement_type: 'CONSOLIDATED' }
   ✓ 連結財務諸表が返却される

4. statement_type = NON_CONSOLIDATED
   - params: { code: '1234', statement_type: 'NON_CONSOLIDATED' }
   ✓ 非連結財務諸表が返却される

5. 不正な code
   - params: { code: '123' } または { code: 'ABCD' }
   ✓ ValidationError スロー

6. 不正な statement_type
   - params: { code: '1234', statement_type: 'INVALID' }
   ✓ ValidationError スロー

7. 存在しないコード
   - params: { code: '9999' }
   ✓ エラーメッセージ返却: "指定された銘柄コード（9999）は存在しません"

8. 財務データが存在しない企業
   - params: { code: '8000' } （仮想的な新興企業）
   ✓ エラーメッセージ返却: "財務諸表データが利用できません"

9. データ形式確認
   - 返却オブジェクトが正しい構造を持つ
   ✓ code, fiscal_year, balance_sheet, profit_loss, cash_flow を含む
```

#### 完了基準

- [ ] `src/tools/get-financial-statements.ts` が実装
- [ ] 必須パラメータバリデーション実装
- [ ] statement_type フィルタリング実装
- [ ] すべてのテストケース（PASS 条件）がパス
- [ ] レスポンス形式が仕様に準拠
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   └── tools/
│       └── get-financial-statements.ts (新規)
└── tests/
    └── tools/
        └── get-financial-statements.test.ts (新規)
```

---

### Day 9: TASK-0009: MCPツール4: get_company_info

**[x] TASK-0009: MCPツール4: get_company_info** ✅ **完了** (TDD開発完了 - 7テストケース全通過、要件網羅率100%)

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0009 |
| **タスク名** | MCPツール4: get_company_info（Company Info Tool） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | REQ-401, REQ-402, REQ-701 |
| **依存タスク** | TASK-0004, TASK-0005, TASK-0007 |

#### 説明

指定銘柄の企業詳細情報と最新株価を取得するMCPツール `get_company_info` を実装します。

#### 実装内容

1. **ツール実装 (src/tools/get-company-info.ts)**

   関数シグネチャ:
   ```typescript
   async function getCompanyInfo(
     params: {
       code: string;  // 必須: 銘柄コード（4桁数字）
     }
   ): Promise<{
     code: string;
     name: string;
     market: string;
     sector: string;
     latest_price: number;
     latest_date: string;
   }>
   ```

   処理フロー:
   - 必須パラメータ（code）のバリデーション
   - get_listed_companies で企業情報を取得
   - get_stock_price で最新株価を取得
   - データをマージ
   - 結果を返却

2. **入力パラメータ**
   - `code`（必須）: 銘柄コード（4桁数字）

3. **出力形式**
   ```json
   {
     "code": "1234",
     "name": "トヨタ自動車",
     "market": "TSE",
     "sector": "0050",
     "latest_price": 3050.0,
     "latest_date": "2025-10-29"
   }
   ```

4. **バリデーション**
   - code が指定されているか、4桁数字か

5. **エラーハンドリング**
   - code が存在しない → "指定された銘柄コード（XXXX）は存在しません"
   - 株価データが存在しない → 最新株価なしで返却（オプション）

#### TDD テスト要件

**Red フェーズ**:
- code パラメータ未指定 → FAIL
- 正常なコード指定 → FAIL
- データマージ → FAIL

**Green フェーズ**:
- 実装によってすべてのテストをPASS

**Refactor フェーズ**:
- データマージロジック最適化
- エラーメッセージ改善

#### テストケース詳細

```typescript
// test/tools/get-company-info.test.ts

1. パラメータなし
   - params: {}
   ✓ ValidationError スロー: "必須パラメータ code が指定されていません"

2. 正常なコード指定
   - params: { code: '1234' }
   ✓ 企業情報と最新株価が返却される
   ✓ code, name, market, sector, latest_price, latest_date を含む

3. 不正な code
   - params: { code: '123' } または { code: 'ABCD' }
   ✓ ValidationError スロー

4. 存在しないコード
   - params: { code: '9999' }
   ✓ エラーメッセージ返却: "指定された銘柄コード（9999）は存在しません"

5. latest_price が最新
   - 複数の企業情報を取得
   ✓ latest_date が最も最近の日付である
   ✓ latest_price が stock_price ツールの最初の結果と一致
```

#### 完了基準

- [ ] `src/tools/get-company-info.ts` が実装
- [ ] 必須パラメータバリデーション実装
- [ ] get_listed_companies, get_stock_price との連携実装
- [ ] すべてのテストケース（PASS 条件）がパス
- [ ] レスポンス形式が仕様に準拠
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   └── tools/
│       └── get-company-info.ts (新規)
└── tests/
    └── tools/
        └── get-company-info.test.ts (新規)
```

---

### Day 10: TASK-0010: MCPサーバー本体実装・統合

**[x] TASK-0010: MCPサーバー本体実装・統合** ✅ **完了** (TDD開発完了 - 8テストケース全通過、Refactor完了)

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0010 |
| **タスク名** | MCPサーバー本体実装・統合（MCP Server Integration） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | REQ-1002, REQ-1004 |
| **依存タスク** | TASK-0003, TASK-0006, TASK-0007, TASK-0008, TASK-0009 |

#### 説明

MCPサーバーのエントリーポイント `src/index.ts` を実装し、4つのMCPツールを登録・公開します。さらに統合テストを実施し、全ツールが正常に動作することを確認します。

#### 実装内容

1. **MCPサーバー本体 (src/index.ts)**

   構成要素:
   - @modelcontextprotocol/sdk から Server クラスをインポート
   - 起動時の認証フロー実装（TokenManager初期化）
   - 4つのMCPツール登録
   - エラーハンドリング（uncaughtException, unhandledRejection）

   主要実装:
   ```typescript
   import { Server } from '@modelcontextprotocol/sdk/server/index.js';

   const server = new Server({
     name: 'j-quants',
     version: '1.0.0',
     tools: [
       {
         name: 'get_listed_companies',
         description: '...',
         inputSchema: { ... }
       },
       // ... other tools
     ]
   });

   // Tool implementation handlers
   server.setRequestHandler(Tool, async (req) => { ... });

   // Error handling
   process.on('uncaughtException', (error) => { ... });
   process.on('unhandledRejection', (reason) => { ... });

   // Server startup
   server.listen();
   ```

2. **ツール登録 (Tool Definitions)**

   各ツール定義に含めるもの:
   - `name`: ツール名（英語、スネークケース）
   - `description`: ツール説明（日本語）
   - `inputSchema`: 入力パラメータの JSON Schema
   - `handler`: ツール実装関数

3. **起動フロー実装**
   ```
   1. TokenManager 初期化
   2. 環境変数チェック（J_QUANTS_REFRESH_TOKEN）
   3. IDトークン取得（キャッシュまたはAPI）
   4. MCPサーバー起動
   5. ツール登録完了メッセージ
   ```

4. **エラーハンドリング**
   - 起動時認証失敗 → エラーログ出力、終了
   - ツール実行時エラー → ユーザーへエラーメッセージ返却
   - 予期しないエラー → キャッシュ保護、適切なエラーログ出力

5. **package.json の script 更新**
   ```json
   {
     "scripts": {
       "build": "tsc",
       "dev": "node --loader ts-node/esm src/index.ts",
       "start": "node dist/index.js",
       "lint": "eslint src/ tests/",
       "format": "prettier --write src/ tests/",
       "test": "vitest run",
       "test:watch": "vitest"
     }
   }
   ```

#### TDD テスト要件

**Red フェーズ**:
- サーバー起動 → FAIL
- ツール登録確認 → FAIL
- ツール実行 → FAIL

**Green フェーズ**:
- 実装によってすべてのテストをPASS

**Refactor フェーズ**:
- エラーハンドリング改善
- ツール登録構造整理

#### テストケース詳細

```typescript
// test/integration/server.test.ts

1. サーバー起動
   - TokenManager 初期化成功
   - IDトークン取得成功
   ✓ サーバーが起動状態

2. ツール登録確認
   - get_listed_companies 登録確認
   - get_stock_price 登録確認
   - get_financial_statements 登録確認
   - get_company_info 登録確認
   ✓ すべてのツールが登録されている

3. ツール実行（end-to-end）
   - get_listed_companies { market: 'TSE' } → 成功
   ✓ 銘柄一覧が返却される

   - get_stock_price { code: '1234' } → 成功
   ✓ 株価データが返却される

   - get_financial_statements { code: '1234' } → 成功
   ✓ 財務諸表が返却される

   - get_company_info { code: '1234' } → 成功
   ✓ 企業情報が返却される

4. エラーハンドリング
   - get_stock_price { code: '9999' } → エラー
   ✓ 分かりやすいエラーメッセージが返却される

5. サーバー起動時エラー
   - J_QUANTS_REFRESH_TOKEN が未設定
   ✓ エラーログが出力される
   ✓ サーバーが正常終了
```

#### 完了基準

- [ ] `src/index.ts` が完成し、MCPサーバーが起動可能
- [ ] 4つのMCPツールがすべて登録・登録確認可能
- [ ] すべてのツールが正常に実行可能
- [ ] エラーハンドリングが実装（環境変数未設定、API通信エラー等）
- [ ] すべてのテストケース（PASS 条件）がパス
- [ ] `npm run build` でエラーなくコンパイル可能
- [ ] TypeScript strict mode でエラーなし

#### 統合テスト実施

Phase 1 完了時に実施する統合テスト:

1. **機能テスト**
   - [ ] get_listed_companies: パラメータなし → 銘柄一覧取得成功
   - [ ] get_listed_companies: market フィルタ → フィルタリング成功
   - [ ] get_stock_price: code 指定 → 株価データ取得成功
   - [ ] get_stock_price: 日付範囲 → 範囲フィルタリング成功
   - [ ] get_financial_statements: 財務諸表取得成功
   - [ ] get_company_info: 企業情報取得成功

2. **エラーハンドリングテスト**
   - [ ] 不正なパラメータ → エラーメッセージが日本語で返却
   - [ ] 存在しない銘柄コード → エラーメッセージが返却
   - [ ] API通信エラー → リトライ後エラーメッセージ返却

3. **非機能テスト**
   - [ ] レスポンス時間 → 5秒以内
   - [ ] メモリ使用量 → 500MB 以下
   - [ ] TypeScript strict mode → エラーなし
   - [ ] ESLint → エラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   └── index.ts (新規、MCPサーバー本体)
├── tests/
│   └── integration/
│       └── server.test.ts (新規、統合テスト)
└── package.json (修正、scripts 更新)
```

---

## Phase 1 全体統合テスト

**実施日**: Day 10 完了後
**実施者**: 開発チーム
**テスト環境**: ローカル環境

### 統合テスト計画

#### 1. 環境セットアップ確認
- [ ] Node.js 20 LTS インストール確認
- [ ] npm dependencies インストール確認
- [ ] .env 環境変数設定確認
- [ ] TypeScript コンパイル可能確認

#### 2. 機能テスト
- [ ] 4つのMCPツール全て実行可能
- [ ] 各ツールが正確なデータを返却
- [ ] パラメータフィルタリング正常
- [ ] エラーハンドリング機能正常

#### 3. 品質テスト
- [ ] 全テストケース PASS (Vitest)
- [ ] TypeScript strict mode エラーなし
- [ ] ESLint エラーなし
- [ ] コード可読性・保守性確認

#### 4. ドキュメント確認
- [ ] Phase 1 タスク完了書作成
- [ ] 各ツール使用方法 README に記載
- [ ] トラブルシューティング ガイド作成

### Phase 1 完了判定基準

✅ すべての以下の条件が満たされたら Phase 1 完了

1. **実装完了**
   - [x] TASK-0001～TASK-0010 すべて完了
   - [x] 10個すべてのファイルが作成・実装完了
   - [x] コード品質（strict mode, ESLint）合格

2. **テスト完了**
   - [x] ユニットテスト: 全テストケース PASS (106/106)
   - [x] 統合テスト: 4つのツール動作確認完了 (8/8 PASS)
   - [x] 手動テスト: 実API認証成功（.envファイル配置済み）

3. **ドキュメント完成**
   - [x] Phase 1 タスク完了書 (j-quants-phase1-completion.md)
   - [x] 各ツール仕様書 (実装ファイル内コメント)
   - [x] セットアップ手順書 (README.md, .env.example)
   - [x] トラブルシューティング ガイド (テストケース内記載)

4. **要件充足**
   - [x] 認証機能実装完了（REQ-001～004）
   - [x] 4つのコアツール実装完了（REQ-101, 201, 301, 401）
   - [x] 基本的なエラーハンドリング実装完了（REQ-601, 602, 701）

---

## Phase 1 ドキュメント成果物

Phase 1 完了時に作成すべきドキュメント:

1. **Phase 1 完了報告書** (`docs/tasks/j-quants-phase1-completion.md`)
   - 実装概要
   - タスク完了状況
   - テスト結果報告
   - 次フェーズへの引継ぎ事項

2. **API 仕様書 (暫定)** (`docs/design/api-spec.md`)
   - 4つのツール仕様詳細
   - 入出力パラメータ定義
   - レスポンス形式定義

3. **セットアップ手順書** (`docs/setup-guide.md`)
   - インストール手順
   - 環境変数設定
   - テスト実行方法

4. **トラブルシューティング** (`docs/troubleshooting.md`)
   - よくあるエラーと対応
   - デバッグ方法

---

## 次フェーズへの移行

Phase 1 完了後、以下を Phase 2 へ引き継ぎ:

1. **完成したコンポーネント**
   - TokenManager
   - JQuantsClient
   - 4つのMCPツール
   - ユーティリティ群

2. **既知の制約・注意事項**
   - J-Quants API フリープラン制約（12週間遅延、2年制限）
   - レート制限の詳細把握
   - トークン有効期限管理

3. **Phase 2 で追加実装すべきもの**
   - 4つの追加ツール
   - 詳細なエラーメッセージ
   - パフォーマンス最適化
   - キャッシング戦略

---

**最終更新**: 2025-10-30
**作成者**: Claude Code (kairo-design + kairo-tasks コマンド)
**ステータス**: ✅ **Phase 1 完了** - 全10タスク完了、106テスト全通過 (100%)

---

## 参考資料

- [J-Quants 要件定義書](../spec/j-quants-requirements.md)
- [J-Quants アーキテクチャ設計書](../design/architecture.md)
- [J-Quants 全体タスク概要](./j-quants-overview.md)
- [技術スタック](../../../../docs/tech-stack.md)
