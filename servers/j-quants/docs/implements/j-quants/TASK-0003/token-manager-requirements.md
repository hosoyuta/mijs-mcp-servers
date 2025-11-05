# TASK-0003: 認証・トークン管理実装 - TDD要件定義書

**作成日**: 2025-10-29
**タスクID**: TASK-0003
**機能名**: 認証・トークン管理 (Authentication & Token Management)
**担当コンポーネント**: `src/auth/token-manager.ts`

---

## 1. 機能の概要

### 🔵 基本情報（EARS要件定義書・設計文書ベース）

**何をする機能か**:
J-Quants APIへの認証を管理し、リフレッシュトークンからIDトークンを取得・管理する機能です。IDトークンはJSONファイルにキャッシュされ、有効期限が切れた場合は自動的に再取得します。

**解決する問題**:
- J-Quants APIへのアクセスには認証トークン（IDトークン）が必要
- IDトークンには有効期限があり、期限切れ時に再取得が必要
- 毎回認証APIを呼ぶとパフォーマンスが低下するため、キャッシュが必要
- 認証失敗時のエラーハンドリングが必要

**想定されるユーザー**:
- MCPサーバー起動時（システム起動）
- J-Quants APIクライアント（APIリクエスト時の認証情報提供）
- トークン有効期限切れ検出時（自動再取得）

**システム内での位置づけ**:
```
MCPサーバー起動
    ↓
TokenManager (認証・トークン管理) ← このコンポーネント
    ↓
JQuantsClient (API呼び出し)
    ↓
J-Quants API
```

**参照したEARS要件**:
- REQ-001: システムは起動時にJ-Quants APIへの認証を実行しなければならない
- REQ-002: システムはリフレッシュトークンを使用してIDトークンを取得しなければならない
- REQ-003: システムは取得したIDトークンをJSONファイルにキャッシュしなければならない
- REQ-004: システムはAPIリクエスト時にIDトークンをAuthorizationヘッダーに付与しなければならない
- REQ-604: 認証トークンの有効期限が切れた場合、システムは自動的にトークンを再取得しなければならない
- REQ-1101: システムはAPIキー・リフレッシュトークンを環境変数（.env）から読み込まなければならない

**参照した設計文書**:
- **アーキテクチャ**: `architecture.md` 第4章「認証モジュール」
- **データフロー**: `dataflow.md` Phase 1「起動・認証フロー」「トークン再取得フロー」
- **API統合**: `api-integration.md` 「認証エンドポイント」セクション

---

## 2. 入力・出力の仕様

### 🔵 TokenManager クラスのインターフェース（interfaces.ts・設計文書ベース）

#### コンストラクタ

```typescript
constructor(config: {
  refreshToken: string;        // 環境変数 J_QUANTS_REFRESH_TOKEN から取得
  cacheDir?: string;           // デフォルト: 'data'
  apiBaseUrl?: string;         // デフォルト: 'https://api.jquants.com/v1'
})
```

**入力パラメータ**:
- `refreshToken` (必須): J-Quants APIのリフレッシュトークン
- `cacheDir` (オプション): トークンキャッシュファイルの保存ディレクトリ
- `apiBaseUrl` (オプション): J-Quants APIのベースURL

#### 主要メソッド

##### 1. `getIdToken(): Promise<string>`

**目的**: IDトークンを取得（キャッシュ優先、期限切れ時は再取得）

**入力**: なし

**出力**:
- `Promise<string>` - 有効なIDトークン

**処理フロー**:
1. `loadCachedToken()` でキャッシュを確認
2. キャッシュが存在し有効 → キャッシュのトークンを返却
3. キャッシュが存在しないor期限切れ → `refreshToken()` で新規取得
4. 新しいトークンをキャッシュに保存
5. 新しいトークンを返却

**例外**:
- `MISSING_API_KEY`: 環境変数 `J_QUANTS_REFRESH_TOKEN` が未設定
- `AUTHENTICATION_FAILED`: 認証API呼び出しが失敗

