# TASK-0005: エラーハンドリング・バリデーション - 要件定義書

**タスクID**: TASK-0005
**機能名**: エラーハンドリング・バリデーション実装（Error Handling & Validation）
**作成日**: 2025-10-29
**種別**: TDD
**推定時間**: 8時間
**依存タスク**: TASK-0002（型定義）、TASK-0004（APIクライアント）
**関連要件**: REQ-601, REQ-602, REQ-603, REQ-701, NFR-301

---

## 1. 機能の概要

### 🔵 何をする機能か
**信頼性レベル: 青信号**（j-quants-phase1.md Day 5 TASK-0005定義から抽出）

ユーティリティモジュールを実装します。エラーハンドリング、パラメータバリデーション、ロギング機能、リトライロジックを提供し、全体的なシステムの安定性と保守性を向上させます。

### 🔵 どのような問題を解決するか
**信頼性レベル: 青信号**（タスク定義書から抽出）

- **問題1**: API呼び出し時のエラーが適切に処理されず、デバッグが困難
- **問題2**: 不正な入力パラメータがAPIリクエストに渡され、実行時エラーが発生
- **問題3**: エラー発生時のログが不十分で、問題の追跡が困難
- **問題4**: リトライロジックが各実装で重複し、保守性が低い

**解決策**:
4つのユーティリティモジュールが以下を提供：
- 統一されたエラーハンドリング機構（日本語エラーメッセージ）
- 型安全なパラメータバリデーション
- 構造化されたログ記録機能
- 汎用的なリトライ・遅延関数

### 🔵 想定されるユーザー
**信頼性レベル: 青信号**（タスク定義書から抽出）

- **As a MCP Server Developer**: APIクライアント、MCPツールを実装する開発者
- **As a Internal Module**: src/api/j-quants-client.ts、src/tools/配下のすべてのモジュール

### 🔵 システム内での位置づけ
**信頼性レベル: 青信号**（タスク定義書のアーキテクチャから抽出）

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
│  JQuantsClient (TASK-0004)              │
│  - HTTP通信                              │
│  - 認証ヘッダー付与                      │
│  - リトライロジック                      │
└─────────────────┬───────────────────────┘
                  │ 依存
