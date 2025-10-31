# TASK-0003: Token Manager - Green Phase 完了報告

**タスクID**: TASK-0003
**フェーズ**: TDD Green Phase
**作成日**: 2025-10-29
**ステータス**: ✅ 完了
**テスト結果**: 21/21 テスト成功 (100%)

---

## 📋 実施概要

Red Phaseで作成した21個のテストケースを合格させるため、`TokenManager`クラスの本実装を完了しました。

**実装ファイル**:
- `src/auth/token-manager.ts` (~450行、日本語コメント付き)

**テストファイル**:
- `tests/auth/token-manager.test.ts` (正常系8ケース)
- `tests/auth/token-manager-error.test.ts` (異常系7ケース)
- `tests/auth/token-manager-boundary.test.ts` (境界値6ケース)

---

## ✅ 実装完了項目

### 1. TokenManagerクラスの実装

#### コンストラクタ
```typescript
constructor(config: TokenManagerConfig)
```
- ✅ リフレッシュトークンのバリデーション（空文字チェック）
- ✅ デフォルト値設定（`cacheDir: 'data'`, `apiBaseUrl: 'https://api.jquants.com/v1'`）
- ✅ プラットフォーム独立なパス構築（`path.join`使用）
- ✅ 日本語エラーメッセージ（TC-ERROR-001対応）

#### getIdToken()メソッド
```typescript
async getIdToken(): Promise<string>
```
- ✅ キャッシュ優先戦略（Cache-First Strategy）
- ✅ 有効期限チェック（5分マージン）
- ✅ 自動再取得（期限切れ時）
- ✅ キャッシュ保存（3600秒）
- 対応テストケース: TC-NORMAL-001, 002, 003, 008

#### cacheToken()メソッド
```typescript
cacheToken(token: string, expiresIn: number): void
```
- ✅ ISO 8601形式のタイムスタンプ生成
- ✅ JSONファイル保存（`data/token.json`）
- ✅ Graceful Degradation（書き込み失敗時もエラーを投げない）
- ✅ エラーログ出力
- 対応テストケース: TC-NORMAL-004, TC-ERROR-007

#### loadCachedToken()メソッド
```typescript
loadCachedToken(): TokenCache | null
```
- ✅ ファイル存在チェック
- ✅ JSONパース処理
- ✅ エラー時null返却（Graceful Degradation）
- ✅ 空ファイル対応
- 対応テストケース: TC-NORMAL-005, TC-BOUNDARY-003, TC-ERROR-005

#### isTokenExpired()メソッド
```typescript
isTokenExpired(expiresAt: string): boolean
```
- ✅ 5分（300秒）安全マージン
- ✅ 境界値判定（`>=` 演算子使用）
- ✅ ミリ秒単位の正確な計算
- 対応テストケース: TC-NORMAL-006, 007, TC-BOUNDARY-001, 002

#### refreshTokenFromApi()メソッド（リトライロジック付き）
```typescript
private async refreshTokenFromApi(): Promise<string>
```
- ✅ **REQ-601**: 最大3回までリトライ（初回 + リトライ2回）
- ✅ **Exponential Backoff**: 1秒 → 2秒の待機時間
- ✅ **リトライ対象**: 503, 5xx, ネットワークエラー
- ✅ **リトライ対象外**: 401（認証失敗）
- ✅ リトライ中のログ出力
- 対応テストケース: TC-BOUNDARY-005, 006, TC-ERROR-006

#### attemptTokenFetch()メソッド（内部メソッド）
```typescript
private async attemptTokenFetch(): Promise<string>
```
- ✅ HTTPSエンドポイント呼び出し（POST /token/auth_user）
- ✅ タイムアウト制御（5秒、AbortController使用）
- ✅ ステータスコード別エラーハンドリング:
  - 401 → 認証失敗エラー（日本語）
  - 503 → メンテナンス中エラー（日本語）
  - その他 → 汎用エラー
- ✅ ネットワークエラーハンドリング（`TypeError`）
- ✅ タイムアウトエラーハンドリング（`AbortError`）
- 対応テストケース: TC-NORMAL-008, TC-ERROR-002, 003, 004, 006

---

## 🧪 テスト結果

### 実行コマンド
```bash
npm test -- tests/auth/ --run
```

### 結果サマリー
```
Test Files  3 passed (3)
Tests      21 passed (21)
Duration   15.28s
```

### テストケース別結果

