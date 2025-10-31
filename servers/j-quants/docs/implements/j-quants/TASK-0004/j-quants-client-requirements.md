# TASK-0004: J-Quants APIクライアント基礎 - 要件定義書

**タスクID**: TASK-0004
**機能名**: JQuantsClient（J-Quants APIクライアント基礎）
**作成日**: 2025-10-29
**種別**: TDD
**推定時間**: 8時間
**依存タスク**: TASK-0003（TokenManager）
**関連要件**: REQ-001, REQ-002, REQ-003, REQ-004, REQ-601, REQ-602, REQ-603

---

## 1. 機能の概要

### 🟡 何をする機能か
J-Quants APIとの通信を担当する基盤クライアントクラス `JQuantsClient` を実装します。HTTP リクエスト送信、認証トークンの自動付与、リトライロジック、タイムアウト処理を提供し、すべてのMCPツールの共通基盤となります。

### 🟡 どのような問題を解決するか
- **問題1**: J-Quants APIへのHTTPリクエストを毎回手動で実装する必要がある
- **問題2**: 認証トークンの管理と付与を各ツールで個別に実装する必要がある
- **問題3**: ネットワークエラーやタイムアウトへの対応が不十分
- **問題4**: APIレート制限や一時的なエラーに対する自動リトライ機構がない

**解決策**:
JQuantsClientクラスが以下を提供：
- 統一されたHTTPリクエストインターフェース
- TokenManagerとの連携による自動認証ヘッダー付与
- Exponential backoffによる自動リトライ機構
- AbortControllerを使用したタイムアウト制御

### 🟡 想定されるユーザー
- **As a MCP Server Developer**: 銘柄データ、株価データ、財務諸表データを取得するツールを実装する開発者
- **As a API Consumer**: J-Quants APIを呼び出すすべての内部モジュール（TASK-0006～0009のMCPツール）

### 🟡 システム内での位置づけ
```
┌─────────────────────────────────────────┐
│  MCPツール層（TASK-0006～0009）          │
│  - get_listed_companies                  │
│  - get_stock_price                       │
│  - get_financial_statements              │
│  - get_company_info                      │
└─────────────────┬───────────────────────┘
                  │ 依存
┌─────────────────▼───────────────────────┐
│  **JQuantsClient (TASK-0004)**          │ ◄── 今回実装
│  - HTTP通信                              │
│  - 認証ヘッダー付与                      │
│  - リトライロジック                      │
│  - タイムアウト処理                      │
└─────────────────┬───────────────────────┘
                  │ 依存
┌─────────────────▼───────────────────────┐
│  TokenManager (TASK-0003) ✅完了         │
│  - IDトークン取得・管理                  │
│  - トークンキャッシング                  │
└─────────────────────────────────────────┘
```

### 参照情報
- **参照したタスク定義**: `docs/tasks/j-quants-phase1.md` (lines 376-508)
- **参照した型定義**: `src/types/index.ts` (Company, StockPrice, FinancialStatements, RequestOptions)
- **参照した既存実装**: `src/auth/token-manager.ts` (TokenManager連携パターン)

---

## 2. 入力・出力の仕様

### 🟡 JQuantsClientクラスの構造

#### コンストラクタ
```typescript
constructor(tokenManager: TokenManager)
```

**パラメータ**:
- `tokenManager`: TokenManager - 認証トークン管理インスタンス（TASK-0003で実装済み）

**役割**:
- TokenManagerへの参照を保持
- API ベースURL設定（`https://api.jquants.com/v1`）

---

### 🟡 主要メソッド

#### 1. `getListedInfo(): Promise<Company[]>`
**説明**: 上場銘柄一覧を取得

**入力**: なし

**出力**:
```typescript
Company[] // src/types/index.ts で定義
```

**APIエンドポイント**: `GET /listed/info`

**処理フロー**:
1. TokenManagerからIDトークン取得
2. Authorization ヘッダー付与（`Bearer {idToken}`）
3. GET リクエスト送信
4. レスポンスをCompany[]型にマッピング
5. エラー時はリトライロジック実行

---

#### 2. `getDailyQuotes(code: string, from?: string, to?: string): Promise<StockPrice[]>`
**説明**: 指定銘柄の日次株価データを取得

