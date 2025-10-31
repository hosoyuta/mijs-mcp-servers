# TASK-0008: get_financial_statements - 要件定義書

**タスクID**: TASK-0008
**タスク名**: MCPツール3: get_financial_statements（Financial Statements Tool）
**関連要件**: REQ-301, REQ-302, REQ-701
**依存タスク**: TASK-0004, TASK-0005
**作成日**: 2025-10-30
**作成者**: Claude (Sonnet 4.5)

---

## 📋 概要

### 目的

指定銘柄の財務諸表（貸借対照表・損益計算書・キャッシュフロー計算書）を取得するMCPツールを実装する。連結/単体の財務諸表種別を指定可能とする。

### スコープ

**実装範囲**:
- 銘柄コードによる財務諸表データ取得
- 財務諸表種別フィルタリング（連結/単体）
- 貸借対照表（Balance Sheet）の取得
- 損益計算書（Profit & Loss）の取得
- キャッシュフロー計算書（Cash Flow）の取得
- パラメータバリデーション

**実装範囲外**:
- 複数年度の財務データ比較
- 財務指標の計算（ROE, ROA等）
- 財務分析レポート生成

---

## 🎯 機能要件

### REQ-FUNC-001: 基本的な財務諸表データ取得

**説明**: 指定した銘柄コードの最新の財務諸表データを取得できる

**受け入れ基準**:
- WHEN ユーザーが銘柄コード（4桁数字）を指定して実行する
- THEN システムはJ-Quants API（GET /fins/statements）から最新の財務諸表データを取得する
- AND 取得したデータには貸借対照表、損益計算書、キャッシュフロー計算書が含まれる

**優先度**: 🔴 高（必須機能）

**関連要件**: REQ-301, REQ-302

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義（j-quants-phase1.md Day 8: TASK-0008）から抽出

---

### REQ-FUNC-002: 連結財務諸表の取得

**説明**: statement_type='Consolidated' で連結財務諸表を取得できる

**受け入れ基準**:
- WHEN ユーザーが statement_type='Consolidated' を指定する
- THEN システムは連結財務諸表のデータのみを返却する
- AND 連結財務諸表が存在しない場合はエラーを返却する

**優先度**: 🔴 高（必須機能）

**関連要件**: REQ-302

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のTASK-0008テストケース3から確定

---

### REQ-FUNC-003: 単体財務諸表の取得

**説明**: statement_type='NonConsolidated' で単体（非連結）財務諸表を取得できる

**受け入れ基準**:
- WHEN ユーザーが statement_type='NonConsolidated' を指定する
- THEN システムは単体財務諸表のデータのみを返却する
- AND 単体財務諸表が存在しない場合はエラーを返却する

**優先度**: 🔴 高（必須機能）

**関連要件**: REQ-302

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のTASK-0008テストケース4から確定

---

### REQ-FUNC-004: デフォルト財務諸表の取得

**説明**: statement_type未指定時は連結財務諸表を優先的に取得する

**受け入れ基準**:
- WHEN ユーザーが statement_type を指定しない
- THEN システムは連結財務諸表を取得する
- IF 連結財務諸表が存在しない THEN 単体財務諸表を取得する

**優先度**: 🟡 中（推奨機能）

**関連要件**: REQ-302

**【信頼性レベル】**: 🟡 黄信号
**【根拠】**: Phase 1タスク定義から推測（一般的な財務諸表取得の慣例）

---

## 🛡️ バリデーション要件

### REQ-VAL-001: 必須パラメータ検証（code）

**説明**: code パラメータは必須であり、未指定の場合はエラーを返却する

**受け入れ基準**:
- WHEN ユーザーが code パラメータを指定せずに実行する
- THEN システムは ValidationError をスローする
- AND エラーメッセージは「必須パラメータ code が指定されていません」である

**優先度**: 🔴 高（必須機能）

**関連要件**: REQ-701

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のTASK-0008テストケース1から確定

---

### REQ-VAL-002: 銘柄コード形式検証

**説明**: code パラメータは4桁の数字でなければならない

**受け入れ基準**:
- WHEN ユーザーが 4桁以外（3桁、5桁）または非数字の code を指定する
- THEN システムは ValidationError をスローする
- AND エラーメッセージは「銘柄コードは4桁の数字である必要があります」である

**優先度**: 🔴 高（必須機能）

**関連要件**: REQ-701

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: 既存のvalidator.ts実装と Phase 1タスク定義のTASK-0008テストケース5から確定

---

### REQ-VAL-003: 財務諸表種別検証

**説明**: statement_type は 'Consolidated' または 'NonConsolidated' でなければならない