┌─────────────────▼───────────────────────┐
│  **ユーティリティ (TASK-0005)** ◄── 今回実装
│  - エラーハンドラー                      │
│  - バリデーター                          │
│  - ロガー                                │
│  - リトライユーティリティ                │
└─────────────────────────────────────────┘
```

### 参照情報
- **参照したタスク定義**: `docs/tasks/j-quants-phase1.md` (lines 512-661)
- **参照した型定義**: `src/types/index.ts`
- **参照した既存実装**: `src/api/j-quants-client.ts` (エラーハンドリングパターン)

---

## 2. 入力・出力の仕様

### モジュール1: エラーハンドラー (src/utils/error-handler.ts)

#### 🔵 handleApiError()
**信頼性レベル: 青信号**（タスク定義書から抽出）

```typescript
function handleApiError(error: any, context: string): never
```

**入力**:
- `error: any` - キャッチされたエラーオブジェクト
- `context: string` - エラー発生コンテキスト（例: "銘柄情報取得"）

**出力**:
- never型（必ず例外をスロー）

**処理フロー**:
1. エラーをロガーに記録
2. エラーメッセージを整形
3. 整形されたエラーをスロー

---

#### 🔵 getErrorMessage()
**信頼性レベル: 青信号**（タスク定義書から抽出）

```typescript
function getErrorMessage(errorCode: ErrorCode, context?: any): string
```

**入力**:
- `errorCode: ErrorCode` - エラーコード（列挙型）
- `context?: any` - エラーメッセージテンプレート変数（例: { code: '9999' }）

**出力**:
- `string` - 日本語エラーメッセージ

**エラーメッセージ定義**（タスク定義書から抽出）:
```typescript
const errorMessages: Record<ErrorCode, string> = {
  INVALID_CODE: '指定された銘柄コード（{code}）は存在しません',
  INVALID_DATE: '日付はYYYY-MM-DD形式で指定してください',
  API_ERROR: 'J-Quants APIへの接続に失敗しました',
  TIMEOUT: 'APIの応答がタイムアウトしました（5秒）',
  MISSING_PARAM: '必須パラメータ {param} が指定されていません',
  INVALID_RANGE: '日付範囲が不正です（from > to）',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  RATE_LIMIT: 'APIレート制限に達しました。しばらく待ってから再試行してください',
};
```

---

#### 🔵 isRetryableError()
**信頼性レベル: 青信号**（タスク定義書から抽出）

```typescript
function isRetryableError(error: any): boolean
```

**入力**:
- `error: any` - 判定対象のエラーオブジェクト

**出力**:
- `boolean` - リトライ可能ならtrue

**判定ロジック**:
- 5xxエラー → true
- 429エラー（レート制限） → true
- ネットワークエラー（TypeError） → true
- タイムアウト（AbortError） → true
- 400エラー → false（クライアントエラー、リトライ不可）
- 401エラー → true（トークン再取得でリトライ可能）

---

#### 🔵 formatErrorResponse()
**信頼性レベル: 青信号**（タスク定義書から抽出）

```typescript
function formatErrorResponse(error: any): ErrorResponse
```

**入力**:
- `error: any` - 整形対象のエラーオブジェクト

**出力**:
```typescript
interface ErrorResponse {
  code: ErrorCode;
  message: string;
  context?: any;
  timestamp: string;
}
```

---

### モジュール2: バリデーター (src/utils/validator.ts)

#### 🔵 validateCode()
**信頼性レベル: 青信号**（タスク定義書から抽出）

```typescript
function validateCode(code: string): void
```

**入力**:
- `code: string` - 検証対象の銘柄コード

**バリデーションルール**: `/^[0-9]{4}$/` （4桁数字）

**出力**:
- void（エラー時は ValidationError をスロー）

**エラー条件**:
- コードが4桁でない場合
- 数字以外の文字が含まれる場合

---

#### 🔵 validateDate()
**信頼性レベル: 青信号**（タスク定義書から抽出）

```typescript
function validateDate(date: string): void
```

**入力**:
- `date: string` - 検証対象の日付文字列

**バリデーションルール**: `/^\d{4}-\d{2}-\d{2}$/` （YYYY-MM-DD形式）

**出力**:
- void（エラー時は ValidationError をスロー）

**追加検証**:
- 実在する日付かをチェック（2025-13-40 は不正）
- 日付の妥当性検証（Date.parse()で確認）

---

#### 🔵 validateDateRange()
**信頼性レベル: 青信号**（タスク定義書から抽出）

```typescript
function validateDateRange(from: string, to: string): void
```

**入力**:
- `from: string` - 開始日（YYYY-MM-DD）
- `to: string` - 終了日（YYYY-MM-DD）

**バリデーションルール**:
- from, to が個別にvalidateDate()をパス
- from <= to であること

**出力**:
- void（エラー時は ValidationError をスロー）

---

#### 🔵 validateRequiredParam()
**信頼性レベル: 青信号**（タスク定義書から抽出）

```typescript
function validateRequiredParam(value: any, paramName: string): void
```

**入力**:
- `value: any` - 検証対象の値
- `paramName: string` - パラメータ名（エラーメッセージ用）

**バリデーションルール**:
- value !== undefined
- value !== null
- value !== ''（空文字列）

**出力**:
- void（エラー時は ValidationError をスロー）

---

#### 🔵 validateEnum()
**信頼性レベル: 青信号**（タスク定義書から抽出）

```typescript
function validateEnum<T>(value: any, enumObj: T, paramName: string): void
```

**入力**:
- `value: any` - 検証対象の値
- `enumObj: T` - TypeScript列挙型オブジェクト（例: Market, Sector, StatementType）
- `paramName: string` - パラメータ名

**バリデーションルール**:
- value が enumObj の値に含まれること

**出力**:
- void（エラー時は ValidationError をスロー）

---

### モジュール3: ロガー (src/utils/logger.ts)

#### 🔵 error()
**信頼性レベル: 青信号**（タスク定義書から抽出）

```typescript
function error(message: string, context?: any): void
```

**入力**:
- `message: string` - ログメッセージ
- `context?: any` - 追加コンテキスト情報（オブジェクト）

**出力**:
- void（logs/error.log にファイル出力）

**ログフォーマット**:
```
[2025-10-29T15:22:30.123Z] ERROR: エラーメッセージ
Context: { code: '1234', message: 'API Error' }
```

---

#### 🟡 info()
**信頼性レベル: 黄信号**（タスク定義書に記載あるが詳細不明）

```typescript
function info(message: string, context?: any): void
```

**入力**:
- `message: string` - ログメッセージ
- `context?: any` - 追加コンテキスト情報

**出力**:
- void（コンソール出力）

**備考**: オプション機能、実装優先度は低い

---

#### 🔵 debug()
**信頼性レベル: 青信号**（タスク定義書から抽出）

```typescript
function debug(message: string, context?: any): void
```

**入力**:
- `message: string` - デバッグメッセージ
- `context?: any` - 追加コンテキスト情報

**出力**:
- void（NODE_ENV=development 時のみコンソール出力）

**動作条件**:
- `process.env.NODE_ENV === 'development'` の場合のみログ出力

---

#### 🟡 setLogLevel()
**信頼性レベル: 黄信号**（タスク定義書に記載あるが詳細不明）

```typescript
function setLogLevel(level: LogLevel): void
```

**入力**:
- `level: LogLevel` - ログレベル（ERROR, INFO, DEBUG）

**出力**:
- void（内部状態を更新）

---

### モジュール4: リトライユーティリティ (src/utils/retry.ts)

#### 🔵 sleep()
**信頼性レベル: 青信号**（タスク定義書から抽出）

```typescript
function sleep(ms: number): Promise<void>
```

**入力**:
- `ms: number` - 待機時間（ミリ秒）

**出力**:
- `Promise<void>` - 指定時間後に resolve

**実装方針**:
```typescript
return new Promise((resolve) => setTimeout(resolve, ms));
```

---

#### 🔵 calculateBackoffDelay()
**信頼性レベル: 青信号**（タスク定義書から抽出）

```typescript
function calculateBackoffDelay(attempt: number, baseDelay: number = 1000): number
```

**入力**:
- `attempt: number` - リトライ試行回数（0から開始）
- `baseDelay: number` - 基本遅延時間（デフォルト: 1000ms）

**出力**:
- `number` - 計算された遅延時間（ミリ秒）

**計算式**: `baseDelay * (2 ^ attempt)`
- attempt 0 → 1000ms
- attempt 1 → 2000ms
- attempt 2 → 4000ms

---

#### 🔵 retryableRequest()
**信頼性レベル: 青信号**（タスク定義書から抽出）

```typescript
function retryableRequest<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T>
```

**入力**:
- `fn: () => Promise<T>` - リトライ対象の非同期関数
- `maxRetries: number` - 最大リトライ回数（デフォルト: 3）

**出力**:
- `Promise<T>` - 関数の実行結果

**処理フロー**:
1. fnを実行
2. 成功したら結果を返す
3. エラー発生時、isRetryableError()で判定
4. リトライ可能なら calculateBackoffDelay()で遅延時間計算
5. sleep()で待機後、再試行
6. maxRetriesに達したら最後のエラーをスロー

---

## 3. 制約条件

### 🔵 パフォーマンス要件
**信頼性レベル: 青信号**（タスク定義書のNFR-001から推測）

- バリデーション処理は1ms以内に完了すること
- ロギング処理はメインスレッドをブロックしないこと
- エラーハンドリングのオーバーヘッドは無視できる程度であること

### 🔵 セキュリティ要件
**信頼性レベル: 青信号**（タスク定義書のNFR-301から抽出）

- エラーメッセージに機密情報（トークン、API Key）を含めないこと
- ログファイルに個人情報を記録しないこと
- エラーレスポンスは適切にサニタイズすること

### 🔵 互換性要件
**信頼性レベル: 青信号**（TASK-0004との連携）

- TASK-0004（JQuantsClient）で使用できる形式であること
- TypeScript strict mode に準拠すること
- すべてのメソッドが型安全であること

### 🔵 アーキテクチャ制約
**信頼性レベル: 青信号**（プロジェクト技術スタックから抽出）

- Node.js 20 LTS で動作すること
- TypeScript 5.x で記述すること
- 外部依存ライブラリを極力使用しないこと（標準ライブラリ優先）

### 🔵 ログファイル制約
**信頼性レベル: 青信号**（タスク定義書から抽出）

- ログファイル保存先: `logs/error.log`
- ログファイルは `.gitignore` に追加すること
- ログファイルローテーション: 実装不要（教育目的のため）

---

## 4. 想定される使用例

### 🔵 基本的な使用パターン
**信頼性レベル: 青信号**（タスク定義書とTASK-0004の実装から推測）

#### パターン1: バリデーション → APIリクエスト
```typescript
import { validateCode, validateDateRange } from './utils/validator';
import { handleApiError } from './utils/error-handler';

