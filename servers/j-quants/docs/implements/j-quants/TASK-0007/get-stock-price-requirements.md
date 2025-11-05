# TASK-0007: get_stock_price - 要件定義書

**タスクID**: TASK-0007
**タスク名**: MCPツール2: get_stock_price（Stock Price Tool）
**関連要件**: REQ-201, REQ-202, REQ-203, REQ-503, REQ-504, REQ-701
**依存タスク**: TASK-0004, TASK-0005
**作成日**: 2025-10-30
**作成者**: Claude (Sonnet 4.5)

---

## 📋 概要

### 目的

指定銘柄の日次株価データを取得するMCPツールを実装する。日付範囲でフィルタリング可能で、結果は日付降順（新しい順）で返却する。

### スコープ

**実装範囲**:
- 銘柄コードによる株価データ取得
- 日付範囲フィルタリング（from_date, to_date）
- 日付降順ソート
- パラメータバリデーション

**実装範囲外**:
- リアルタイム株価データ取得
- 株価チャート生成
- テクニカル指標計算

---

## 🎯 機能要件

### REQ-FUNC-001: 基本的な株価データ取得

**説明**: 指定した銘柄コードの全期間の株価データを取得できる

**受け入れ基準**:
- WHEN ユーザーが銘柄コード（4桁数字）を指定して実行する
- THEN システムはJ-Quants API（GET /prices/daily_quotes）から全期間の株価データを取得する
- AND 取得したデータを日付降順（新しい順）でソートして返却する

**優先度**: 🔴 高（必須機能）

**関連要件**: REQ-201, REQ-202

---

### REQ-FUNC-002: 開始日フィルタリング

**説明**: from_date パラメータで開始日以降のデータのみ取得できる

**受け入れ基準**:
- WHEN ユーザーが from_date（YYYY-MM-DD形式）を指定する
- THEN システムは指定日以降（from_date <= 取引日）のデータのみを返却する
- AND from_date より前のデータは含まれない

**優先度**: 🔴 高（必須機能）

**関連要件**: REQ-203

---

### REQ-FUNC-003: 終了日フィルタリング

**説明**: to_date パラメータで終了日以前のデータのみ取得できる

**受け入れ基準**:
- WHEN ユーザーが to_date（YYYY-MM-DD形式）を指定する
- THEN システムは指定日以前（取引日 <= to_date）のデータのみを返却する
- AND to_date より後のデータは含まれない

**優先度**: 🔴 高（必須機能）

**関連要件**: REQ-203

---

### REQ-FUNC-004: 日付範囲フィルタリング

**説明**: from_date と to_date の両方を指定して特定期間のデータを取得できる

**受け入れ基準**:
- WHEN ユーザーが from_date と to_date の両方を指定する
- THEN システムは from_date <= 取引日 <= to_date の範囲のデータのみを返却する
- AND 指定範囲外のデータは含まれない

**優先度**: 🔴 高（必須機能）

**関連要件**: REQ-203

---

### REQ-FUNC-005: 日付降順ソート

**説明**: 返却される株価データは常に日付降順（新しい順）でソートされる

**受け入れ基準**:
- WHEN システムが株価データを返却する
- THEN prices 配列は date フィールドで降順にソートされている
- AND prices[0].date >= prices[1].date >= prices[2].date ... の順序である

**優先度**: 🔴 高（必須機能）

**関連要件**: REQ-503

---

## 🛡️ バリデーション要件

### REQ-VAL-001: 必須パラメータ検証（code）

**説明**: code パラメータは必須であり、未指定の場合はエラーを返却する

**受け入れ基準**:
- WHEN ユーザーが code パラメータを指定せずに実行する
- THEN システムは ValidationError をスローする
- AND エラーメッセージは「必須パラメータ code が指定されていません」である

**優先度**: 🔴 高（必須機能）

**関連要件**: REQ-504

---

### REQ-VAL-002: 銘柄コード形式検証

**説明**: code パラメータは4桁の数字でなければならない

**受け入れ基準**:
- WHEN ユーザーが 4桁以外（3桁、5桁）または非数字の code を指定する
- THEN システムは ValidationError をスローする
- AND エラーメッセージは「code は4桁の数字である必要があります」である

**優先度**: 🔴 高（必須機能）

**関連要件**: REQ-504

---

### REQ-VAL-003: 日付形式検証

**説明**: from_date, to_date は YYYY-MM-DD 形式でなければならない

**受け入れ基準**:
- WHEN ユーザーが不正な日付形式（例: "2025/01/01", "2025-1-1"）を指定する
- THEN システムは ValidationError をスローする
- AND エラーメッセージは「日付は YYYY-MM-DD 形式で指定してください」である

