# TASK-0003: Token Manager テストケース仕様書

**作成日**: 2025-10-29
**タスクID**: TASK-0003
**機能名**: 認証・トークン管理 (Token Manager)
**担当コンポーネント**: `src/auth/token-manager.ts`

---

## 目次
1. [言語・テストフレームワーク](#1-言語テストフレームワーク-)
2. [正常系テストケース](#2-正常系テストケース正常系テストケース)
3. [異常系テストケース](#3-異常系テストケース異常系テストケース)
4. [境界値テストケース](#4-境界値テストケース境界値テストケース)
5. [テスト実装ガイドライン](#5-テスト実装ガイドライン)

---

## 1. 言語・テストフレームワーク 🔵

### 開発言語
- **言語**: TypeScript 5.x
- **ランタイム**: Node.js 20 LTS

### テストフレームワーク
- **テストフレームワーク**: Vitest
- **テストランナー**: Vitest CLI
- **アサーション**: Vitest標準アサーション
- **モック**: Vitest標準モック機能

### 選択理由（tech-stack.mdより）
- **高速実行**: Vitestは高速なテスト実行が可能
- **TypeScript標準サポート**: 型定義が完全にサポートされている
- **モダンなAPI**: Jest互換でありながら、より直感的なAPI
- **ホットリロード**: テストファイル変更時の自動再実行
- **チームの技術スタック**: プロジェクト全体でVitest採用済み

### テスト実行コマンド
```bash
# 全テスト実行
npm test

# ウォッチモード（開発時）
npm run test:watch

# カバレッジ付き実行
npm run test:coverage
```

---

## 2. 正常系テストケース（正常系テストケース）

### TC-NORMAL-001: 初回起動時のIDトークン取得 🔵

**何をテストするか**:
初回起動時（キャッシュファイルが存在しない場合）に、J-Quants APIから新しいIDトークンを取得し、キャッシュファイルに保存できることを確認する。

**期待される動作**:
1. キャッシュファイル（`data/token.json`）が存在しない
2. `getIdToken()` を呼び出す
3. 内部で `refreshToken()` が実行される
4. J-Quants API `/token/auth_user` が呼ばれる
5. レスポンスから `idToken` が抽出される
6. `cacheToken()` でキャッシュファイルが作成される
7. IDトークンが返却される

**入力値**:
- `refreshToken`: `"valid_refresh_token_abc123"`（有効なリフレッシュトークン）
- キャッシュファイル: 存在しない

**入力データの意味**:
- リフレッシュトークンは環境変数 `J_QUANTS_REFRESH_TOKEN` から取得される、J-Quants APIの認証情報

**期待される結果**:
- APIレスポンス: `{ "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }`
- キャッシュファイル作成: `data/token.json` に以下の形式で保存
  ```json
  {
    "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "obtained_at": "2025-10-29T10:00:00.000Z",
    "expires_at": "2025-10-29T11:00:00.000Z"
  }
  ```
- 返却値: `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`

**期待結果の理由**:
- REQ-002: リフレッシュトークンを使用してIDトークンを取得する必要がある
- REQ-003: 取得したIDトークンをJSONファイルにキャッシュする必要がある
- NFR-002: 10秒以内に認証処理を完了する必要がある

**テストの目的**:
- 初回起動時の認証フローが正しく動作することを保証
- APIリクエストが正しく送信されることを確認
- キャッシュファイルが正しい形式で作成されることを確認

**確認ポイント**:
- [x] `fetch()` が1回呼ばれる（URL: `/token/auth_user`、Method: `POST`）
- [x] リクエストボディに `{ "refreshtoken": "valid_refresh_token_abc123" }` が含まれる
- [x] `data/token.json` ファイルが作成される
- [x] ファイル内容が `TokenCache` インターフェースに準拠している
- [x] `getIdToken()` の返り値がAPIレスポンスの `idToken` と一致する

**信頼性レベル**: 🔵 高（EARS要件定義書・設計文書ベース）

**参照要件**:
- REQ-001: システムは起動時にJ-Quants APIへの認証を実行しなければならない
- REQ-002: システムはリフレッシュトークンを使用してIDトークンを取得しなければならない
- REQ-003: システムは取得したIDトークンをJSONファイルにキャッシュしなければならない

---

### TC-NORMAL-002: キャッシュからのIDトークン取得 🔵

**何をテストするか**:
有効なトークンキャッシュが存在する場合、API呼び出しを行わずにキャッシュからIDトークンを取得できることを確認する。

**期待される動作**:
1. 有効なキャッシュファイル（`data/token.json`）が存在する
2. トークンの有効期限が未来（5分以上先）である
3. `getIdToken()` を呼び出す
4. `loadCachedToken()` でキャッシュを読み込む
5. `isTokenExpired()` で有効期限チェック → `false`（有効）
6. API呼び出しなし
7. キャッシュのIDトークンを即座に返却

**入力値**:
- キャッシュファイル（`data/token.json`）:
  ```json
  {
    "id_token": "cached_token_xyz789",
    "obtained_at": "2025-10-29T10:00:00.000Z",
    "expires_at": "2025-10-29T11:00:00.000Z"
  }
  ```
- 現在時刻: `2025-10-29T10:30:00.000Z`（有効期限まで30分）

**入力データの意味**:
- `id_token`: 過去に取得してキャッシュされたIDトークン
- `obtained_at`: トークンを取得した時刻（ISO 8601形式）
- `expires_at`: トークンの有効期限（ISO 8601形式、取得から1時間後）

**期待される結果**:
- API呼び出し: なし（`fetch()` が呼ばれない）
- 返却値: `"cached_token_xyz789"`
- 実行時間: < 100ミリ秒（ファイル読み込みのみ）

**期待結果の理由**:
- REQ-003: キャッシュされたトークンを利用することで、API呼び出しの回数を削減
- NFR-002: 認証処理を高速化（10秒以内 → 100ミリ秒）
- パフォーマンス向上: 不要なネットワークリクエストを避ける

**テストの目的**:
- キャッシュメカニズムが正しく動作することを保証
- 有効なトークンが存在する場合、API呼び出しが発生しないことを確認
- パフォーマンス要件（高速レスポンス）を満たすことを確認

**確認ポイント**:
- [x] `fetch()` が呼ばれない
- [x] `loadCachedToken()` が呼ばれる
- [x] `isTokenExpired()` が `false` を返す
- [x] `getIdToken()` の返り値がキャッシュの `id_token` と一致する
- [x] 実行時間が100ミリ秒未満

**信頼性レベル**: 🔵 高（EARS要件定義書・設計文書ベース）

**参照要件**:
- REQ-003: システムは取得したIDトークンをJSONファイルにキャッシュしなければならない
- NFR-002: システムは起動時の認証処理を10秒以内に完了しなければならない

---

### TC-NORMAL-003: トークン有効期限切れ時の自動再取得 🔵

**何をテストするか**:
キャッシュされたトークンが有効期限切れの場合、自動的に新しいトークンを取得し、キャッシュを更新できることを確認する。

**期待される動作**:
1. 期限切れのキャッシュファイルが存在する
2. `getIdToken()` を呼び出す
3. `isTokenExpired()` で有効期限チェック → `true`（期限切れ）
4. `refreshToken()` で新しいトークンを取得
5. `cacheToken()` でキャッシュを更新
6. 新しいIDトークンを返却

**入力値**:
- キャッシュファイル（`data/token.json`）:
  ```json
  {
    "id_token": "expired_token_old123",
    "obtained_at": "2025-10-29T09:00:00.000Z",
    "expires_at": "2025-10-29T10:00:00.000Z"
  }
  ```
- 現在時刻: `2025-10-29T10:30:00.000Z`（有効期限から30分経過）
- リフレッシュトークン: `"valid_refresh_token_abc123"`

**入力データの意味**:
- 古いトークンの有効期限（`expires_at`）が現在時刻より過去
- 有効期限切れのため、新しいトークンの取得が必要

**期待される結果**:
- API呼び出し: 1回（`POST /token/auth_user`）
- APIレスポンス: `{ "idToken": "new_token_fresh456" }`
- キャッシュファイル更新:
  ```json
  {
    "id_token": "new_token_fresh456",
    "obtained_at": "2025-10-29T10:30:00.000Z",
    "expires_at": "2025-10-29T11:30:00.000Z"
  }
  ```
- 返却値: `"new_token_fresh456"`

**期待結果の理由**:
- REQ-604: 認証トークンの有効期限が切れた場合、自動的にトークンを再取得する必要がある
- トークン有効期限管理: 期限切れトークンでAPIリクエストが失敗するのを防ぐ

**テストの目的**:
- トークン自動更新メカニズムが正しく動作することを保証
- 有効期限切れの検出が正確であることを確認
- キャッシュ更新が正しく行われることを確認

**確認ポイント**:
- [x] `isTokenExpired()` が `true` を返す
- [x] `refreshToken()` が呼ばれる
- [x] `fetch()` が1回呼ばれる
- [x] キャッシュファイルが新しい内容で更新される
- [x] 返却値が新しいトークンと一致する

**信頼性レベル**: 🔵 高（EARS要件定義書・設計文書ベース）

**参照要件**:
- REQ-604: 認証トークンの有効期限が切れた場合、システムは自動的にトークンを再取得しなければならない
- REQ-003: 更新されたトークンをJSONファイルにキャッシュしなければならない

---

### TC-NORMAL-004: トークンキャッシュの保存 🔵

**何をテストするか**:
IDトークンを正しい形式でJSONファイルにキャッシュできることを確認する。

**期待される動作**:
1. `cacheToken()` を呼び出す
2. 現在時刻（`obtained_at`）を記録
3. 有効期限（`expires_at`）を計算: `obtained_at + expiresIn * 1000`
4. `TokenCache` 型のJSONオブジェクトを作成
5. `data/token.json` に保存

**入力値**:
- `token`: `"test_token_abc123"`
- `expiresIn`: `3600`（秒、1時間）
- 現在時刻: `2025-10-29T10:00:00.000Z`

**入力データの意味**:
- `token`: APIから取得したIDトークン
- `expiresIn`: トークンの有効期限（秒単位、APIレスポンスに含まれる）

**期待される結果**:
- ファイルパス: `data/token.json`
- ファイル内容:
  ```json
  {
    "id_token": "test_token_abc123",
    "obtained_at": "2025-10-29T10:00:00.000Z",
    "expires_at": "2025-10-29T11:00:00.000Z"
  }
  ```
- ファイルパーミッション: 読み書き可能
- ファイル形式: UTF-8エンコードされたJSON

**期待結果の理由**:
- REQ-003: IDトークンをJSONファイルにキャッシュする必要がある
- データフォーマット: `TokenCache` インターフェースに準拠
- ISO 8601形式: 日時データの国際標準形式を使用

**テストの目的**:
- トークンキャッシュの保存処理が正しく動作することを保証
- ファイル形式が仕様に準拠していることを確認
- 日時計算が正確であることを確認

**確認ポイント**:
- [x] `data/token.json` ファイルが作成される
- [x] ファイル内容がJSONとしてパース可能
- [x] `id_token`、`obtained_at`、`expires_at` フィールドが存在
- [x] `obtained_at` が現在時刻と一致
- [x] `expires_at` が `obtained_at + 3600秒` と一致
- [x] 日時が ISO 8601 形式

**信頼性レベル**: 🔵 高（EARS要件定義書・設計文書ベース）

**参照要件**:
- REQ-003: システムは取得したIDトークンをJSONファイルにキャッシュしなければならない
- `interfaces.ts` - `TokenCache` インターフェース

---

### TC-NORMAL-005: トークンキャッシュの読み込み 🔵

**何をテストするか**:
キャッシュファイルから正しくトークン情報を読み込めることを確認する。

**期待される動作**:
1. `loadCachedToken()` を呼び出す
2. `data/token.json` の存在を確認
3. ファイルが存在する場合、JSONをパース
4. `TokenCache` 型のオブジェクトを返却

**入力値**:
- キャッシュファイル（`data/token.json`）:
  ```json
  {
    "id_token": "cached_token_xyz789",
    "obtained_at": "2025-10-29T10:00:00.000Z",
    "expires_at": "2025-10-29T11:00:00.000Z"
  }
  ```

**入力データの意味**:
- 過去に `cacheToken()` で保存されたトークン情報

**期待される結果**:
- 返却値: `TokenCache` オブジェクト
  ```typescript
  {
    id_token: "cached_token_xyz789",
    obtained_at: "2025-10-29T10:00:00.000Z",
    expires_at: "2025-10-29T11:00:00.000Z"
  }
  ```
- 型: `TokenCache | null`
- エラー: なし

**期待結果の理由**:
- REQ-003: キャッシュされたトークンを読み込む必要がある
- 型安全性: TypeScriptの型システムを活用

**テストの目的**:
- キャッシュ読み込み処理が正しく動作することを保証
- JSONパースが正常に行われることを確認
- 返却されるオブジェクトが型定義に準拠していることを確認

**確認ポイント**:
- [x] `loadCachedToken()` が `TokenCache` オブジェクトを返す
- [x] 返却値の `id_token` がファイル内容と一致
- [x] 返却値の `obtained_at` がファイル内容と一致
- [x] 返却値の `expires_at` がファイル内容と一致
- [x] 型が `TokenCache` インターフェースに準拠

**信頼性レベル**: 🔵 高（EARS要件定義書・設計文書ベース）

**参照要件**:
- REQ-003: システムは取得したIDトークンをJSONファイルにキャッシュしなければならない
- `interfaces.ts` - `TokenCache` インターフェース

---

### TC-NORMAL-006: 有効期限チェック（有効なトークン）🔵

**何をテストするか**:
有効期限が5分以上先のトークンが「有効」と判定されることを確認する。

**期待される動作**:
1. `isTokenExpired()` を呼び出す
2. 現在時刻を取得（`Date.now()`）
3. 有効期限を取得（`new Date(expiresAt).getTime()`）
4. 安全マージン（5分 = 300秒）を適用
5. 判定: `now >= (expires - 300000)` → `false`（有効）

**入力値**:
- `expiresAt`: `"2025-10-29T11:00:00.000Z"`
- 現在時刻: `2025-10-29T10:00:00.000Z`
- 時間差: 60分（安全マージン5分より大きい）

**入力データの意味**:
- `expiresAt`: トークンの有効期限（ISO 8601形式）
- 安全マージン: APIリクエスト中にトークンが期限切れになることを防ぐための余裕時間

**期待される結果**:
- 返却値: `false`（有効、期限切れでない）
- 判定ロジック:
  ```typescript
  now = 1730199600000  // 2025-10-29T10:00:00.000Z
  expires = 1730203200000  // 2025-10-29T11:00:00.000Z
  SAFETY_MARGIN = 300000  // 5分
  now >= (expires - SAFETY_MARGIN)
  → 1730199600000 >= 1730202900000
  → false（有効）
  ```

**期待結果の理由**:
- REQ-604: トークン有効期限管理の一環として、安全マージンを持たせる
- パフォーマンス: 有効なトークンを不必要に再取得しない
- 安全性: APIリクエスト中のトークン期限切れを防ぐ

**テストの目的**:
- 有効期限チェックロジックが正しく動作することを保証
- 安全マージンが適切に適用されることを確認
- 有効なトークンが誤って「期限切れ」と判定されないことを確認

**確認ポイント**:
- [x] `isTokenExpired()` が `false` を返す
- [x] 現在時刻から有効期限まで5分以上ある場合に「有効」と判定
- [x] 日時計算が正確
- [x] ISO 8601形式の日時文字列が正しくパースされる

**信頼性レベル**: 🔵 高（EARS要件定義書・設計文書ベース）

**参照要件**:
- REQ-604: 認証トークンの有効期限が切れた場合、システムは自動的にトークンを再取得しなければならない

---

### TC-NORMAL-007: 有効期限チェック（期限切れトークン）🔵

**何をテストするか**:
有効期限が過去、または5分以内のトークンが「期限切れ」と判定されることを確認する。

**期待される動作**:
1. `isTokenExpired()` を呼び出す
2. 現在時刻を取得（`Date.now()`）
3. 有効期限を取得（`new Date(expiresAt).getTime()`）
4. 安全マージン（5分 = 300秒）を適用
5. 判定: `now >= (expires - 300000)` → `true`（期限切れ）

**入力値**:
- `expiresAt`: `"2025-10-29T10:10:00.000Z"`
- 現在時刻: `2025-10-29T10:06:00.000Z`
- 時間差: 4分（安全マージン5分より小さい）

**入力データの意味**:
- 有効期限まで残り4分のため、安全マージン（5分）を考慮すると「期限切れ」扱い

**期待される結果**:
- 返却値: `true`（期限切れ）
- 判定ロジック:
  ```typescript
  now = 1730199960000  // 2025-10-29T10:06:00.000Z
  expires = 1730200200000  // 2025-10-29T10:10:00.000Z
  SAFETY_MARGIN = 300000  // 5分
  now >= (expires - SAFETY_MARGIN)
  → 1730199960000 >= 1730199900000
  → true（期限切れ）
  ```

**期待結果の理由**:
- REQ-604: トークン有効期限が切れた場合、自動的に再取得する必要がある
- 安全性: APIリクエスト中にトークンが期限切れになることを防ぐ
- プロアクティブな再取得: ギリギリまで待たずに、余裕を持って再取得

**テストの目的**:
- 有効期限チェックロジックが正しく動作することを保証
- 安全マージンが適切に適用されることを確認
- 期限切れトークンが正しく検出されることを確認

**確認ポイント**:
- [x] `isTokenExpired()` が `true` を返す
- [x] 有効期限まで5分未満の場合に「期限切れ」と判定
- [x] 過去の有効期限の場合に「期限切れ」と判定
- [x] 安全マージンが正しく適用される

**信頼性レベル**: 🔵 高（EARS要件定義書・設計文書ベース）

**参照要件**:
- REQ-604: 認証トークンの有効期限が切れた場合、システムは自動的にトークンを再取得しなければならない

---

### TC-NORMAL-008: 認証APIからのトークン取得 🔵

**何をテストするか**:
J-Quants APIからIDトークンを正しく取得できることを確認する。

**期待される動作**:
1. `refreshToken()` を呼び出す
2. `POST /token/auth_user` にリクエスト送信
3. リクエストヘッダー: `Content-Type: application/json`
4. リクエストボディ: `{ "refreshtoken": "<refresh_token>" }`
5. レスポンスステータスコード確認: `200 OK`
6. レスポンスボディから `idToken` 抽出
7. IDトークンを返却

**入力値**:
- `refreshToken`: `"valid_refresh_token_abc123"`
- エンドポイント: `https://api.jquants.com/v1/token/auth_user`

**入力データの意味**:
- リフレッシュトークン: J-Quants APIの認証情報（環境変数から取得）
- エンドポイント: J-Quants APIの認証用エンドポイント

**期待される結果**:
- HTTPリクエスト:
  - URL: `https://api.jquants.com/v1/token/auth_user`
  - Method: `POST`
  - Headers: `{ "Content-Type": "application/json" }`
  - Body: `{ "refreshtoken": "valid_refresh_token_abc123" }`
- HTTPレスポンス:
  - Status: `200 OK`
  - Body: `{ "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }`
- 返却値: `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`

**期待結果の理由**:
- REQ-002: リフレッシュトークンを使用してIDトークンを取得する必要がある
- API統合: `api-integration.md` で定義されたリクエスト・レスポンス形式に準拠

**テストの目的**:
- 認証APIとの統合が正しく動作することを保証
- リクエストフォーマットが仕様に準拠していることを確認
- レスポンスから正しくIDトークンを抽出できることを確認

**確認ポイント**:
- [x] `fetch()` が正しいURLで呼ばれる
- [x] HTTPメソッドが `POST`
- [x] `Content-Type` ヘッダーが `application/json`
- [x] リクエストボディに `refreshtoken` フィールドが含まれる
- [x] レスポンスステータスが `200`
- [x] レスポンスボディから `idToken` が抽出される
- [x] 返却値が `idToken` と一致

**信頼性レベル**: 🔵 高（EARS要件定義書・設計文書ベース）

**参照要件**:
- REQ-002: システムはリフレッシュトークンを使用してIDトークンを取得しなければならない
- `api-integration.md` - 「認証エンドポイント」セクション

---

## 3. 異常系テストケース（異常系テストケース）

### TC-ERROR-001: 環境変数未設定エラー 🔵

**何をテストするか**:
環境変数 `J_QUANTS_REFRESH_TOKEN` が未設定の場合、適切なエラーメッセージが表示されることを確認する。

**期待される動作**:
1. 環境変数 `J_QUANTS_REFRESH_TOKEN` が `undefined`
2. TokenManager のコンストラクタで検証
3. エラーをスロー

**入力値**:
- `process.env.J_QUANTS_REFRESH_TOKEN`: `undefined`

**入力データの意味**:
- 環境変数が設定されていない状態（初回セットアップ時、設定ミス等）

**期待される結果**:
- エラーコード: `MISSING_API_KEY`
- エラーメッセージ（日本語）: `"環境変数 J_QUANTS_REFRESH_TOKEN を設定してください"`
- エラータイプ: `Error`
- MCPサーバー起動: 失敗

**期待結果の理由**:
- EDGE-003: APIキーが未設定の場合のエラーメッセージ
- NFR-301: エラーメッセージを日本語で分かりやすく表示
- ユーザビリティ: 設定ミスを明確に通知

**テストの目的**:
- 環境変数のバリデーションが正しく動作することを保証
- ユーザーフレンドリーなエラーメッセージが表示されることを確認
- 起動時の設定ミスを早期に検出できることを確認

**確認ポイント**:
- [x] `Error` がスローされる
- [x] エラーメッセージが日本語
- [x] エラーメッセージに「J_QUANTS_REFRESH_TOKEN」が含まれる
- [x] エラーコードが `MISSING_API_KEY`
- [x] ログファイルにエラーが記録される

**信頼性レベル**: 🔵 高（EARS要件定義書・設計文書ベース）

**参照要件**:
- EDGE-003: APIキーが未設定の場合のエラーメッセージ
- NFR-301: エラーメッセージを日本語で分かりやすく表示
- REQ-1101: APIキー・リフレッシュトークンを環境変数（.env）から読み込まなければならない

---

### TC-ERROR-002: 認証失敗エラー（401）🔵

**何をテストするか**:
無効なリフレッシュトークンを使用した場合、認証失敗エラーが正しく処理されることを確認する。

**期待される動作**:
1. `refreshToken()` を呼び出す
2. J-Quants API `/token/auth_user` にリクエスト送信
3. レスポンスステータスコード: `401 Unauthorized`
4. エラーをスロー
5. ログファイルにエラーを記録

**入力値**:
- `refreshToken`: `"invalid_refresh_token_xxx"`（無効なトークン）
- エンドポイント: `https://api.jquants.com/v1/token/auth_user`

**入力データの意味**:
- 無効なリフレッシュトークン（期限切れ、削除済み、誤入力等）

**期待される結果**:
- HTTPレスポンス:
  - Status: `401 Unauthorized`
  - Body: `{ "message": "Authentication failed" }`
- エラーコード: `AUTHENTICATION_FAILED`
- エラーメッセージ（日本語）: `"認証に失敗しました。APIキーを確認してください"`
- ログファイル: `logs/error.log` にエラー記録

**期待結果の理由**:
- REQ-602: API呼び出しが失敗した場合、エラー内容をログファイルに記録
- NFR-301: エラーメッセージを日本語で分かりやすく表示
- ユーザビリティ: 認証失敗の原因を明確に通知

**テストの目的**:
- 認証失敗の処理が正しく動作することを保証
- エラーハンドリングが適切に行われることを確認
- ログ記録が正しく行われることを確認

**確認ポイント**:
- [x] `Error` がスローされる
- [x] エラーコードが `AUTHENTICATION_FAILED`
- [x] エラーメッセージが日本語
- [x] ログファイルに以下の情報が記録される:
  - エラー発生時刻
  - エラーメッセージ
  - HTTPステータスコード（401）
  - エンドポイントURL
- [x] リトライが行われない（401はリトライ対象外）

**信頼性レベル**: 🔵 高（EARS要件定義書・設計文書ベース）

**参照要件**:
- REQ-602: API呼び出しが失敗した場合、エラー内容をログファイルに記録しなければならない
- `api-integration.md` - 「レスポンス（エラー時）」
- EDGE: 認証失敗時のエラーハンドリング

---

### TC-ERROR-003: ネットワークエラー 🔵

**何をテストするか**:
ネットワーク接続が切断されている場合、適切なエラーメッセージが表示されることを確認する。

**期待される動作**:
1. `refreshToken()` を呼び出す
2. `fetch()` がネットワークエラーをスロー
3. エラーをキャッチ
4. エラーコードを特定: `NETWORK_ERROR`
5. ログファイルにエラーを記録

**入力値**:
- `refreshToken`: `"valid_refresh_token_abc123"`
- ネットワーク状態: 切断

**入力データの意味**:
- インターネット接続が利用できない状態（オフライン、ネットワーク障害等）

**期待される結果**:
- `fetch()` エラー:
  - エラータイプ: `TypeError`
  - エラーメッセージ: `"fetch failed"` または `"network error"`
- エラーコード: `NETWORK_ERROR`
- エラーメッセージ（日本語）: `"ネットワークに接続できません。インターネット接続を確認してください"`
- ログファイル: `logs/error.log` にエラー記録

**期待結果の理由**:
- EDGE-202: ネットワーク接続エラーのメッセージ
- NFR-102: システムはネットワークエラー時にクラッシュしてはならない
- NFR-301: エラーメッセージを日本語で分かりやすく表示

**テストの目的**:
- ネットワークエラーの処理が正しく動作することを保証
- システムがクラッシュせず、適切にエラーを返すことを確認
- ユーザーに対処方法を明確に伝えることを確認

**確認ポイント**:
- [x] `Error` がスローされる
- [x] エラーコードが `NETWORK_ERROR`
- [x] エラーメッセージが日本語
- [x] エラーメッセージに「ネットワーク」「インターネット接続」が含まれる
- [x] システムがクラッシュしない
- [x] ログファイルにエラーが記録される

**信頼性レベル**: 🔵 高（EARS要件定義書・設計文書ベース）

**参照要件**:
- EDGE-202: ネットワーク接続エラーのメッセージ
- NFR-102: システムはネットワークエラー時にクラッシュしてはならない
- REQ-602: エラー内容をログファイルに記録

---

### TC-ERROR-004: APIタイムアウトエラー 🔵

**何をテストするか**:
APIレスポンスが5秒以内に返らない場合、タイムアウトエラーが発生することを確認する。

**期待される動作**:
1. `refreshToken()` を呼び出す
2. `AbortController` を作成
3. 5秒後にタイムアウトタイマーをセット
4. `fetch()` にタイムアウトシグナルを渡す
5. 5秒経過後、`AbortController.abort()` を呼び出す
6. `fetch()` が `AbortError` をスロー
7. エラーコード: `API_TIMEOUT`

**入力値**:
- `refreshToken`: `"valid_refresh_token_abc123"`
- APIレスポンス時間: > 5秒（レスポンスなし）
- タイムアウト設定: 5000ミリ秒

**入力データの意味**:
- APIサーバーの応答が遅い、または応答がない状態
- NFR-001: 1つのAPIリクエストを5秒以内に完了する必要がある

**期待される結果**:
- `fetch()` エラー:
  - エラータイプ: `AbortError`
  - エラーメッセージ: `"The operation was aborted"`
- エラーコード: `API_TIMEOUT`
- エラーメッセージ（日本語）: `"APIの応答がタイムアウトしました（5秒）"`
- ログファイル: `logs/error.log` にエラー記録
- 実行時間: 約5秒（タイムアウト設定通り）

**期待結果の理由**:
- REQ-603: APIリクエストが5秒以内に完了しない場合、タイムアウトエラーを返却
- NFR-001: システムは1つのAPIリクエストを5秒以内に完了
- ユーザー体験: 無限待機を避け、適切にエラーを通知

**テストの目的**:
- タイムアウト処理が正しく動作することを保証
- `AbortController` が適切に使用されることを確認
- パフォーマンス要件（5秒以内）が守られることを確認

**確認ポイント**:
- [x] `Error` がスローされる
- [x] エラーコードが `API_TIMEOUT`
- [x] エラーメッセージが日本語
- [x] エラーメッセージに「タイムアウト」「5秒」が含まれる
- [x] `AbortController.abort()` が呼ばれる
- [x] タイムアウト時間が5秒
- [x] ログファイルにエラーが記録される

**信頼性レベル**: 🔵 高（EARS要件定義書・設計文書ベース）

**参照要件**:
- REQ-603: APIリクエストが5秒以内に完了しない場合、タイムアウトエラーを返却しなければならない
- NFR-001: システムは1つのAPIリクエストを5秒以内に完了しなければならない
- `architecture.md` - 「タイムアウト処理」

---

### TC-ERROR-005: キャッシュファイル破損 🔵

**何をテストするか**:
キャッシュファイルがJSONとしてパース不可能な場合、適切にエラーハンドリングされることを確認する。

**期待される動作**:
1. `loadCachedToken()` を呼び出す
2. `data/token.json` を読み込む
3. `JSON.parse()` がエラーをスロー
4. エラーをキャッチ
5. ログに警告を記録
6. `null` を返却
7. `getIdToken()` が新しいトークンを取得

**入力値**:
- キャッシュファイル（`data/token.json`）内容:
  ```
  { "id_token": "broken_token", "obtained_at": "invalid_date
  ```
  （閉じ括弧がなく、不正なJSON）

**入力データの意味**:
- ファイル書き込み中のクラッシュ、手動編集ミス等で破損したJSONファイル

**期待される結果**:
- `loadCachedToken()` 返却値: `null`
- ログファイル（`logs/error.log`）: 警告メッセージ
  ```
  [2025-10-29 10:00:00] [WARN] トークンキャッシュファイルの読み込みに失敗しました: SyntaxError: Unexpected end of JSON input
  ```
- `getIdToken()` の動作:
  - キャッシュが `null` のため、新しいトークンを取得
  - J-Quants API `/token/auth_user` を呼び出す
  - 新しいトークンを返却
  - キャッシュファイルを上書き（正常な内容で）

**期待結果の理由**:
- REQ-602: エラー内容をログファイルに記録
- NFR-102: エラー時もクラッシュしない（グレースフルデグラデーション）
- 自動回復: 破損したキャッシュを自動的に再生成

**テストの目的**:
- キャッシュファイル破損時のエラーハンドリングが正しく動作することを保証
- システムがクラッシュせず、自動回復できることを確認
- ログ記録が正しく行われることを確認

**確認ポイント**:
- [x] `loadCachedToken()` が `null` を返す
- [x] `JSON.parse()` エラーがキャッチされる
- [x] ログファイルに警告が記録される
- [x] システムがクラッシュしない
- [x] `getIdToken()` が新しいトークンを取得する
- [x] キャッシュファイルが正常な内容で上書きされる

**信頼性レベル**: 🔵 高（EARS要件定義書・設計文書ベース）

**参照要件**:
- REQ-602: API呼び出しが失敗した場合、エラー内容をログファイルに記録しなければならない
- NFR-102: システムはネットワークエラー時にクラッシュしてはならない

---

### TC-ERROR-006: APIメンテナンス中（503）🔵

**何をテストするか**:
J-Quants APIがメンテナンス中（503 Service Unavailable）の場合、リトライ後にエラーが返されることを確認する。

**期待される動作**:
1. `refreshToken()` を呼び出す
2. J-Quants API `/token/auth_user` にリクエスト送信
3. レスポンスステータスコード: `503 Service Unavailable`
4. リトライロジック実行（最大3回）
5. 1回目失敗 → 1秒待機 → 2回目リトライ
6. 2回目失敗 → 2秒待機 → 3回目リトライ
7. 3回目失敗 → エラーをスロー

**入力値**:
- `refreshToken`: `"valid_refresh_token_abc123"`
- APIレスポンス: すべて `503 Service Unavailable`
- リトライ設定: 最大3回、Exponential backoff（1秒、2秒、4秒）

**入力データの意味**:
- J-Quants APIがメンテナンス中、または一時的に利用できない状態

**期待される結果**:
- HTTPリクエスト: 3回実行される
- リトライ間隔:
  - 1回目 → 2回目: 1秒待機
  - 2回目 → 3回目: 2秒待機
- エラーコード: `API_MAINTENANCE`
- エラーメッセージ（日本語）: `"J-Quants APIがメンテナンス中です。しばらく時間をおいてから再試行してください"`
- ログファイル: 各リトライとエラーを記録

**期待結果の理由**:
- REQ-601: API呼び出しが一時的エラーで失敗した場合、最大3回まで自動リトライ
- EDGE-201: APIメンテナンス中のエラーメッセージ
- Exponential backoff: サーバー負荷を考慮したリトライ戦略

**テストの目的**:
- リトライロジックが正しく動作することを保証
- Exponential backoffが適用されることを確認
- リトライ回数の上限（3回）が守られることを確認

**確認ポイント**:
- [x] `fetch()` が3回呼ばれる（初回 + リトライ2回）
- [x] 各リトライの間隔が正しい（1秒、2秒）
- [x] エラーコードが `API_MAINTENANCE`
- [x] エラーメッセージが日本語
- [x] ログファイルに以下が記録される:
  - 各リトライの試行回数
  - HTTPステータスコード（503）
  - リトライ間隔
- [x] 4回目のリトライは行われない

**信頼性レベル**: 🔵 高（EARS要件定義書・設計文書ベース）

**参照要件**:
- REQ-601: API呼び出しが一時的エラーで失敗した場合、最大3回まで自動リトライしなければならない
- EDGE-201: APIメンテナンス中のエラーメッセージ
- `architecture.md` - 「エラーハンドリング戦略」（リトライロジック）

---

### TC-ERROR-007: ファイル書き込みエラー 🟡

**何をテストするか**:
キャッシュファイルへの書き込み権限がない場合、適切なエラーハンドリングが行われることを確認する。

**期待される動作**:
1. `cacheToken()` を呼び出す
2. `fs.writeFileSync()` がエラーをスロー
3. エラーをキャッチ
4. エラーコード: `FILE_WRITE_ERROR`
5. ログファイルにエラーを記録
6. グレースフルに失敗（システムはクラッシュしない）

**入力値**:
- `token`: `"test_token_abc123"`
- `expiresIn`: `3600`
- ディレクトリパーミッション: 書き込み不可

**入力データの意味**:
- ファイルシステムの権限エラー、ディスク容量不足等

**期待される結果**:
- `fs.writeFileSync()` エラー:
  - エラータイプ: `Error`
  - エラーコード: `EACCES`（Permission denied）
- エラーコード: `FILE_WRITE_ERROR`
- エラーメッセージ（日本語）: `"トークンキャッシュファイルの書き込みに失敗しました"`
- ログファイル: `logs/error.log` にエラー記録
- システムの動作:
  - IDトークンは正常に返却される（キャッシュ保存のみ失敗）
  - 次回 `getIdToken()` 呼び出し時、再度APIから取得

**期待結果の理由**:
- NFR-102: エラー時もクラッシュしない
- グレースフルデグラデーション: キャッシュ保存に失敗しても、トークン取得は成功
- ユーザビリティ: エラーを記録し、原因を特定可能に

**テストの目的**:
- ファイル書き込みエラーの処理が正しく動作することを保証
- システムがクラッシュせず、グレースフルに失敗することを確認
- エラーログが正しく記録されることを確認

**確認ポイント**:
- [x] `Error` がスローされる（または警告としてログ記録）
- [x] エラーコードが `FILE_WRITE_ERROR`
- [x] ログファイルにエラーが記録される
- [x] システムがクラッシュしない
- [x] `getIdToken()` は正常にトークンを返す
- [x] 次回呼び出し時、キャッシュが存在しないため再度API呼び出し

**信頼性レベル**: 🟡 中（設計文書ベース、EARS要件なし）

**参照要件**:
- NFR-102: システムはネットワークエラー時にクラッシュしてはならない
- REQ-602: エラー内容をログファイルに記録

---

## 4. 境界値テストケース（境界値テストケース）

### TC-BOUNDARY-001: 有効期限ちょうど5分前 🔵

**何をテストするか**:
有効期限まであと5分（300秒）のトークンが「期限切れ」と判定されることを確認する。

**期待される動作**:
1. `isTokenExpired()` を呼び出す
2. 現在時刻と有効期限の差が300秒（安全マージン）
3. 判定: `now >= (expires - 300000)` → `true`（期限切れ）

**入力値**:
- `expiresAt`: `"2025-10-29T10:05:00.000Z"`
- 現在時刻: `2025-10-29T10:00:00.000Z`
- 時間差: ちょうど5分（300秒）

**入力データの意味**:
- 有効期限まで残り5分のため、安全マージンの境界値

**期待される結果**:
- 返却値: `true`（期限切れ）
- 判定ロジック:
  ```typescript
  now = 1730199600000  // 2025-10-29T10:00:00.000Z
  expires = 1730199900000  // 2025-10-29T10:05:00.000Z
  SAFETY_MARGIN = 300000  // 5分
  now >= (expires - SAFETY_MARGIN)
  → 1730199600000 >= 1730199600000
  → true（期限切れ）
  ```

**期待結果の理由**:
- REQ-604: トークン有効期限管理の一環として、安全マージンを適用
- 境界値: 5分ちょうどの場合は「期限切れ」扱い（`>=` 演算子）
- 安全性: APIリクエスト中の期限切れを防ぐため、余裕を持って再取得

**テストの目的**:
- 境界値（5分ちょうど）での判定が正しく行われることを保証
- `>=` 演算子が正しく使用されていることを確認
- 安全マージンの境界値動作を確認

**確認ポイント**:
- [x] `isTokenExpired()` が `true` を返す
- [x] 境界値（5分ちょうど）で「期限切れ」と判定
- [x] `>=` 演算子が使用されている（`>` ではない）
- [x] 日時計算が正確（ミリ秒単位）

**信頼性レベル**: 🔵 高（EARS要件定義書・設計文書ベース）

**参照要件**:
- REQ-604: 認証トークンの有効期限が切れた場合、システムは自動的にトークンを再取得しなければならない

---

### TC-BOUNDARY-002: 有効期限5分1秒前 🔵

**何をテストするか**:
有効期限まであと5分1秒（301秒）のトークンが「有効」と判定されることを確認する。

**期待される動作**:
1. `isTokenExpired()` を呼び出す
2. 現在時刻と有効期限の差が301秒（安全マージン + 1秒）
3. 判定: `now >= (expires - 300000)` → `false`（有効）

**入力値**:
- `expiresAt`: `"2025-10-29T10:05:01.000Z"`
- 現在時刻: `2025-10-29T10:00:00.000Z`
- 時間差: 5分1秒（301秒）

**入力データの意味**:
- 有効期限まで残り5分1秒のため、安全マージンを超える（有効）

**期待される結果**:
- 返却値: `false`（有効、期限切れでない）
- 判定ロジック:
  ```typescript
  now = 1730199600000  // 2025-10-29T10:00:00.000Z
  expires = 1730199901000  // 2025-10-29T10:05:01.000Z
  SAFETY_MARGIN = 300000  // 5分
  now >= (expires - SAFETY_MARGIN)
  → 1730199600000 >= 1730199601000
  → false（有効）
  ```

**期待結果の理由**:
- REQ-604: 安全マージンを超えるトークンは「有効」として扱う
- 境界値: 5分1秒の場合は「有効」扱い（`>=` 演算子の境界）
- パフォーマンス: 有効なトークンを不必要に再取得しない

**テストの目的**:
- 境界値（5分1秒）での判定が正しく行われることを保証
- 「5分ちょうど」と「5分1秒」の境界が正しく分離されることを確認
- 誤った「期限切れ」判定がされないことを確認

**確認ポイント**:
- [x] `isTokenExpired()` が `false` を返す
- [x] 境界値（5分1秒）で「有効」と判定
- [x] 5分ちょうどとの差が正しく区別される
- [x] 日時計算が正確（ミリ秒単位）

**信頼性レベル**: 🔵 高（EARS要件定義書・設計文書ベース）

**参照要件**:
- REQ-604: 認証トークンの有効期限が切れた場合、システムは自動的にトークンを再取得しなければならない

---

### TC-BOUNDARY-003: 空のキャッシュファイル 🟡

**何をテストするか**:
キャッシュファイル（`data/token.json`）が存在するが内容が空の場合、適切にエラーハンドリングされることを確認する。

**期待される動作**:
1. `loadCachedToken()` を呼び出す
2. `data/token.json` を読み込む
3. ファイル内容が空文字列 `""`
4. `JSON.parse("")` がエラーをスロー
5. エラーをキャッチ
6. `null` を返却

**入力値**:
- キャッシュファイル（`data/token.json`）内容: `""`（空文字列）

**入力データの意味**:
- ファイルは存在するが、内容が空の状態（書き込み中断、ファイル破損等）

**期待される結果**:
- `loadCachedToken()` 返却値: `null`
- ログファイル: 警告メッセージ記録
- `getIdToken()` の動作:
  - キャッシュが `null` のため、新しいトークンを取得
  - J-Quants API `/token/auth_user` を呼び出す

**期待結果の理由**:
- REQ-602: エラー内容をログファイルに記録
- NFR-102: エラー時もクラッシュしない
- 自動回復: 空のキャッシュを検出し、新しいトークンを取得

**テストの目的**:
- 空ファイルのエラーハンドリングが正しく動作することを保証
- システムがクラッシュせず、自動回復できることを確認
- エッジケース（空ファイル）を適切に処理できることを確認

**確認ポイント**:
- [x] `loadCachedToken()` が `null` を返す
- [x] `JSON.parse()` エラーがキャッチされる
- [x] ログファイルに警告が記録される
- [x] システムがクラッシュしない
- [x] `getIdToken()` が新しいトークンを取得する

**信頼性レベル**: 🟡 中（設計文書ベース、EARS要件なし）

**参照要件**:
- REQ-602: エラー内容をログファイルに記録
- NFR-102: エラー時もクラッシュしない

---

### TC-BOUNDARY-004: 非常に長いトークン文字列 🟡

**何をテストするか**:
非常に長いトークン文字列（10KB以上）が正しくキャッシュされ、読み込まれることを確認する。

**期待される動作**:
1. `cacheToken()` を呼び出す
2. 10KB以上のトークン文字列を保存
3. `loadCachedToken()` でキャッシュを読み込む
4. トークン文字列が正しく取得される

**入力値**:
- `token`: 10,000文字のランダム文字列（例: `"a".repeat(10000)`）
- `expiresIn`: `3600`

**入力データの意味**:
- 通常のJWTトークンは数百バイト～数KB程度だが、極端に長いトークンのエッジケース

**期待される結果**:
- ファイル書き込み: 成功
- ファイルサイズ: 約10KB以上
- `loadCachedToken()` 返却値: 10,000文字のトークンが正しく取得される
- パフォーマンス: 読み書きが1秒以内に完了

**期待結果の理由**:
- ファイルシステムの制約テスト: 大きなファイルも正しく扱えることを確認
- パフォーマンステスト: 大きなトークンでも性能要件を満たすことを確認

**テストの目的**:
- 大きなトークン文字列のエラーハンドリングが正しく動作することを保証
- ファイルシステムの制約を超えないことを確認
- パフォーマンス要件を満たすことを確認

**確認ポイント**:
- [x] `cacheToken()` が成功する
- [x] `data/token.json` ファイルが作成される
- [x] ファイルサイズが10KB以上
- [x] `loadCachedToken()` が正しくトークンを返す
- [x] トークン文字列が欠損しない
- [x] 読み書き時間が1秒以内

**信頼性レベル**: 🟡 中（エッジケース、EARS要件なし）

**参照要件**:
- REQ-003: IDトークンをJSONファイルにキャッシュ
- NFR-002: 認証処理を10秒以内に完了

---

### TC-BOUNDARY-005: リトライ回数境界値（3回目成功）🔵

**何をテストするか**:
APIリクエストが2回失敗し、3回目（最後のリトライ）で成功した場合、正常にトークンが取得されることを確認する。

**期待される動作**:
1. `refreshToken()` を呼び出す
2. 1回目のリクエスト → 503エラー → リトライ
3. 2回目のリクエスト → 503エラー → リトライ
4. 3回目のリクエスト → 200成功 → トークン取得

**入力値**:
- `refreshToken`: `"valid_refresh_token_abc123"`
- APIレスポンス:
  - 1回目: `503 Service Unavailable`
  - 2回目: `503 Service Unavailable`
  - 3回目: `200 OK` + `{ "idToken": "success_token_xyz" }`

**入力データの意味**:
- J-Quants APIが一時的に不安定で、3回目の試行で成功する状況

**期待される結果**:
- HTTPリクエスト: 3回実行される
- リトライ間隔:
  - 1回目 → 2回目: 1秒待機
  - 2回目 → 3回目: 2秒待機
- 返却値: `"success_token_xyz"`
- エラー: なし（3回目で成功）

**期待結果の理由**:
- REQ-601: 最大3回まで自動リトライ
- リジリエンス: 一時的なエラーから自動回復できることを確認
- ユーザー体験: リトライにより、ユーザーは手動で再試行する必要がない

**テストの目的**:
- リトライロジックが正しく動作することを保証
- 最後のリトライで成功した場合、正常にトークンが返されることを確認
- リトライ回数の境界値（3回）を確認

**確認ポイント**:
- [x] `fetch()` が3回呼ばれる
- [x] 1回目、2回目が503エラー
- [x] 3回目が200成功
- [x] 返却値が `"success_token_xyz"` と一致
- [x] エラーがスローされない
- [x] ログファイルにリトライの記録

**信頼性レベル**: 🔵 高（EARS要件定義書・設計文書ベース）

**参照要件**:
- REQ-601: API呼び出しが一時的エラーで失敗した場合、最大3回まで自動リトライしなければならない

---

### TC-BOUNDARY-006: リトライ回数超過（4回目なし）🔵

**何をテストするか**:
APIリクエストが3回すべて失敗した場合、4回目のリトライは行われず、エラーが返されることを確認する。

**期待される動作**:
1. `refreshToken()` を呼び出す
2. 1回目のリクエスト → 503エラー → リトライ
3. 2回目のリクエスト → 503エラー → リトライ
4. 3回目のリクエスト → 503エラー → エラーをスロー
5. 4回目のリトライは行われない

**入力値**:
- `refreshToken`: `"valid_refresh_token_abc123"`
- APIレスポンス: すべて `503 Service Unavailable`

**入力データの意味**:
- J-Quants APIが継続的に利用できない状態（長時間メンテナンス、障害等）

**期待される結果**:
- HTTPリクエスト: 3回実行される
- 4回目のリクエスト: 実行されない
- エラーコード: `API_MAINTENANCE`
- エラーメッセージ（日本語）: `"J-Quants APIがメンテナンス中です。しばらく時間をおいてから再試行してください"`

**期待結果の理由**:
- REQ-601: 最大3回までリトライ（4回目はなし）
- サーバー保護: 無限リトライによるサーバー負荷を避ける
- ユーザー体験: 適切なタイミングでエラーを通知

**テストの目的**:
- リトライ回数の上限（3回）が正しく守られることを保証
- 4回目のリトライが行われないことを確認
- 3回失敗後、適切なエラーが返されることを確認

**確認ポイント**:
- [x] `fetch()` が3回呼ばれる
- [x] 4回目の `fetch()` は呼ばれない
- [x] エラーコードが `API_MAINTENANCE`
- [x] エラーメッセージが日本語
- [x] ログファイルに以下が記録される:
  - リトライ回数（3回）
  - 各リトライの失敗理由
  - 最終的なエラー

**信頼性レベル**: 🔵 高（EARS要件定義書・設計文書ベース）

**参照要件**:
- REQ-601: API呼び出しが一時的エラーで失敗した場合、最大3回まで自動リトライしなければならない

---

## 5. テスト実装ガイドライン

### 5.1 テストファイル構造

**推奨ディレクトリ構成**:
```
servers/j-quants/
├── src/
│   └── auth/
│       └── token-manager.ts          # 実装ファイル
├── tests/
│   └── auth/
│       ├── token-manager.test.ts     # メインテストファイル
│       ├── token-manager-error.test.ts    # 異常系テスト
│       └── token-manager-boundary.test.ts # 境界値テスト
└── package.json
```

**テストファイル命名規則**:
- `*.test.ts`: Vitestが自動的に認識
- `token-manager.test.ts`: 正常系テスト
- `token-manager-error.test.ts`: 異常系テスト
- `token-manager-boundary.test.ts`: 境界値テスト

---

### 5.2 Vitestセットアップ

**vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
});
```

**tests/setup.ts**:
```typescript
import { beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';

// 各テスト前にキャッシュファイルを削除
beforeEach(() => {
  const cacheFilePath = 'data/token.json';
  if (fs.existsSync(cacheFilePath)) {
    fs.unlinkSync(cacheFilePath);
  }
});

// 各テスト後にモックをリセット
afterEach(() => {
  vi.restoreAllMocks();
});
```

---

### 5.3 モック戦略

#### 5.3.1 fetch APIのモック

**成功ケース**:
```typescript
import { vi } from 'vitest';

// モック: 成功レスポンス（200 OK）
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({
      idToken: 'mock_id_token_xyz123',
    }),
  } as Response)
);
```

**失敗ケース（401 Unauthorized）**:
```typescript
// モック: 認証失敗レスポンス（401）
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: false,
    status: 401,
    json: async () => ({
      message: 'Authentication failed',
    }),
  } as Response)
);
```

**ネットワークエラー**:
```typescript
// モック: ネットワークエラー
global.fetch = vi.fn(() =>
  Promise.reject(new TypeError('fetch failed'))
);
```

**タイムアウトエラー**:
```typescript
// モック: タイムアウト
global.fetch = vi.fn(() =>
  Promise.reject(new DOMException('The operation was aborted', 'AbortError'))
);
```

---

#### 5.3.2 ファイルシステムのモック

**ファイル読み込みモック**:
```typescript
import fs from 'fs';
import { vi } from 'vitest';