**入力パラメータ**:
| パラメータ | 型 | 必須 | 説明 | 制約 |
|-----------|-----|-----|------|------|
| `code` | string | ✅ | 銘柄コード | 4桁数字（例: "7203"） |
| `from` | string | ❌ | 開始日 | YYYY-MM-DD形式（例: "2025-01-01"） |
| `to` | string | ❌ | 終了日 | YYYY-MM-DD形式（例: "2025-12-31"） |

**出力**:
```typescript
StockPrice[] // src/types/index.ts で定義
```

**APIエンドポイント**: `GET /prices/daily_quotes?code={code}&from={from}&to={to}`

---

#### 3. `getStatements(code: string, type?: StatementType): Promise<FinancialStatements>`
**説明**: 指定銘柄の財務諸表を取得

**入力パラメータ**:
| パラメータ | 型 | 必須 | 説明 | 制約 |
|-----------|-----|-----|------|------|
| `code` | string | ✅ | 銘柄コード | 4桁数字 |
| `type` | StatementType | ❌ | 財務諸表種別 | 'Consolidated' | 'NonConsolidated' |

**出力**:
```typescript
FinancialStatements // src/types/index.ts で定義
```

**APIエンドポイント**: `GET /fins/statements?code={code}&type={type}`

---

#### 4. `getCompanyInfo(code: string): Promise<CompanyInfo>`
**説明**: 指定銘柄の企業情報を取得

**入力パラメータ**:
| パラメータ | 型 | 必須 | 説明 | 制約 |
|-----------|-----|-----|------|------|
| `code` | string | ✅ | 銘柄コード | 4桁数字 |

**出力**:
```typescript
CompanyInfo // src/types/index.ts で定義
```

**APIエンドポイント**: `GET /listed/info/{code}`

---

### 🟡 内部メソッド（private）

#### `private async request<T>(url: string, options?: RequestOptions): Promise<T>`
**説明**: 基本HTTPリクエスト実行（ジェネリック型）

**入力**:
- `url`: string - リクエストURL（相対パス、例: "/listed/info"）
- `options`: RequestOptions（オプション）
  ```typescript
  interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; // デフォルト: 'GET'
    headers?: Record<string, string>;
    body?: string;
    timeout?: number; // デフォルト: 5000ms
    retries?: number; // デフォルト: 3
  }
  ```

**出力**: `Promise<T>` - APIレスポンスボディ（ジェネリック型）

**処理**:
1. TokenManagerから最新のIDトークン取得
2. Authorization ヘッダー付与
3. AbortControllerでタイムアウト制御（5秒）
4. fetchでHTTPリクエスト実行
5. HTTPステータスコード判定
   - 2xx: 成功
   - 400: バリデーションエラー（リトライなし）
   - 401: 認証エラー（TokenManager.getIdToken()で再取得後リトライ）
   - 429: レート制限エラー（リトライ対象）
   - 5xx: サーバーエラー（リトライ対象）
6. エラー時はretryableRequest()に移行

---

#### `private async retryableRequest<T>(fn: () => Promise<T>): Promise<T>`
**説明**: リトライロジック付きリクエスト実行

**入力**:
- `fn`: () => Promise<T> - リトライ対象の関数

**出力**: `Promise<T>` - 成功時のレスポンス

**処理**:
1. 最大3回までリトライ（初回 + リトライ2回）
2. Exponential backoff: 1秒 → 2秒
3. リトライ対象エラー判定（`isRetryableError()`）
   - ✅ リトライ対象: 5xx, 429, ネットワークエラー（TypeError）, タイムアウト（AbortError）
   - ❌ リトライ対象外: 400-499（400, 401, 404などのクライアントエラー）
4. リトライ間隔
   - 1回目失敗 → 1秒待機 → 2回目実行
   - 2回目失敗 → 2秒待機 → 3回目実行
   - 3回目失敗 → エラーをスロー

---

### 🟡 データフロー

```
[ MCPツール (get_listed_companies) ]
         ↓
[ JQuantsClient.getListedInfo() ]
         ↓
[ request('/listed/info') ]
         ↓
[ TokenManager.getIdToken() ] ← IDトークン取得
         ↓
[ Authorization: Bearer {token} ] ← ヘッダー付与
         ↓
[ fetch('https://api.jquants.com/v1/listed/info') ]
         ↓ (エラー発生時)
[ retryableRequest() ] ← 自動リトライ
         ↓ (1秒待機)
[ fetch('https://api.jquants.com/v1/listed/info') ] (2回目)
         ↓ (成功)
[ Company[] ] ← レスポンスマッピング
         ↓
[ return to MCPツール ]
```