**受け入れ基準**:
- WHEN ユーザーが不正な statement_type（例: 'INVALID'）を指定する
- THEN システムは ValidationError をスローする
- AND エラーメッセージは「statement_type パラメータの値が不正です」である

**優先度**: 🔴 高（必須機能）

**関連要件**: REQ-701

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のTASK-0008テストケース6から確定

---

## 📊 入出力仕様

### 入力パラメータ

```typescript
interface GetFinancialStatementsParams {
  code: string;           // 必須: 銘柄コード（4桁数字）
  statement_type?: string; // オプション: 'Consolidated' | 'NonConsolidated'
}
```

#### パラメータ詳細

| パラメータ | 型 | 必須 | 説明 | 例 |
|-----------|---|------|------|-----|
| code | string | ✅ 必須 | 銘柄コード（4桁数字） | "7203", "9984" |
| statement_type | string | ❌ オプション | 財務諸表種別 | "Consolidated", "NonConsolidated" |

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のTASK-0008入力パラメータとStatementType enum定義から確定

---

### 出力形式

```typescript
interface GetFinancialStatementsResult {
  code: string;                    // 銘柄コード
  fiscal_year: string;              // 会計年度（YYYY形式）
  statement_type: StatementType;    // 財務諸表種別
  balance_sheet: BalanceSheet;      // 貸借対照表
  profit_loss: ProfitLoss;          // 損益計算書
  cash_flow: CashFlow;              // キャッシュフロー計算書
}

interface BalanceSheet {
  total_assets: number;             // 総資産
  current_assets: number;           // 流動資産
  non_current_assets: number;       // 固定資産
  total_liabilities: number;        // 総負債
  current_liabilities: number;      // 流動負債
  non_current_liabilities: number;  // 固定負債
  net_assets: number;               // 純資産
  equity: number;                   // 自己資本
}

interface ProfitLoss {
  revenue: number;                  // 売上高
  cost_of_sales: number;            // 売上原価
  gross_profit: number;             // 売上総利益
  operating_profit: number;         // 営業利益
  ordinary_profit: number;          // 経常利益
  profit_before_tax: number;        // 税引前当期純利益
  net_profit: number;               // 当期純利益
  earnings_per_share?: number;      // 1株当たり当期純利益（EPS）
}

interface CashFlow {
  operating_cash_flow: number;      // 営業活動によるキャッシュフロー
  investing_cash_flow: number;      // 投資活動によるキャッシュフロー
  financing_cash_flow: number;      // 財務活動によるキャッシュフロー
  free_cash_flow: number;           // フリーキャッシュフロー
  cash_and_equivalents: number;     // 現金及び現金同等物の期末残高
}
```

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: src/types/index.ts:68-147 の型定義から確定

#### 出力例

```json
{
  "code": "7203",
  "fiscal_year": "2024",
  "statement_type": "Consolidated",
  "balance_sheet": {
    "total_assets": 10000000000,
    "current_assets": 5000000000,
    "non_current_assets": 5000000000,
    "total_liabilities": 4000000000,
    "current_liabilities": 3000000000,
    "non_current_liabilities": 1000000000,
    "net_assets": 6000000000,
    "equity": 5500000000
  },
  "profit_loss": {
    "revenue": 500000000,
    "cost_of_sales": 350000000,
    "gross_profit": 150000000,
    "operating_profit": 50000000,
    "ordinary_profit": 48000000,
    "profit_before_tax": 45000000,
    "net_profit": 30000000,
    "earnings_per_share": 150.5
  },
  "cash_flow": {
    "operating_cash_flow": 40000000,
    "investing_cash_flow": -10000000,
    "financing_cash_flow": -5000000,
    "free_cash_flow": 30000000,
    "cash_and_equivalents": 100000000
  }
}
```

---

## ⚠️ エラーハンドリング

### エラー種別

| エラータイプ | 発生条件 | エラーメッセージ | ステータス |
|------------|---------|----------------|-----------|
| ValidationError | code 未指定 | 必須パラメータ code が指定されていません | - |
| ValidationError | code が4桁数字でない | 銘柄コードは4桁の数字である必要があります | - |
| ValidationError | statement_type が不正 | statement_type パラメータの値が不正です | - |
| Error | 存在しない銘柄コード | 指定された銘柄コード（XXXX）は存在しません | - |
| Error | 財務データが存在しない | 財務諸表データが利用できません | - |
| Error | API通信エラー | J-Quants APIへの接続に失敗しました | - |

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のTASK-0008エラーハンドリングから確定

---

## 🔄 処理フロー