**優先度**: 🔴 高（必須機能）

**関連要件**: REQ-504

---

### REQ-VAL-004: 日付範囲妥当性検証

**説明**: from_date は to_date 以前でなければならない

**受け入れ基準**:
- WHEN ユーザーが from_date > to_date となる日付を指定する
- THEN システムは ValidationError をスローする
- AND エラーメッセージは「from_date は to_date 以前である必要があります」である

**優先度**: 🔴 高（必須機能）

**関連要件**: REQ-504

---

## 📊 入出力仕様

### 入力パラメータ

```typescript
interface GetStockPriceParams {
  code: string;      // 必須: 銘柄コード（4桁数字）
  from_date?: string; // オプション: 開始日（YYYY-MM-DD）
  to_date?: string;   // オプション: 終了日（YYYY-MM-DD）
}
```

#### パラメータ詳細

| パラメータ | 型 | 必須 | 説明 | 例 |
|-----------|---|------|------|-----|
| code | string | ✅ 必須 | 銘柄コード（4桁数字） | "7203", "9984" |
| from_date | string | ❌ オプション | 開始日（YYYY-MM-DD形式） | "2025-01-01" |
| to_date | string | ❌ オプション | 終了日（YYYY-MM-DD形式） | "2025-12-31" |

---

### 出力形式

```typescript
interface GetStockPriceResult {
  code: string;           // 銘柄コード
  prices: StockPrice[];   // 株価データ配列（日付降順）
}

interface StockPrice {
  code: string;           // 銘柄コード
  date: string;           // 取引日（YYYY-MM-DD）
  open: number;           // 始値
  high: number;           // 高値
  low: number;            // 安値
  close: number;          // 終値
  volume: number;         // 出来高
  turnover?: number;      // 売買代金
  adjusted_close?: number; // 調整後終値
}
```

#### 出力例

```json
{
  "code": "7203",
  "prices": [
    {
      "code": "7203",
      "date": "2025-10-29",
      "open": 3000.0,
      "high": 3100.0,
      "low": 2950.0,
      "close": 3050.0,
      "volume": 1000000,
      "turnover": 3025000000,
      "adjusted_close": 3050.0
    },
    {
      "code": "7203",
      "date": "2025-10-28",
      "open": 2950.0,
      "high": 3020.0,
      "low": 2900.0,
      "close": 3000.0,
      "volume": 950000,
      "turnover": 2856250000,
      "adjusted_close": 3000.0
    }
  ]
}
```

---

## ⚠️ エラーハンドリング

### エラー種別

| エラータイプ | 発生条件 | エラーメッセージ | ステータス |
|------------|---------|----------------|-----------|
| ValidationError | code 未指定 | 必須パラメータ code が指定されていません | - |
| ValidationError | code が4桁数字でない | code は4桁の数字である必要があります | - |
| ValidationError | 日付形式が不正 | 日付は YYYY-MM-DD 形式で指定してください | - |
| ValidationError | from_date > to_date | from_date は to_date 以前である必要があります | - |
| Error | API通信エラー | J-Quants APIへの接続に失敗しました | - |
| - | 存在しない銘柄コード | 空配列を返却（エラーではない） | - |

---

## 🔄 処理フロー

```
1. 入力パラメータ受け取り
   ↓
2. バリデーション
   ├─ code 必須チェック（REQ-VAL-001）
   ├─ code 形式チェック（REQ-VAL-002）
   ├─ from_date/to_date 形式チェック（REQ-VAL-003）
   └─ from_date <= to_date チェック（REQ-VAL-004）
   ↓
3. JQuantsClient 初期化
   ↓
4. J-Quants API 呼び出し（getDailyQuotes）
   ├─ パラメータ: { code }
   └─ エンドポイント: GET /prices/daily_quotes
   ↓
5. 日付範囲フィルタリング
   ├─ from_date 指定時: date >= from_date（REQ-FUNC-002）
   ├─ to_date 指定時: date <= to_date（REQ-FUNC-003）
   └─ 両方指定時: from_date <= date <= to_date（REQ-FUNC-004）
   ↓
6. 日付降順ソート（REQ-FUNC-005）
   ↓
7. 結果返却 { code, prices }
```

---

## 📐 制約事項

### 技術的制約

1. **TypeScript strict mode 準拠**: すべてのコードは strict mode でエラーなしでコンパイル可能
2. **J-Quants API 依存**: J-Quants API の可用性に依存する
3. **日付形式固定**: YYYY-MM-DD 形式のみサポート（ISO 8601準拠）
4. **銘柄コード形式固定**: 4桁数字のみサポート