### 参照情報
- **参照した型定義**: `src/types/index.ts` (Company, StockPrice, FinancialStatements, CompanyInfo, RequestOptions)
- **参照したインターフェース**: RequestOptions, TokenManagerConfig

---

## 3. 制約条件

### 🟡 パフォーマンス要件（NFR-001）
- **リクエストタイムアウト**: 5秒以内（REQ-603）
- **リトライ回数**: 最大3回（初回 + リトライ2回）（REQ-601）
- **リトライ間隔**: Exponential backoff（1秒 → 2秒）（REQ-601）
- **メモリ使用量**: リクエスト数に関わらず一定（ストリーミングなし、都度fetch）

### 🟡 セキュリティ要件（NFR-101）
- **認証方式**: Bearer Token（IDトークンをAuthorizationヘッダーに付与）
- **トークン管理**: TokenManagerに委譲、JQuantsClient内でトークンを直接保持しない
- **HTTPS通信**: すべてのAPIリクエストはHTTPS経由（`https://api.jquants.com/v1`）
- **環境変数**: リフレッシュトークンは環境変数から読み込み（`J_QUANTS_REFRESH_TOKEN`）

### 🟡 互換性要件
- **TypeScript strict mode**: 型安全性を確保
- **Node.js**: 20.0.0以上（package.json の engines指定に準拠）
- **fetch API**: Node.js 18以降のネイティブfetchを使用（外部ライブラリ不要）

### 🟡 アーキテクチャ制約
- **依存関係**: TokenManager（TASK-0003）に依存
- **責務分離**:
  - JQuantsClient: HTTP通信のみ担当
  - TokenManager: 認証トークン管理を担当
  - Validator（TASK-0005）: 入力値検証を担当（未実装のため、TASK-0004では簡易的な検証のみ）
- **エラーハンドリング**: ErrorHandler（TASK-0005）未実装のため、TASK-0004では基本的なエラーハンドリングのみ実装

### 🟡 API制約
- **ベースURL**: `https://api.jquants.com/v1`（固定）
- **レート制限**: J-Quants APIのレート制限に準拠（429エラー時は自動リトライ）
- **認証**: すべてのリクエストにIDトークンが必要（POST /token/auth_user 以外）
- **HTTPメソッド**: GET, POST のみ使用（PUT, DELETE は不要）

### 参照情報
- **参照した要件**: REQ-001（認証）, REQ-601（リトライ）, REQ-602（ログ）, REQ-603（タイムアウト）, NFR-001（パフォーマンス）, NFR-101（セキュリティ）
- **参照したタスク定義**: `docs/tasks/j-quants-phase1.md` (lines 418-442)

---

## 4. 想定される使用例

### 🟡 基本的な使用パターン

#### パターン1: 銘柄一覧取得（正常系）
```typescript
const tokenManager = new TokenManager({ refreshToken: 'xxx' });
const client = new JQuantsClient(tokenManager);

// シンプルなAPI呼び出し
const companies = await client.getListedInfo();
console.log(companies); // Company[]
```

**期待される動作**:
1. TokenManagerからIDトークン取得
2. GET /listed/info にリクエスト送信
3. レスポンスをCompany[]型にマッピング
4. 結果を返却

---

#### パターン2: 株価データ取得（日付範囲指定）
```typescript
const client = new JQuantsClient(tokenManager);

// 日付範囲を指定して株価取得
const prices = await client.getDailyQuotes('7203', '2025-01-01', '2025-12-31');
console.log(prices); // StockPrice[]
```

**期待される動作**:
1. クエリパラメータを構築（`?code=7203&from=2025-01-01&to=2025-12-31`）
2. GET /prices/daily_quotes にリクエスト送信
3. レスポンスをStockPrice[]型にマッピング

---

### 🟡 エッジケース

#### エッジケース1: ネットワーク一時エラー（リトライ成功）
```typescript
const client = new JQuantsClient(tokenManager);

// 1回目: ネットワークエラー（TypeError）
// 2回目: 500エラー
// 3回目: 200 OK（成功）
const companies = await client.getListedInfo();
```

**期待される動作**:
1. 1回目: fetchがTypeErrorをスロー → リトライ対象と判定
2. 1秒待機
3. 2回目: 500エラー → リトライ対象と判定
4. 2秒待機
5. 3回目: 200 OK → 成功、結果を返却