// モック: キャッシュファイル存在
vi.spyOn(fs, 'existsSync').mockReturnValue(true);
vi.spyOn(fs, 'readFileSync').mockReturnValue(
  JSON.stringify({
    id_token: 'cached_token_xyz789',
    obtained_at: '2025-10-29T10:00:00.000Z',
    expires_at: '2025-10-29T11:00:00.000Z',
  })
);
```

**ファイル書き込みモック**:
```typescript
// モック: ファイル書き込み成功
const writeFileSyncSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

// テスト後に呼び出しを確認
expect(writeFileSyncSpy).toHaveBeenCalledWith(
  'data/token.json',
  expect.stringContaining('id_token'),
  'utf-8'
);
```

---

#### 5.3.3 Date.now()のモック

**固定時刻の設定**:
```typescript
import { vi } from 'vitest';

// モック: 固定時刻（2025-10-29T10:00:00.000Z）
const mockDate = new Date('2025-10-29T10:00:00.000Z');
vi.setSystemTime(mockDate);

// テスト後にリセット
vi.useRealTimers();
```

---

### 5.4 テスト実装例（Given/When/Then）

**日本語コメント例**:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenManager } from '../src/auth/token-manager';

describe('TokenManager - 正常系', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    vi.clearAllMocks();
  });

  it('TC-NORMAL-001: 初回起動時のIDトークン取得', async () => {
    // Given（前提条件）: キャッシュファイルが存在しない
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    // Given: fetch APIをモック（成功レスポンス）
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ idToken: 'new_token_abc123' }),
      } as Response)
    );

    // Given: ファイル書き込みをモック
    const writeFileSyncSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    // When（実行条件）: TokenManagerを初期化し、getIdToken()を呼び出す
    const tokenManager = new TokenManager({
      refreshToken: 'valid_refresh_token_abc123',
    });
    const idToken = await tokenManager.getIdToken();

    // Then（期待結果）: IDトークンが取得される
    expect(idToken).toBe('new_token_abc123');

    // Then: fetch APIが1回呼ばれる
    expect(fetch).toHaveBeenCalledTimes(1);

    // Then: リクエストURLが正しい
    expect(fetch).toHaveBeenCalledWith(
      'https://api.jquants.com/v1/token/auth_user',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshtoken: 'valid_refresh_token_abc123' }),
      })
    );

    // Then: キャッシュファイルが作成される
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      'data/token.json',
      expect.stringContaining('new_token_abc123'),
      'utf-8'
    );
  });

  it('TC-NORMAL-002: キャッシュからのIDトークン取得', async () => {
    // Given: 有効なキャッシュファイルが存在する
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({
        id_token: 'cached_token_xyz789',
        obtained_at: '2025-10-29T10:00:00.000Z',
        expires_at: '2025-10-29T11:00:00.000Z', // 1時間後（有効）
      })
    );

    // Given: 現在時刻を10:30（有効期限まで30分）にモック
    vi.setSystemTime(new Date('2025-10-29T10:30:00.000Z'));

    // Given: fetch APIをモック（呼ばれないことを確認するため）
    global.fetch = vi.fn();

    // When: TokenManagerを初期化し、getIdToken()を呼び出す
    const tokenManager = new TokenManager({
      refreshToken: 'valid_refresh_token_abc123',
    });
    const idToken = await tokenManager.getIdToken();

    // Then: キャッシュのIDトークンが返される
    expect(idToken).toBe('cached_token_xyz789');

    // Then: fetch APIが呼ばれない（キャッシュから取得）
    expect(fetch).not.toHaveBeenCalled();

    // Then: 実行時間が100ミリ秒未満
    // (Vitestのタイマーモックを使用して検証可能)
  });
});

describe('TokenManager - 異常系', () => {
  it('TC-ERROR-001: 環境変数未設定エラー', () => {
    // Given: 環境変数が未設定
    process.env.J_QUANTS_REFRESH_TOKEN = undefined;

    // When: TokenManagerを初期化しようとする
    // Then: エラーがスローされる
    expect(() => {
      new TokenManager({
        refreshToken: process.env.J_QUANTS_REFRESH_TOKEN!,
      });
    }).toThrow('環境変数 J_QUANTS_REFRESH_TOKEN を設定してください');
  });

  it('TC-ERROR-004: APIタイムアウトエラー', async () => {
    // Given: キャッシュファイルが存在しない
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    // Given: fetch APIをモック（タイムアウトエラー）
    global.fetch = vi.fn(() =>
      Promise.reject(new DOMException('The operation was aborted', 'AbortError'))
    );

    // When: TokenManagerを初期化し、getIdToken()を呼び出す
    const tokenManager = new TokenManager({
      refreshToken: 'valid_refresh_token_abc123',
    });

    // Then: API_TIMEOUTエラーがスローされる
    await expect(tokenManager.getIdToken()).rejects.toThrow('APIの応答がタイムアウトしました（5秒）');
  });
});

describe('TokenManager - 境界値', () => {
  it('TC-BOUNDARY-001: 有効期限ちょうど5分前', () => {
    // Given: 有効期限が5分後
    const expiresAt = '2025-10-29T10:05:00.000Z';

    // Given: 現在時刻を10:00にモック
    vi.setSystemTime(new Date('2025-10-29T10:00:00.000Z'));

    // When: TokenManagerのisTokenExpired()を呼び出す
    const tokenManager = new TokenManager({
      refreshToken: 'valid_refresh_token_abc123',
    });
    const isExpired = tokenManager.isTokenExpired(expiresAt);

    // Then: 期限切れと判定される
    expect(isExpired).toBe(true);
  });
});
```