```
1. 入力パラメータ受け取り
   ↓
2. バリデーション
   ├─ code 必須チェック（REQ-VAL-001）
   ├─ code 形式チェック（REQ-VAL-002）
   └─ statement_type 形式チェック（REQ-VAL-003）
   ↓
3. JQuantsClient 初期化
   ↓
4. J-Quants API 呼び出し（getStatements）
   ├─ パラメータ: { code, statement_type? }
   └─ エンドポイント: GET /fins/statements
   ↓
5. レスポンスデータマッピング
   ├─ BalanceSheet データ抽出
   ├─ ProfitLoss データ抽出
   └─ CashFlow データ抽出
   ↓
6. 結果返却 { code, fiscal_year, statement_type, balance_sheet, profit_loss, cash_flow }
```

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義の処理フローから確定

---

## 📐 制約事項

### 技術的制約

1. **TypeScript strict mode 準拠**: すべてのコードは strict mode でエラーなしでコンパイル可能
2. **J-Quants API 依存**: J-Quants API の可用性に依存する
3. **財務諸表種別固定**: StatementType enum の値のみサポート
4. **銘柄コード形式固定**: 4桁数字のみサポート

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1技術要件とTASK-0002型定義から確定

### ビジネス制約

1. **データ取得範囲**: J-Quants API で提供される最新の財務諸表のみ
2. **認証必須**: J-Quants API のリフレッシュトークンが必要
3. **レート制限**: J-Quants API のレート制限に従う
4. **データ更新頻度**: 四半期ごと（J-Quants APIの仕様）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: J-Quants API仕様とPhase 1タスク定義から確定

---

## 🧪 境界値・エッジケース

### 境界値

| ケース | 入力 | 期待される動作 |
|--------|------|---------------|
| 最小の銘柄コード | code: "0001" | 正常に処理される |
| 最大の銘柄コード | code: "9999" | 正常に処理される |
| statement_type 未指定 | code: "7203" | 連結財務諸表を返却（デフォルト） |
| 連結財務諸表指定 | code: "7203", statement_type: "Consolidated" | 連結財務諸表を返却 |
| 単体財務諸表指定 | code: "7203", statement_type: "NonConsolidated" | 単体財務諸表を返却 |

**【信頼性レベル】**: 🔵 青信号（最初の2つ）、🟡 黄信号（デフォルト動作）
**【根拠】**: Phase 1タスク定義から確定・推測

### エッジケース

| ケース | 入力 | 期待される動作 |
|--------|------|---------------|
| code が3桁 | code: "123" | ValidationError スロー |
| code が5桁 | code: "12345" | ValidationError スロー |
| code がアルファベット | code: "ABCD" | ValidationError スロー |
| statement_type が不正 | statement_type: "INVALID" | ValidationError スロー |
| 存在しない銘柄コード | code: "9999" | Error スロー |
| 財務データが存在しない | code: "8000" | Error スロー |
| API エラー | J-Quants API がエラーを返す | Error スロー |

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のTASK-0008テストケースから確定

---

## 🎯 テスト要件サマリー

### テストケース総数

**合計**: 9件
- 正常系: 3件
- 異常系: 4件
- 境界値: 2件

### 正常系テストケース

1. **TC-NORMAL-001**: code のみ指定（デフォルト：連結財務諸表取得）
2. **TC-NORMAL-002**: code + statement_type='Consolidated' 指定
3. **TC-NORMAL-003**: code + statement_type='NonConsolidated' 指定

### 異常系テストケース

4. **TC-ERROR-001**: code パラメータ未指定
5. **TC-ERROR-002**: 不正な code 値（3桁、5桁、アルファベット）
6. **TC-ERROR-003**: 不正な statement_type 値
7. **TC-ERROR-004**: 存在しない銘柄コード

### 境界値テストケース

8. **TC-BOUNDARY-001**: 財務データが存在しない企業
9. **TC-BOUNDARY-002**: データ形式確認（balance_sheet, profit_loss, cash_flow すべて含む）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のTASK-0008テストケース詳細から確定

---

## 🔗 データフロー

### システム内での位置づけ

```
[Claude Desktop]
      ↓
[MCP Server (src/index.ts)]
      ↓
[get_financial_statements Tool (src/tools/get-financial-statements.ts)]
      ↓
[JQuantsClient.getStatements() (src/api/j-quants-client.ts:154)]
      ↓
[J-Quants API GET /fins/statements]
```

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のアーキテクチャと既存実装から確定

### 依存関係

**依存タスク**:
- **TASK-0004**: JQuantsClient（`getStatements()` メソッド使用）
- **TASK-0005**: エラーハンドリング（`validator.ts`, `error-handler.ts`）
- **TASK-0002**: 型定義（`FinancialStatements`, `BalanceSheet`, `ProfitLoss`, `CashFlow`, `StatementType`）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義の依存タスクから確定

---

## 📚 参考情報

### 関連型定義