### ビジネス制約

1. **データ取得範囲**: J-Quants API で提供される範囲のみ（過去データ、リアルタイムは API 次第）
2. **認証必須**: J-Quants API のリフレッシュトークンが必要
3. **レート制限**: J-Quants API のレート制限に従う

---

## 🧪 境界値・エッジケース

### 境界値

| ケース | 入力 | 期待される動作 |
|--------|------|---------------|
| 最小の銘柄コード | code: "0001" | 正常に処理される |
| 最大の銘柄コード | code: "9999" | 正常に処理される |
| 空の結果 | 存在しない銘柄コード | 空配列 `{ code: "9999", prices: [] }` 返却 |
| from_date のみ | code: "7203", from_date: "2025-01-01" | 2025-01-01 以降のデータのみ返却 |
| to_date のみ | code: "7203", to_date: "2025-12-31" | 2025-12-31 以前のデータのみ返却 |
| from_date = to_date | code: "7203", from_date: "2025-10-30", to_date: "2025-10-30" | 2025-10-30 のデータのみ返却 |

### エッジケース

| ケース | 入力 | 期待される動作 |
|--------|------|---------------|
| code が3桁 | code: "123" | ValidationError スロー |
| code が5桁 | code: "12345" | ValidationError スロー |
| code がアルファベット | code: "ABCD" | ValidationError スロー |
| 日付形式がスラッシュ | from_date: "2025/01/01" | ValidationError スロー |
| 日付形式が短縮 | from_date: "2025-1-1" | ValidationError スロー |
| from_date > to_date | from_date: "2025-12-31", to_date: "2025-01-01" | ValidationError スロー |
| API エラー | J-Quants API がエラーを返す | Error スロー |

---

## 🎯 テスト要件サマリー

### テストケース総数

**合計**: 9件
- 正常系: 4件
- 異常系: 4件
- 境界値: 1件

### 正常系テストケース

1. **TC-NORMAL-001**: code のみ指定（全期間データ取得、日付降順確認）
2. **TC-NORMAL-002**: code + from_date 指定
3. **TC-NORMAL-003**: code + to_date 指定
4. **TC-NORMAL-004**: code + from_date + to_date 指定（複合フィルタ）

### 異常系テストケース

5. **TC-ERROR-001**: code パラメータ未指定
6. **TC-ERROR-002**: 不正な code 値（3桁、5桁、アルファベット）
7. **TC-ERROR-003**: 不正な日付形式
8. **TC-ERROR-004**: from_date > to_date

### 境界値テストケース

9. **TC-BOUNDARY-001**: 存在しない銘柄コード（空配列返却確認）

---

## 📚 参考情報

### 関連型定義

- `StockPrice` インターフェース: `src/types/index.ts:40-59`
- `Market` enum: `src/types/index.ts`（業種コードには不使用）
- `Sector` enum: `src/types/index.ts`（業種コードには不使用）

### 関連API

- **J-Quants API エンドポイント**: `GET /prices/daily_quotes`
- **JQuantsClient メソッド**: `getDailyQuotes(code: string)`

### 参考実装

- **TASK-0006**: `get_listed_companies` 実装パターンを参考
  - バリデーション: `validateEnum()` 使用
  - APIクライアント初期化: TokenManager + JQuantsClient
  - フィルタリング: Array.filter() 使用
  - 依存性注入パターン: client パラメータオプション

---

## ✅ 完了基準

### 実装完了基準

- [ ] `src/tools/get-stock-price.ts` が実装されている
- [ ] すべての機能要件（REQ-FUNC-001～005）が実装されている
- [ ] すべてのバリデーション要件（REQ-VAL-001～004）が実装されている
- [ ] TypeScript strict mode でエラーがない
- [ ] ESLint エラーがない

### テスト完了基準

- [ ] `tests/tools/get-stock-price.test.ts` が実装されている
- [ ] 全テストケース（9件）が実装されている
- [ ] 全テストケースがパスする（100%成功率）
- [ ] テストカバレッジが要件を満たしている

### ドキュメント完了基準

- [ ] 要件定義書が作成されている（本ドキュメント）
- [ ] テストケース仕様書が作成されている
- [ ] 実装メモが作成されている

---

**作成者**: Claude (Sonnet 4.5)
**最終更新**: 2025-10-30
**ステータス**: ✅ 要件定義完了
**次のステップ**: `/tsumiki:tdd-testcases` でテストケース仕様書作成