**リトライログ例**:
```
[WARN] API呼び出し失敗（試行 1/3）: 1000ms後にリトライします... (TypeError: fetch failed)
[WARN] API呼び出し失敗（試行 2/3）: 2000ms後にリトライします... (500 Internal Server Error)
[INFO] API呼び出し成功（試行 3/3）
```

---

#### エッジケース2: タイムアウトエラー（5秒超過）
```typescript
const client = new JQuantsClient(tokenManager);

// J-Quants APIが5秒以内に応答しない
try {
  const companies = await client.getListedInfo();
} catch (error) {
  console.error(error); // Error: APIリクエストがタイムアウトしました（5秒）
}
```

**期待される動作**:
1. fetchを5秒間待機
2. AbortControllerでリクエストをキャンセル
3. タイムアウトエラーをスロー（リトライ対象）
4. 1秒待機後、2回目リトライ
5. 2回目もタイムアウト → 2秒待機後、3回目リトライ
6. 3回目もタイムアウト → エラーをスロー（最終的な失敗）

---

#### エッジケース3: 認証エラー（401）
```typescript
const client = new JQuantsClient(tokenManager);

// IDトークンが無効または期限切れ
try {
  const companies = await client.getListedInfo();
} catch (error) {
  console.error(error); // Error: 認証に失敗しました。IDトークンを再取得してください。
}
```

**期待される動作**:
1. GET /listed/info にリクエスト送信
2. 401エラーを受信
3. TokenManager.getIdToken()を呼び出し、新しいIDトークンを取得
4. 新しいトークンでリクエストを再実行
5. 成功すれば結果を返却、失敗すればエラーをスロー

---

### 🟡 エラーケース

#### エラーケース1: バリデーションエラー（400）
```typescript
const client = new JQuantsClient(tokenManager);

// 無効な銘柄コード
try {
  const prices = await client.getDailyQuotes('INVALID', '2025-01-01', '2025-12-31');
} catch (error) {
  console.error(error); // Error: 無効な銘柄コードです。4桁の数字を指定してください。
}
```

**期待される動作**:
1. GET /prices/daily_quotes にリクエスト送信
2. 400エラーを受信
3. リトライ対象外と判定
4. 即座にエラーをスロー（リトライなし）

---

#### エラーケース2: 最大リトライ回数超過
```typescript
const client = new JQuantsClient(tokenManager);

// 3回すべて失敗
try {
  const companies = await client.getListedInfo();
} catch (error) {
  console.error(error); // Error: APIリクエストに失敗しました（最大リトライ回数超過）
}
```

**期待される動作**:
1. 1回目: 500エラー → リトライ
2. 1秒待機
3. 2回目: 500エラー → リトライ
4. 2秒待機
5. 3回目: 500エラー → 最大リトライ回数超過
6. エラーをスロー

---

#### エラーケース3: レート制限エラー（429）
```typescript
const client = new JQuantsClient(tokenManager);

// APIレート制限に到達
const companies = await client.getListedInfo();
```

**期待される動作**:
1. GET /listed/info にリクエスト送信
2. 429エラーを受信（リトライ対象）
3. 1秒待機後、リトライ
4. 成功すれば結果を返却

---

### 参照情報
- **参照した要件**: REQ-601（リトライロジック）, REQ-603（タイムアウト）, EDGE-201（ネットワークエラー）, EDGE-202（APIエラー）
- **参照したタスク定義**: `docs/tasks/j-quants-phase1.md` (lines 459-486)

---

## 5. 要件との対応関係

### 🟡 参照したタスク定義
- **タスク定義**: `docs/tasks/j-quants-phase1.md` (lines 376-508)
  - TASK-0004の詳細仕様を全面的に参照

### 🟡 参照した要件（タスク定義から推定）
- **REQ-001**: リフレッシュトークン設定 → TokenManagerとの連携
- **REQ-002**: IDトークン取得 → request()メソッドでTokenManager.getIdToken()呼び出し
- **REQ-003**: トークンキャッシング → TokenManagerに委譲
- **REQ-004**: 認証失敗時の再取得 → 401エラー時にTokenManager.getIdToken()を再呼び出し
- **REQ-601**: リトライロジック → retryableRequest()メソッド、Exponential backoff（1秒→2秒）、最大3回
- **REQ-602**: エラーログ記録 → console.error()で記録（TASK-0005のLoggerに将来移行）
- **REQ-603**: タイムアウト制御 → AbortControllerで5秒タイムアウト