#### ✅ 正常系テストケース（8/8 成功）
- TC-NORMAL-001: 初回起動時のIDトークン取得 ✅
- TC-NORMAL-002: キャッシュからのIDトークン取得 ✅
- TC-NORMAL-003: トークン有効期限切れ時の自動再取得 ✅
- TC-NORMAL-004: トークンキャッシュの保存 ✅
- TC-NORMAL-005: トークンキャッシュの読み込み ✅
- TC-NORMAL-006: 有効期限チェック（有効なトークン）✅
- TC-NORMAL-007: 有効期限チェック（期限切れトークン）✅
- TC-NORMAL-008: 認証APIからのトークン取得 ✅

#### ✅ 異常系テストケース（7/7 成功）
- TC-ERROR-001: 環境変数未設定エラー ✅
- TC-ERROR-002: 認証失敗エラー（401）✅
- TC-ERROR-003: ネットワークエラー ✅（リトライ3回実行確認）
- TC-ERROR-004: APIタイムアウトエラー ✅（リトライ3回実行確認）
- TC-ERROR-005: キャッシュファイル破損 ✅（Graceful Degradation確認）
- TC-ERROR-006: APIメンテナンス中（503）✅（リトライ3回実行確認）
- TC-ERROR-007: ファイル書き込みエラー ✅（Graceful Degradation確認）

#### ✅ 境界値テストケース（6/6 成功）
- TC-BOUNDARY-001: 有効期限ちょうど5分前 ✅
- TC-BOUNDARY-002: 有効期限5分1秒前 ✅
- TC-BOUNDARY-003: 空のキャッシュファイル ✅
- TC-BOUNDARY-004: 非常に長いトークン文字列 ✅
- TC-BOUNDARY-005: リトライ回数境界値（3回目成功）✅（3026ms実行時間）
- TC-BOUNDARY-006: リトライ回数超過（4回目なし）✅（3017ms実行時間）

---

## 🔧 実装中に発生した問題と解決策

### 問題1: テストファイルのインポート問題
**問題**: `token-manager-error.test.ts`と`token-manager-boundary.test.ts`でインポート文がコメントアウトされたまま
**原因**: Red Phaseで実装未完了のためコメントアウトされていた
**解決策**: インポート文のコメント解除
```typescript
// Before
// import { TokenManager } from '../../src/auth/token-manager';

// After
import { TokenManager } from '../../src/auth/token-manager';
```
**影響**: 13テストケースが実行可能に

### 問題2: Windowsパス区切り文字の不一致
**問題**: `path.join()`がWindows環境で`data\token.json`を返すが、テストは`data/token.json`を期待
**原因**: プラットフォーム依存のパス区切り文字（Windows: `\`, Unix: `/`）
**解決策**: テストの期待値を正規表現パターンマッチに変更
```typescript
// Before
expect(writeFileSyncSpy).toHaveBeenCalledWith(
  'data/token.json',
  expect.stringContaining('new_token_12345'),
  'utf-8'
);

// After
expect(writeFileSyncSpy).toHaveBeenCalledWith(
  expect.stringMatching(/data[\\/]token\.json/),
  expect.stringContaining('new_token_12345'),
  'utf-8'
);
```
**影響**: 2テストケース（TC-NORMAL-001, 003）が成功

### 問題3: TC-NORMAL-008のprivateメソッド呼び出し
**問題**: テストが`tokenManager.refreshToken()`を呼び出すが、`refreshTokenFromApi()`はprivate
**原因**: テストケースの設計ミス（内部実装を直接テストしようとした）
**解決策**: `getIdToken()`経由で間接的にテスト
```typescript
// Before
const idToken = await tokenManager.refreshToken();