---

### 5.5 テスト実行コマンド

**基本的な実行**:
```bash
# 全テスト実行
npm test

# ウォッチモード（開発時）
npm run test:watch

# 特定のテストファイルのみ実行
npm test -- token-manager.test.ts

# カバレッジ付き実行
npm run test:coverage
```

**デバッグモード**:
```bash
# デバッグモードでテスト実行
node --inspect-brk ./node_modules/vitest/vitest.mjs run
```

---

### 5.6 アサーション例

**基本的なアサーション**:
```typescript
// 等価性チェック
expect(idToken).toBe('expected_token');

// 型チェック
expect(typeof idToken).toBe('string');

// オブジェクトの部分一致
expect(tokenCache).toEqual({
  id_token: expect.any(String),
  obtained_at: expect.any(String),
  expires_at: expect.any(String),
});

// エラースロー
expect(() => functionThatThrows()).toThrow('エラーメッセージ');

// Promise拒否
await expect(asyncFunctionThatRejects()).rejects.toThrow('エラーメッセージ');

// 関数呼び出し回数
expect(mockFunction).toHaveBeenCalledTimes(3);

// 関数呼び出し引数
expect(mockFunction).toHaveBeenCalledWith('expected_arg');
```

---

### 5.7 テストカバレッジ目標