**要件根拠**: REQ-002, REQ-003, REQ-604

---

##### 2. `cacheToken(token: string, expiresIn: number): void`

**目的**: IDトークンをJSONファイルにキャッシュ

**入力**:
- `token` (string): IDトークン
- `expiresIn` (number): 有効期限（秒単位、例: 3600 = 1時間）

**出力**: なし（void）

**処理内容**:
1. 現在時刻（`issued_at`）を記録
2. 有効期限（`expires_at`）を計算: `issued_at + expiresIn * 1000`
3. `TokenCache` 型のJSONオブジェクトを作成
4. `data/token.json` に保存（アトミック書き込み）

**保存形式** (`data/token.json`):
```json
{
  "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "obtained_at": "2025-10-29T10:00:00.000Z",
  "expires_at": "2025-10-29T11:00:00.000Z"
}
```

**例外**:
- `FILE_WRITE_ERROR`: ファイル書き込みに失敗

**要件根拠**: REQ-003

**参照した設計文書**: `interfaces.ts` - `TokenCache` インターフェース

---

##### 3. `loadCachedToken(): TokenCache | null`

**目的**: キャッシュファイルからトークン情報を読み込み

**入力**: なし

**出力**:
- `TokenCache | null` - キャッシュが存在すれば `TokenCache` オブジェクト、なければ `null`

**処理内容**:
1. `data/token.json` の存在確認
2. ファイルが存在 → JSONパース
3. ファイルが存在しない → `null` 返却
4. パースエラー → `null` 返却（ログ記録）

**型定義**:
```typescript
interface TokenCache {
  id_token: string;
  obtained_at: string;  // ISO 8601形式
  expires_at: string;   // ISO 8601形式
}
```

**例外**: なし（エラー時は `null` 返却）

**要件根拠**: REQ-003

**参照した設計文書**: `interfaces.ts` - `TokenCache` インターフェース（287-293行目）

---

##### 4. `isTokenExpired(expiresAt: string): boolean`

**目的**: トークンの有効期限をチェック（300秒の余裕を持たせる）

**入力**:
- `expiresAt` (string): 有効期限（ISO 8601形式）

**出力**:
- `boolean` - 期限切れなら `true`、有効なら `false`

**判定ロジック**:
```typescript
const now = Date.now();
const expires = new Date(expiresAt).getTime();
const SAFETY_MARGIN = 300 * 1000; // 5分（300秒）の余裕

return now >= (expires - SAFETY_MARGIN);
```

**例**:
- 現在時刻: 2025-10-29 10:56:00
- 有効期限: 2025-10-29 11:00:00
- 判定: `10:56:00 >= 10:55:00` → `true` (期限切れ扱い)

**余裕を持たせる理由**:
- APIリクエスト中にトークンが期限切れになることを防ぐ
- ネットワーク遅延やAPIレスポンス待ち時間を考慮

**要件根拠**: REQ-604 (トークン有効期限管理)

---

##### 5. `refreshToken(): Promise<string>`

**目的**: J-Quants APIから新しいIDトークンを取得

**入力**: なし（コンストラクタの `refreshToken` を使用）

**出力**:
- `Promise<string>` - 新しいIDトークン

**APIリクエスト仕様**:
- **エンドポイント**: `POST /token/auth_user`
- **ヘッダー**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **ボディ**:
  ```json
  {
    "refreshtoken": "<refresh_token>"
  }
  ```