// After
// キャッシュファイルが存在しない状態でgetIdToken()を呼ぶと、
// 内部でrefreshTokenFromApi()が呼ばれる
vi.spyOn(fs, 'existsSync').mockReturnValue(false);
const idToken = await tokenManager.getIdToken();
```
**影響**: 1テストケース（TC-NORMAL-008）が成功

### 問題4: リトライロジック未実装
**問題**: TC-ERROR-006で`fetch`が1回しか呼ばれず、期待値の3回に到達しない
**原因**: **REQ-601（最大3回リトライ）**の実装漏れ
**解決策**: リトライロジックの実装
```typescript
private async refreshTokenFromApi(): Promise<string> {
  const MAX_RETRIES = 2; // 初回 + リトライ2回 = 合計3回
  const RETRY_DELAYS = [1000, 2000]; // Exponential backoff

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await this.attemptTokenFetch();
    } catch (error) {
      lastError = error as Error;

      // 401はリトライ対象外
      if (lastError.message.includes('認証に失敗しました')) {
        throw lastError;
      }

      // 最後の試行ではリトライしない
      if (attempt === MAX_RETRIES) {
        break;
      }

      // Exponential backoff
      const delay = RETRY_DELAYS[attempt];
      console.error(`API呼び出し失敗（試行 ${attempt + 1}/${MAX_RETRIES + 1}）: ${delay}ms後にリトライします...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('API呼び出しに失敗しました');
}
```
**影響**: 3テストケース（TC-ERROR-003, 004, 006, TC-BOUNDARY-005, 006）が成功

---

## 📊 コード品質メトリクス

### コードカバレッジ（推定）
- **メソッドカバレッジ**: 100% (全7メソッドがテスト済み)
- **ブランチカバレッジ**: 95%以上（主要な分岐をすべてカバー）
- **エラーパスカバレッジ**: 100% (7種類のエラーケースすべてテスト済み)

### 実装規模
- **総行数**: ~450行（コメント含む）
- **メソッド数**: 7個（public: 5, private: 2）
- **インターフェース**: 2個（`TokenManagerConfig`, `TokenCache`）
- **日本語コメント**: ~200行（実装意図・テストケース対応を詳細記載）

### 準拠要件
- ✅ REQ-001: リフレッシュトークン設定
- ✅ REQ-002: IDトークン取得
- ✅ REQ-003: トークンキャッシング
- ✅ REQ-601: リトライロジック（最大3回、Exponential backoff）
- ✅ REQ-602: エラーログ記録
- ✅ REQ-603: タイムアウト制御（5秒）
- ✅ REQ-604: 自動再取得（5分マージン）
- ✅ NFR-001: 応答時間（タイムアウト5秒以内）
- ✅ NFR-002: パフォーマンス（キャッシュ活用）
- ✅ NFR-102: エラーハンドリング（Graceful Degradation）
- ✅ NFR-301: 日本語エラーメッセージ

---

## 📝 実装のポイント

### 1. Graceful Degradation パターン
キャッシュ書き込み失敗時もシステムを停止せず、IDトークンは正常に返却する設計。
```typescript
cacheToken(token: string, expiresIn: number): void {
  try {
    fs.writeFileSync(this.cacheFilePath, JSON.stringify(cache), 'utf-8');
  } catch (error) {
    // ログ出力のみ、エラーは投げない
    console.error(`トークンキャッシュファイルの書き込みに失敗しました: ${error}`);
  }
}
```

### 2. Exponential Backoff によるリトライ
一時的エラー（503, ネットワークエラー）に対して、段階的に待機時間を延ばしてリトライ。
```typescript
const RETRY_DELAYS = [1000, 2000]; // 1秒 → 2秒
await new Promise(resolve => setTimeout(resolve, delay));
```

### 3. 5分安全マージン
トークン有効期限の5分前を「期限切れ」と判定し、APIリクエスト中の期限切れを防止。
```typescript
const SAFETY_MARGIN_MS = 300 * 1000; // 5分
return now >= (expires - SAFETY_MARGIN_MS);
```

### 4. プラットフォーム独立設計
`path.join()`を使用し、Windows/Unix両対応。
```typescript
this.cacheFilePath = path.join(this.cacheDir, 'token.json');
// Windows: data\token.json
// Unix: data/token.json
```

---

## 🚀 次のステップ

### Refactorフェーズへ移行
✅ Green Phase完了
➡️ 次: Refactor Phase（コード品質改善）

**Refactor候補**:
1. エラーログを`console.error`から専用ロガーに移行（`logs/error.log`）
2. リトライロジックを独立した関数に抽出
3. タイムアウト値（5秒）を設定可能に
4. エラーコードを定数化（`ErrorCode.API_MAINTENANCE`など）

---

## 📚 参照ドキュメント

- **要件定義**: `token-manager-requirements.md`
- **テストケース**: `token-manager-testcases.md`
- **Redフェーズメモ**: `token-manager-memo.md`
- **アーキテクチャ**: `../../design/architecture.md`（エラーハンドリング戦略）
- **API仕様**: `../../design/api-integration.md`（認証エンドポイント）

---

## ✅ 完了チェックリスト

- [x] TokenManagerクラス実装完了
- [x] 全21テストケース合格（100%）
- [x] REQ-601（リトライロジック）実装完了
- [x] Graceful Degradation実装完了
- [x] 日本語エラーメッセージ実装完了
- [x] プラットフォーム独立設計完了
- [x] Green Phase完了報告書作成

---

**作成者**: Claude (Sonnet 4.5)
**レビュー**: 未実施
**承認**: 未承認
**次フェーズ**: Refactor Phase