**カバレッジ目標**（参考値）:
- **行カバレッジ（Line Coverage）**: 90%以上
- **分岐カバレッジ（Branch Coverage）**: 85%以上
- **関数カバレッジ（Function Coverage）**: 100%
- **文カバレッジ（Statement Coverage）**: 90%以上

**カバレッジレポート確認**:
```bash
npm run test:coverage
```

**カバレッジレポート出力先**:
- `coverage/index.html`: HTMLレポート（ブラウザで開く）
- `coverage/coverage-summary.json`: JSON形式のサマリー

---

## 6. テスト実装チェックリスト

### 正常系テストケース（8ケース）
- [ ] TC-NORMAL-001: 初回起動時のIDトークン取得
- [ ] TC-NORMAL-002: キャッシュからのIDトークン取得
- [ ] TC-NORMAL-003: トークン有効期限切れ時の自動再取得
- [ ] TC-NORMAL-004: トークンキャッシュの保存
- [ ] TC-NORMAL-005: トークンキャッシュの読み込み
- [ ] TC-NORMAL-006: 有効期限チェック（有効なトークン）
- [ ] TC-NORMAL-007: 有効期限チェック（期限切れトークン）
- [ ] TC-NORMAL-008: 認証APIからのトークン取得

### 異常系テストケース（7ケース）
- [ ] TC-ERROR-001: 環境変数未設定エラー
- [ ] TC-ERROR-002: 認証失敗エラー（401）
- [ ] TC-ERROR-003: ネットワークエラー
- [ ] TC-ERROR-004: APIタイムアウトエラー
- [ ] TC-ERROR-005: キャッシュファイル破損
- [ ] TC-ERROR-006: APIメンテナンス中（503）
- [ ] TC-ERROR-007: ファイル書き込みエラー