**APIレスポンス（成功時）**:
- **ステータスコード**: `200 OK`
- **ボディ**:
  ```json
  {
    "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

**処理フロー**:
1. fetch APIでPOSTリクエスト送信
2. レスポンスステータスコード確認
3. `200 OK` → `idToken` 抽出
4. `401 Unauthorized` → `AUTHENTICATION_FAILED` エラー
5. その他エラー → `API_ERROR` エラー
6. 取得したトークンを `cacheToken()` でキャッシュ
7. トークンを返却

**例外**:
- `AUTHENTICATION_FAILED` (401): リフレッシュトークンが無効
- `API_ERROR` (500, 503等): API側のエラー
- `NETWORK_ERROR`: ネットワーク接続エラー
- `API_TIMEOUT`: 5秒以内にレスポンスがない

**要件根拠**: REQ-002, REQ-604

**参照した設計文書**:
- `api-integration.md` - 「認証エンドポイント」（30-84行目）
- `dataflow.md` - 「トークン再取得フロー」（90-116行目）

---

### 🔵 型定義（interfaces.tsより）

#### TokenCache

```typescript
/**
 * トークンキャッシュ
 * 要件根拠: REQ-003
 */
export interface TokenCache {
  /** IDトークン */
  id_token: string;
  /** 取得日時（ISO 8601形式） */
  obtained_at: string;
  /** 有効期限（ISO 8601形式） */
  expires_at: string;
}
```

**データフロー**: `dataflow.md` Phase 1 - 起動・認証フロー（50行目、FS: FileSystem - data/token.json）

---

## 3. 制約条件

### 🔵 パフォーマンス要件（NFR-001, NFR-002）

- **NFR-002**: システムは起動時の認証処理を10秒以内に完了しなければならない
  - `refreshToken()` メソッドのタイムアウト: 5秒
  - キャッシュ読み込み: 1秒以内
  - 合計: 6秒以内（10秒以内の要件を満たす）

### 🔵 セキュリティ要件（REQ-1101, REQ-1102, REQ-1103）

- **REQ-1101**: APIキー・リフレッシュトークンを環境変数（.env）から読み込まなければならない
  - `J_QUANTS_REFRESH_TOKEN` 環境変数を使用
  - コード内にハードコードしない

- **REQ-1102**: システムは.envファイルを.gitignoreに含めなければならない
  - `.gitignore` に `.env` と `data/` を追加
  - トークンキャッシュファイルもバージョン管理から除外

- **REQ-1103**: システムは個人情報を扱ってはならない
  - トークンファイルには認証情報のみ保存（個人情報なし）

### 🔵 アーキテクチャ制約（architecture.md）

- **レイヤードアーキテクチャ**: TokenManager は「API Client Layer」の一部
- **単一責任原則**: 認証とトークン管理のみを担当
- **依存関係**:
  - 上位: MCPサーバー本体、JQuantsClient
  - 下位: FileSystem（data/token.json）、J-Quants API

### 🔵 データストレージ制約（REQ-1003）

- **ストレージ形式**: JSONファイル（`data/token.json`）
- **理由**: tech-stack.md によるデータストレージ選定（シンプル、セットアップ不要）
- **制約**: データベース不使用、アトミック書き込み必須

### 🟡 エラーハンドリング制約（REQ-601, REQ-602）

- **リトライロジック**: 認証API呼び出し失敗時、最大3回まで自動リトライ
  - リトライ対象: 5xx、ネットワークエラー
  - リトライ対象外: 401（認証失敗）、400（バリデーションエラー）
- **ログ記録**: すべてのエラーを `logs/error.log` に記録
- **日本語エラーメッセージ**: NFR-301 に準拠

**参照したEARS要件**:
- REQ-601: API呼び出しが一時的エラーで失敗した場合、最大3回まで自動リトライ
- REQ-602: API呼び出しが失敗した場合、エラー内容をログファイルに記録

**参照した設計文書**: `architecture.md` - 「エラーハンドリング戦略」（403-454行目）

---

## 4. 想定される使用例

### 🔵 基本的な使用パターン（REQ-001, REQ-002, REQ-003）

#### シナリオ1: MCPサーバー起動時（初回）

**前提条件**:
- `data/token.json` が存在しない（初回起動）
- 環境変数 `J_QUANTS_REFRESH_TOKEN` が設定済み

**処理フロー**:
```typescript
// src/index.ts（MCPサーバー起動時）
const refreshToken = process.env.J_QUANTS_REFRESH_TOKEN!;
const tokenManager = new TokenManager({ refreshToken });