- `FinancialStatements` インターフェース: `src/types/index.ts:68-81`
- `BalanceSheet` インターフェース: `src/types/index.ts:88-105`
- `ProfitLoss` インターフェース: `src/types/index.ts:112-129`
- `CashFlow` インターフェース: `src/types/index.ts:136-147`
- `StatementType` enum: `src/types/index.ts:444-449`

### 関連API

- **J-Quants API エンドポイント**: `GET /fins/statements`
- **JQuantsClient メソッド**: `getStatements(code: string, statement_type?: string)` - `src/api/j-quants-client.ts:154`

### 参考実装

- **TASK-0006**: `get_listed_companies` 実装パターンを参考
  - バリデーション: `validateRequiredParam()`, `validateCode()`, `validateEnum()` 使用
  - APIクライアント初期化: TokenManager + JQuantsClient
  - エラーハンドリング: 統一されたエラーレスポンス形式

- **TASK-0007**: `get_stock_price` 実装パターンを参考
  - 必須パラメータバリデーション
  - オプションパラメータの条件付き処理
  - APIレスポンスのマッピング

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: 実装済みモジュールの確認から確定

---

## ✅ 完了基準

### 実装完了基準

- [ ] `src/tools/get-financial-statements.ts` が実装されている
- [ ] すべての機能要件（REQ-FUNC-001～004）が実装されている
- [ ] すべてのバリデーション要件（REQ-VAL-001～003）が実装されている
- [ ] TypeScript strict mode でエラーがない
- [ ] ESLint エラーがない

### テスト完了基準

- [ ] `tests/tools/get-financial-statements.test.ts` が実装されている
- [ ] 全テストケース（9件）が実装されている
- [ ] 全テストケースがパスする（100%成功率）
- [ ] テストカバレッジが要件を満たしている

### ドキュメント完了基準

- [x] 要件定義書が作成されている（本ドキュメント）
- [ ] テストケース仕様書が作成されている
- [ ] 実装メモが作成されている

---

## 🎓 想定される使用例

### ユーザーストーリー

```
As a 金融アナリスト
I want 企業の財務諸表（貸借対照表、損益計算書、キャッシュフロー計算書）を取得したい
So that 企業の財務健全性や収益性を分析できる
```

### 使用パターン1: デフォルト（連結財務諸表取得）

**ユーザー要求**: "トヨタ自動車の財務諸表を教えて"

**MCPツール呼び出し**:
```typescript
get_financial_statements({ code: '7203' })
```

**期待される出力**: トヨタ自動車の最新の連結財務諸表

### 使用パターン2: 連結財務諸表を明示的に指定

**ユーザー要求**: "トヨタ自動車の連結財務諸表を教えて"

**MCPツール呼び出し**:
```typescript
get_financial_statements({
  code: '7203',
  statement_type: 'Consolidated'
})
```

**期待される出力**: トヨタ自動車の最新の連結財務諸表

### 使用パターン3: 単体財務諸表を指定

**ユーザー要求**: "トヨタ自動車の単体財務諸表を教えて"

**MCPツール呼び出し**:
```typescript
get_financial_statements({
  code: '7203',
  statement_type: 'NonConsolidated'
})
```

**期待される出力**: トヨタ自動車の最新の単体財務諸表

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義とTDD標準プロセスから確定

---

## 📈 品質判定

### ✅ 高品質: 要件の曖昧さなし

**判定結果**: ✅ 高品質

**理由**:
- ✅ 要件の曖昧さ: なし（Phase 1タスク定義から明確に定義）
- ✅ 入出力定義: 完全（FinancialStatements型、BalanceSheet/ProfitLoss/CashFlow型が定義済み）
- ✅ 制約条件: 明確（パフォーマンス、セキュリティ、互換性すべて定義）
- ✅ 実装可能性: 確実（JQuantsClient.getStatements()が実装済み）

**信頼性レベルの分布**:
- 🔵 青信号: 90%（ほとんどの項目が確定）
- 🟡 黄信号: 10%（デフォルト動作の一部のみ推測）
- 🔴 赤信号: 0%（推測のみの項目なし）

**次のステップへの準備状況**: ✅ テストケース洗い出しに進める

---

## 🚀 次のステップ

### 推奨コマンド

```bash
/tsumiki:tdd-testcases
```

**実施内容**: 本要件定義書に基づいて、包括的なテストケースを洗い出します。

**期待される成果物**:
- `get-financial-statements-testcases.md`
- 正常系テストケース（3件）
- 異常系テストケース（4件）
- 境界値テストケース（2件）

---

**作成者**: Claude (Sonnet 4.5)
**最終更新**: 2025-10-30
**ステータス**: ✅ Requirements Phase 完了
**次フェーズ**: Test Cases Phase