### 境界値テストケース（6ケース）
- [ ] TC-BOUNDARY-001: 有効期限ちょうど5分前
- [ ] TC-BOUNDARY-002: 有効期限5分1秒前
- [ ] TC-BOUNDARY-003: 空のキャッシュファイル
- [ ] TC-BOUNDARY-004: 非常に長いトークン文字列
- [ ] TC-BOUNDARY-005: リトライ回数境界値（3回目成功）
- [ ] TC-BOUNDARY-006: リトライ回数超過（4回目なし）

---

## 7. 参照文書

### EARS要件定義書
- `j-quants-requirements.md`: 機能要件（REQ-001～REQ-604）
- `j-quants-acceptance-criteria.md`: 受け入れ基準

### 設計文書
- `architecture.md`: アーキテクチャ設計（レイヤー構成、エラーハンドリング戦略）
- `dataflow.md`: データフロー図（起動・認証フロー、トークン再取得フロー）
- `interfaces.ts`: 型定義（TokenCache、ErrorCode等）
- `api-integration.md`: API統合仕様（認証エンドポイント）

### 技術スタック
- `tech-stack.md`: 技術スタック選定理由（Vitest、TypeScript、Node.js）

---

**作成者**: Claude Code (TDD Test Cases Agent)
**最終更新**: 2025-10-29