async function getStockData(code: string, from: string, to: string) {
  try {
    // 入力検証
    validateCode(code);
    validateDateRange(from, to);

    // APIリクエスト
    const data = await apiClient.getDailyQuotes(code, from, to);
    return data;
  } catch (error) {
    handleApiError(error, 'Stock data retrieval');
  }
}
```

#### パターン2: リトライロジック
```typescript
import { retryableRequest } from './utils/retry';

const result = await retryableRequest(async () => {
  return await apiClient.getListedInfo();
}, 3);
```

#### パターン3: エラーログ記録
```typescript
import { error as logError } from './utils/logger';

try {
  await riskyOperation();
} catch (err) {
  logError('Operation failed', { operation: 'riskyOperation', error: err });
  throw err;
}
```

---

### 🔵 エッジケース
**信頼性レベル: 青信号**（タスク定義書のテストケースから抽出）

#### エッジケース1: 空文字列の銘柄コード
```typescript
validateCode(''); // ✗ ValidationError: 銘柄コードは4桁の数字である必要があります
```

#### エッジケース2: 不正な日付形式
```typescript
validateDate('29/10/2025'); // ✗ ValidationError: 日付はYYYY-MM-DD形式で指定してください
validateDate('2025-13-40');  // ✗ ValidationError: 実在しない日付です
```

#### エッジケース3: 逆順の日付範囲
```typescript
validateDateRange('2025-12-31', '2025-01-01'); // ✗ ValidationError: 日付範囲が不正です（from > to）
```

---

### 🔵 エラーケース
**信頼性レベル: 青信号**（タスク定義書のテストケースから抽出）

#### エラーケース1: リトライ可能エラー（5xx）
```typescript
const error = { status: 500, message: 'Internal Server Error' };
isRetryableError(error); // → true
```

#### エラーケース2: リトライ不可エラー（400）
```typescript
const error = { status: 400, message: 'Bad Request' };
isRetryableError(error); // → false
```

#### エラーケース3: 必須パラメータ不足
```typescript
validateRequiredParam(undefined, 'code'); // ✗ ValidationError: 必須パラメータ code が指定されていません
```

---

## 5. タスク定義との対応関係

### 🔵 参照したタスク定義
**信頼性レベル: 青信号**（j-quants-phase1.md Day 5 TASK-0005）

**タスクID**: TASK-0005
**タスク名**: エラーハンドリング・バリデーション実装（Error Handling & Validation）

### 🔵 参照した要件
**信頼性レベル: 青信号**（タスク定義書から抽出）

- **REQ-601**: リトライロジック（Exponential backoff）
- **REQ-602**: エラーハンドリング機構
- **REQ-603**: タイムアウト制御
- **REQ-701**: MCPツール共通基盤
- **NFR-301**: 日本語コメント・メッセージ

### 🔵 参照したテストケース詳細
**信頼性レベル: 青信号**（タスク定義書から抽出）

#### error-handler.test.ts
1. getErrorMessage() - 銘柄コード不正
   - errorCode: INVALID_CODE, context: { code: '9999' }
   - ✓ 返却メッセージ: "指定された銘柄コード（9999）は存在しません"

2. getErrorMessage() - 日付形式不正
   - errorCode: INVALID_DATE
   - ✓ 返却メッセージ: "日付はYYYY-MM-DD形式で指定してください"

3. isRetryableError() - 5xx エラー
   - error: { status: 500 }
   - ✓ true を返却

4. isRetryableError() - 4xx エラー
   - error: { status: 400 }
   - ✓ false を返却

#### validator.test.ts
1. validateCode() - 正常な銘柄コード
   - code: '1234'
   - ✓ エラーなし

2. validateCode() - 不正な銘柄コード
   - code: '123' または 'ABCD'
   - ✓ ValidationError スロー

3. validateDate() - 正常な日付
   - date: '2025-10-29'
   - ✓ エラーなし

4. validateDate() - 不正な日付
   - date: '2025-13-40' または '29/10/2025'
   - ✓ ValidationError スロー

5. validateDateRange() - 正常な範囲
   - from: '2025-01-01', to: '2025-12-31'
   - ✓ エラーなし

6. validateDateRange() - 逆順（from > to）
   - from: '2025-12-31', to: '2025-01-01'
   - ✓ ValidationError スロー

#### logger.test.ts
1. error() ログ記録
   - message: 'Test error'
   - ✓ logs/error.log に記録される
   - ✓ タイムスタンプ, ログレベル, メッセージが含まれる

### 🔵 参照した型定義
**信頼性レベル: 青信号**（src/types/index.ts）

- `Market` 列挙型
- `Sector` 列挙型
- `StatementType` 列挙型
- `Company`, `StockPrice`, `FinancialStatements` インターフェース

### 🔵 参照した既存実装
**信頼性レベル: 青信号**（TASK-0004の実装パターン）

- `src/api/j-quants-client.ts`:
  - リトライロジックのパターン（retryableRequest()）
  - エラー判定のパターン（isRetryableError()）
  - delay()の実装パターン

---

## 6. 完了基準

**タスク定義書から抽出**:

- [ ] `src/utils/error-handler.ts` が実装され、エラーメッセージが日本語で定義
- [ ] `src/utils/validator.ts` が5つの検証メソッドを実装
- [ ] `src/utils/logger.ts` が error, debug メソッドを実装し、logs/ にファイル出力
- [ ] `src/utils/retry.ts` が実装
- [ ] すべてのテストケース（PASS 条件）がパス
- [ ] TypeScript strict mode でエラーなし
- [ ] TASK-0004（JQuantsClient）で利用可能であることを確認
- [ ] 日本語コメントが全メソッドに付与されている

---

## 7. 技術的な注意点

### 🔵 ErrorCode 列挙型の定義
**信頼性レベル: 青信号**（タスク定義書から推測）

```typescript
export enum ErrorCode {
  INVALID_CODE = 'INVALID_CODE',
  INVALID_DATE = 'INVALID_DATE',
  API_ERROR = 'API_ERROR',
  TIMEOUT = 'TIMEOUT',
  MISSING_PARAM = 'MISSING_PARAM',
  INVALID_RANGE = 'INVALID_RANGE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
}
```

### 🔵 ValidationError カスタムエラークラス
**信頼性レベル: 青信号**（タスク定義書から推測）

```typescript
export class ValidationError extends Error {
  constructor(message: string, public code: ErrorCode, public context?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### 🟡 ログファイルのディレクトリ作成
**信頼性レベル: 黄信号**（実装詳細は不明、標準的なパターンから推測）

- logs/ ディレクトリが存在しない場合は自動作成
- fs.existsSync() と fs.mkdirSync() を使用

### 🟡 ログフォーマットの実装方針
**信頼性レベル: 黄信号**（タスク定義書に例があるが詳細不明）

```typescript
const timestamp = new Date().toISOString();
const logMessage = `[${timestamp}] ERROR: ${message}`;
if (context) {
  logMessage += `\nContext: ${JSON.stringify(context)}`;
}
```

---

## 8. TDD開発フロー

### Red Phase
1. error-handler.test.ts の実装（全テスト失敗）
2. validator.test.ts の実装（全テスト失敗）
3. logger.test.ts の実装（全テスト失敗）
4. retry.test.ts の実装（全テスト失敗）

### Green Phase
1. error-handler.ts の実装（テストパス）
2. validator.ts の実装（テストパス）
3. logger.ts の実装（テストパス）
4. retry.ts の実装（テストパス）

### Refactor Phase
1. コード品質改善
2. 重複コード削減
3. コメント改善

### Verification Phase
1. TASK-0004での統合テスト
2. 要件カバレッジ確認
3. 完了報告書作成

---

**作成者**: Claude (Sonnet 4.5)
**作成日**: 2025-10-29
**参照タスク定義**: docs/tasks/j-quants-phase1.md (Day 5 TASK-0005)
**次フェーズ**: Test Cases Phase (`/tsumiki:tdd-testcases`)