// IDトークン取得
const idToken = await tokenManager.getIdToken();
// → 内部で refreshToken() を呼び出し
// → J-Quants APIから新しいIDトークン取得
// → data/token.json に保存
// → IDトークンを返却
```

**期待結果**:
1. J-Quants API `/token/auth_user` が呼ばれる
2. `data/token.json` が作成され、IDトークンが保存される
3. `getIdToken()` がIDトークンを返す

**要件根拠**: REQ-001, REQ-002, REQ-003

**データフロー**: `dataflow.md` - 「システム起動時の認証」（41-78行目）

---

#### シナリオ2: MCPサーバー起動時（2回目以降、キャッシュ有効）

**前提条件**:
- `data/token.json` が存在し、トークンが有効（有効期限内）

**処理フロー**:
```typescript
const tokenManager = new TokenManager({ refreshToken });
const idToken = await tokenManager.getIdToken();
// → loadCachedToken() でキャッシュを読み込み
// → isTokenExpired() で有効期限チェック → 有効
// → キャッシュのIDトークンを返却
```

**期待結果**:
1. API呼び出しなし（キャッシュから取得）
2. `getIdToken()` が即座にキャッシュのトークンを返す
3. 高速（< 1秒）

**パフォーマンス**: NFR-002（10秒以内）を大幅に上回る

**データフロー**: `dataflow.md` - 「トークンキャッシュが存在し有効」（60-64行目）

---

#### シナリオ3: トークン有効期限切れ時（自動再取得）

**前提条件**:
- `data/token.json` が存在するが、有効期限切れ（または5分以内に期限切れ）
- `isTokenExpired()` が `true` を返す

**処理フロー**:
```typescript
const idToken = await tokenManager.getIdToken();
// → loadCachedToken() でキャッシュを読み込み
// → isTokenExpired() で有効期限チェック → 期限切れ
// → refreshToken() で新しいIDトークン取得
// → cacheToken() でキャッシュ更新
// → 新しいIDトークンを返却
```

**期待結果**:
1. J-Quants API `/token/auth_user` が呼ばれる
2. 新しいIDトークンが取得される
3. `data/token.json` が更新される
4. 新しいIDトークンが返される

**要件根拠**: REQ-604（認証トークンの有効期限が切れた場合、自動的に再取得）

**データフロー**: `dataflow.md` - 「トークン再取得フロー」（90-116行目）

---

### 🟡 エッジケース（EDGE-003, EDGE-201, EDGE-202）

#### エッジケース1: 環境変数未設定（EDGE-003）

**前提条件**:
- 環境変数 `J_QUANTS_REFRESH_TOKEN` が未設定

**処理フロー**:
```typescript
const refreshToken = process.env.J_QUANTS_REFRESH_TOKEN;
if (!refreshToken) {
  throw new Error(ErrorCode.MISSING_API_KEY);
}
```

**期待結果**:
- エラーコード: `MISSING_API_KEY`
- エラーメッセージ（日本語）: 「環境変数 J_QUANTS_REFRESH_TOKEN を設定してください」
- MCPサーバー起動失敗

**要件根拠**: EDGE-003（APIキーが未設定の場合のエラーメッセージ）

**参照した設計文書**: `dataflow.md` - 「認証エラー」（71-76行目）

---

#### エッジケース2: 認証API呼び出し失敗（401 Unauthorized）

**前提条件**:
- リフレッシュトークンが無効（期限切れ、削除済み等）

**処理フロー**:
```typescript
const response = await fetch(API_URL, { ... });
if (response.status === 401) {
  throw new Error(ErrorCode.AUTHENTICATION_FAILED);
}
```

**期待結果**:
- エラーコード: `AUTHENTICATION_FAILED`
- エラーメッセージ（日本語）: 「認証に失敗しました。APIキーを確認してください」
- ログファイルに記録

**要件根拠**: REQ-602（エラー内容をログファイルに記録）

**参照した設計文書**: `api-integration.md` - 「レスポンス（エラー時）」（72-83行目）

---

#### エッジケース3: J-Quants APIメンテナンス中（EDGE-201）

**前提条件**:
- J-Quants APIが503 Service Unavailableを返す

**処理フロー**:
```typescript
const response = await fetch(API_URL, { ... });
if (response.status === 503) {
  // リトライロジック実行（最大3回）
  // 3回失敗後
  throw new Error(ErrorCode.API_MAINTENANCE);
}
```

**期待結果**:
- 最大3回自動リトライ（REQ-601）
- 3回失敗後、エラーコード: `API_MAINTENANCE`
- エラーメッセージ（日本語）: 「J-Quants APIがメンテナンス中です。しばらく時間をおいてから再試行してください」
- ログファイルに記録

**要件根拠**:
- EDGE-201（APIメンテナンス中のエラーメッセージ）
- REQ-601（最大3回まで自動リトライ）

---

#### エッジケース4: ネットワーク接続エラー（EDGE-202）

**前提条件**:
- インターネット接続が切断されている

**処理フロー**:
```typescript
try {
  const response = await fetch(API_URL, { ... });
} catch (error) {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    throw new Error(ErrorCode.NETWORK_ERROR);
  }
}
```

**期待結果**:
- エラーコード: `NETWORK_ERROR`
- エラーメッセージ（日本語）: 「ネットワークに接続できません。インターネット接続を確認してください」
- ログファイルに記録

**要件根拠**: EDGE-202（ネットワーク接続エラーのメッセージ）

---

#### エッジケース5: トークンキャッシュファイル破損

**前提条件**:
- `data/token.json` が存在するが、JSONとしてパース不可能

**処理フロー**:
```typescript
loadCachedToken() {
  try {
    const data = fs.readFileSync('data/token.json', 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // パースエラー → null返却、ログ記録
    logger.warn('トークンキャッシュファイルの読み込みに失敗しました', error);
    return null;
  }
}
```

**期待結果**:
- `loadCachedToken()` が `null` を返す
- `getIdToken()` が新しいトークンを取得
- 破損したキャッシュは上書きされる
- ログに警告が記録される

**要件根拠**: REQ-602（エラーログ記録）、NFR-102（エラー時もクラッシュしない）

---

### 🔵 エラーケース（EARS要件に基づく）

#### エラーケース1: APIタイムアウト（REQ-603）

**前提条件**:
- J-Quants APIのレスポンスが5秒以内に返らない

**処理フロー**:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(API_URL, {
    signal: controller.signal,
    ...
  });
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error(ErrorCode.API_TIMEOUT);
  }
} finally {
  clearTimeout(timeoutId);
}
```

**期待結果**:
- エラーコード: `API_TIMEOUT`
- エラーメッセージ（日本語）: 「APIの応答がタイムアウトしました（5秒）」
- ログファイルに記録

**要件根拠**:
- REQ-603（APIリクエストが5秒以内に完了しない場合、タイムアウトエラー）
- NFR-001（1つのAPIリクエストを5秒以内に完了）

**参照した設計文書**: `architecture.md` - 「タイムアウト処理」（428-442行目）

---

## 5. EARS要件・設計文書との対応関係

### 参照したユーザストーリー

- **ストーリー名**: なし（インフラストラクチャコンポーネントのため、直接的なユーザーストーリーなし）
- **関連ストーリー**: すべてのMCPツールが間接的に依存（認証が前提）

### 参照した機能要件

- **REQ-001** 🔵: システムは起動時にJ-Quants APIへの認証を実行しなければならない
- **REQ-002** 🔵: システムはリフレッシュトークンを使用してIDトークンを取得しなければならない
- **REQ-003** 🔵: システムは取得したIDトークンをJSONファイルにキャッシュしなければならない
- **REQ-004** 🔵: システムはAPIリクエスト時にIDトークンをAuthorizationヘッダーに付与しなければならない
- **REQ-604** 🔵: 認証トークンの有効期限が切れた場合、システムは自動的にトークンを再取得しなければならない
- **REQ-601** 🔵: API呼び出しが一時的エラーで失敗した場合、最大3回まで自動リトライ
- **REQ-602** 🔵: API呼び出しが失敗した場合、エラー内容をログファイルに記録
- **REQ-603** 🔵: APIリクエストが5秒以内に完了しない場合、タイムアウトエラーを返却

### 参照した非機能要件

- **NFR-001** 🔵: システムは1つのAPIリクエストを5秒以内に完了
- **NFR-002** 🟡: システムは起動時の認証処理を10秒以内に完了
- **NFR-102** 🔵: システムはネットワークエラー時にクラッシュしてはならない
- **NFR-201** 🔵: TypeScript strict modeで型安全性を確保
- **NFR-301** 🔵: エラーメッセージを日本語で分かりやすく表示

### 参照したEdgeケース

- **EDGE-003** 🔵: APIキーが未設定の場合のエラーメッセージ
- **EDGE-201** 🟡: J-Quants APIメンテナンス中のエラーメッセージ
- **EDGE-202** 🟡: ネットワーク接続エラーのメッセージ

### 参照した受け入れ基準

**REQ-001, REQ-002, REQ-003の受け入れ基準** (j-quants-acceptance-criteria.md より):

**Given（前提条件）**:
- 環境変数 `J_QUANTS_REFRESH_TOKEN` が設定済み

**When（実行条件）**:
- MCPサーバーを起動する

**Then（期待結果）**:
- J-Quants API `/token/auth_user` が呼ばれる
- IDトークンが取得される
- `data/token.json` にトークンが保存される
- サーバーが正常に起動する

### 参照した設計文書

#### アーキテクチャ (architecture.md)

- **第4章「認証モジュール」（133-156行目）**:
  - TokenManager の責務とメソッド定義
  - data/token.json のデータファイル仕様
  - 要件根拠: REQ-001～REQ-004, REQ-604, REQ-1003

- **第11章「エラーハンドリング戦略」（403-454行目）**:
  - リトライロジック（最大3回、Exponential backoff）
  - タイムアウト処理（5秒、AbortController使用）
  - エラーメッセージ（日本語）

#### データフロー (dataflow.md)

- **Phase 1「起動・認証フロー」（39-87行目）**:
  - システム起動時の認証シーケンス図
  - キャッシュ読み込み → 有効期限チェック → 再取得フロー
  - エラーハンドリング（401 Unauthorized時）

- **Phase 1「トークン再取得フロー」（90-120行目）**:
  - 有効期限切れ検出 → refreshToken() 呼び出し
  - 新しいIDトークン取得 → キャッシュ更新
  - HTTPリクエスト再実行

#### 型定義 (interfaces.ts)

- **TokenCache インターフェース（287-293行目）**:
  ```typescript
  export interface TokenCache {
    id_token: string;
    obtained_at: string;
    expires_at: string;
  }
  ```

- **EnvironmentConfig インターフェース（299-308行目）**:
  ```typescript
  export interface EnvironmentConfig {
    J_QUANTS_REFRESH_TOKEN: string;
    J_QUANTS_API_BASE_URL?: string;
    DEBUG?: string;
    LOG_LEVEL?: 'error' | 'warn' | 'info' | 'debug';
  }
  ```

- **ErrorCode 列挙型（318-344行目）**:
  - `MISSING_API_KEY`, `AUTHENTICATION_FAILED`, `TOKEN_EXPIRED`
  - `API_ERROR`, `API_TIMEOUT`, `NETWORK_ERROR`

#### API統合 (api-integration.md)

- **「認証エンドポイント」セクション（28-106行目）**:
  - POST /token/auth_user のリクエスト・レスポンス仕様
  - 成功時: 200 OK + `{ "idToken": "..." }`
  - エラー時: 401 Unauthorized + `{ "message": "Authentication failed" }`

---

## 6. 実装時の注意事項

### 🔵 必須実装事項

1. **TypeScript strict mode対応**（NFR-201）
   - `tsconfig.json` で `"strict": true` を設定
   - すべての型を明示的に定義
   - `any` 型の使用を最小限に

2. **環境変数の管理**（REQ-1101）
   - `dotenv` パッケージで `.env` を読み込み
   - 環境変数が未設定の場合、明確なエラーメッセージ
   - `.env.example` にサンプルを提供

3. **アトミックなファイル書き込み**（REQ-1003）
   - `fs.writeFileSync()` ではなく、一時ファイル → rename の手法を推奨
   - 書き込み中のクラッシュでファイル破損を防ぐ

4. **ログ記録**（REQ-602）
   - すべてのエラーを `logs/error.log` に記録
   - ログ形式: `[YYYY-MM-DD HH:mm:ss] [ERROR] メッセージ`

5. **日本語エラーメッセージ**（NFR-301）
   - エラーコード → 日本語メッセージのマッピング
   - ユーザーフレンドリーな表現

### 🟡 推奨実装事項

1. **有効期限の余裕**
   - 5分（300秒）の余裕を持たせる
   - APIリクエスト中の期限切れを防ぐ

2. **キャッシュファイルの検証**
   - JSONパース時のエラーハンドリング
   - 不正なデータの場合は再取得

3. **リトライロジックの実装**
   - Exponential backoff（1秒、2秒、4秒）
   - リトライ対象: 5xx、503、ネットワークエラー
   - リトライ対象外: 401、400

### 🔴 実装禁止事項

1. **トークンのハードコード**
   - リフレッシュトークンやIDトークンをコード内に記述しない

2. **キャッシュファイルのバージョン管理**
   - `data/token.json` を `.gitignore` に追加必須

3. **個人情報の保存**
   - トークンファイルには認証情報のみ保存

---

## 7. テスト観点（次のステップで詳細化）

### 正常系

- [ ] IDトークン取得（初回、キャッシュなし）
- [ ] IDトークン取得（キャッシュあり、有効期限内）
- [ ] トークン有効期限切れ時の自動再取得
- [ ] トークンキャッシュの読み書き

### 異常系

- [ ] 環境変数未設定時のエラー
- [ ] 認証API呼び出し失敗（401）
- [ ] ネットワークエラー
- [ ] APIタイムアウト（5秒）
- [ ] キャッシュファイル破損

### エッジケース

- [ ] 有効期限5分前のトークン（自動再取得）
- [ ] APIメンテナンス中（503）
- [ ] リトライ3回失敗

---

## 8. 品質基準

### ✅ 高品質判定基準

- [x] **要件の曖昧さ**: なし
  - すべての要件がEARS要件定義書・設計文書から明確に抽出
  - REQ-001～REQ-604、NFR-001～NFR-301、EDGE-003等を参照

- [x] **入出力定義**: 完全
  - 5つの主要メソッドの入出力を詳細に定義
  - TokenCache、EnvironmentConfig等の型定義を明示

- [x] **制約条件**: 明確
  - パフォーマンス要件（10秒以内、5秒タイムアウト）
  - セキュリティ要件（環境変数、.gitignore）
  - アーキテクチャ制約（レイヤードアーキテクチャ）

- [x] **実装可能性**: 確実
  - architecture.md、dataflow.md、api-integration.mdから実装詳細を抽出
  - コード例、APIエンドポイント、データ構造が明確

**判定結果**: ✅ **高品質** - TDD実装に着手可能

---

## 9. 次のステップ

次のお勧めステップ: **`/tsumiki:tdd-testcases`** でテストケースの洗い出しを行います。

この要件定義書に基づいて、以下のテストケースを作成します:
- 正常系テスト（5パターン）
- 異常系テスト（5パターン）
- エッジケーステスト（5パターン）
- 統合テスト（認証フロー全体）

---

**作成者**: Claude Code (TDD Requirements Agent)
**最終更新**: 2025-10-29