### 🟡 参照した型定義
- **型定義**: `src/types/index.ts`
  - `Company` interface (lines 20-33)
  - `StockPrice` interface (lines 41-60)
  - `FinancialStatements` interface (lines 68-81)
  - `CompanyInfo` interface (lines 153-165)
  - `RequestOptions` interface (lines 173-181)

### 🟡 参照した既存実装
- **TokenManager**: `src/auth/token-manager.ts`
  - getIdToken()メソッドの呼び出しパターン
  - リトライロジックのExponential backoff実装（RETRY_DELAYS_MS定数）
  - AbortControllerを使用したタイムアウト処理

---

## 6. TDD実装戦略

### Red Phase（失敗するテスト作成）
以下のテストケースを作成し、すべて失敗することを確認：

1. **TC-NORMAL-001**: 基本HTTPリクエスト（GET /listed/info）
2. **TC-NORMAL-002**: 認証ヘッダー付与（Bearer Token）
3. **TC-NORMAL-003**: 株価データ取得（クエリパラメータ付き）
4. **TC-RETRY-001**: リトライロジック（3回目成功）
5. **TC-RETRY-002**: Exponential backoff（1秒→2秒の待機時間）
6. **TC-RETRY-003**: 最大リトライ回数超過（3回すべて失敗）
7. **TC-TIMEOUT-001**: タイムアウト処理（5秒超過）
8. **TC-ERROR-001**: バリデーションエラー（400、リトライなし）
9. **TC-ERROR-002**: 認証エラー（401、トークン再取得）
10. **TC-ERROR-003**: レート制限エラー（429、リトライ対象）

### Green Phase（テストを通す実装）
JQuantsClientクラスを実装し、すべてのテストを合格させる。

### Refactor Phase（リファクタリング）
- コード重複の排除
- エラーハンドリングの統一
- 定数の抽出
- コメントの追加

---

## 7. 完了基準

- [ ] `src/api/j-quants-client.ts` が完成し、6つの主要メソッドが実装されている
- [ ] `src/api/endpoints.ts` が全エンドポイント定義を含む
- [ ] リトライロジックが Exponential backoff で実装されている
- [ ] タイムアウト処理が AbortController で実装されている（5秒）
- [ ] すべてのテストケース（10件以上）がパスしている
- [ ] TypeScript strict mode でエラーなし
- [ ] 要件定義書が作成されている（このファイル）

---

## 8. 作成予定ファイル

```
servers/j-quants/
├── src/
│   └── api/
│       ├── j-quants-client.ts (新規作成)
│       └── endpoints.ts (新規作成)
├── tests/
│   └── api/
│       └── j-quants-client.test.ts (新規作成)
└── docs/
    └── implements/
        └── j-quants/
            └── TASK-0004/
                ├── j-quants-client-requirements.md (✅ このファイル)
                ├── j-quants-client-testcases.md (次のステップで作成)
                └── j-quants-client-memo.md (開発履歴記録)
```

---

## 9. 信頼性レベルサマリー

| セクション | 信頼性レベル | 理由 |
|-----------|-------------|------|
| 機能の概要 | 🟡 黄信号 | タスク定義（j-quants-phase1.md）から抽出、妥当な推測 |
| 入力・出力の仕様 | 🟡 黄信号 | タスク定義 + src/types/index.ts から抽出、型定義は確実 |
| 制約条件 | 🟡 黄信号 | タスク定義のREQ-xxx参照、具体的な要件定義書は未存在 |
| 想定される使用例 | 🟡 黄信号 | タスク定義のテストケースから推定、実装パターンは確実 |
| 要件との対応関係 | 🟡 黄信号 | タスク定義のREQ-xxx IDのみ、詳細要件は未定義 |

**総合判定**: 🟡 **黄信号（要改善）**
- EARS要件定義書が存在しないため、タスク定義からの推測に依存
- 型定義とTokenManagerの実装パターンは参照可能で信頼性高
- 詳細な機能要件（REQ-001～REQ-603）の内容は未定義

**推奨アクション**:
- TASK-0004実装後、EARS要件定義書を逆生成（`/tsumiki:rev-requirements`）
- 実装中に不明点が発生した場合は、J-Quants API公式ドキュメントを参照

---

**作成者**: Claude (Sonnet 4.5)
**レビュー**: 未実施
**承認**: 未承認
**次のステップ**: `/tsumiki:tdd-testcases` でテストケースの洗い出しを行います。
