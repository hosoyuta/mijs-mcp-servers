# TASK-0009: get_company_info - 要件定義書

**タスクID**: TASK-0009
**タスク名**: MCPツール4: get_company_info（Company Info Tool）
**関連要件**: REQ-401, REQ-402, REQ-701
**依存タスク**: TASK-0004, TASK-0005, TASK-0007
**作成日**: 2025-10-30
**作成者**: Claude (Sonnet 4.5)

---

## 📋 概要

### 目的

指定銘柄の企業詳細情報（銘柄名、市場区分、業種コード）と最新株価を統合して取得するMCPツールを実装する。

### スコープ

**実装範囲**:
- 銘柄コードによる企業情報取得
- 最新株価の取得
- 企業情報と株価データの統合
- パラメータバリデーション

**実装範囲外**:
- 複数銘柄の一括取得
- 過去の株価履歴
- 財務データの統合

---

## 🎯 機能要件

### REQ-FUNC-001: 基本的な企業情報取得

**説明**: 指定した銘柄コードの企業情報（名称、市場区分、業種）を取得できる

**受け入れ基準**:
- WHEN ユーザーが銘柄コード（4桁数字）を指定して実行する
- THEN システムはJ-Quants API（GET /listed/info）から企業情報を取得する
- AND 取得したデータには銘柄名、市場区分、業種コードが含まれる

**優先度**: 🔴 高（必須機能）

**関連要件**: REQ-401

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義（j-quants-phase1.md Day 9: TASK-0009）から抽出、CompanyInfo型定義（src/types/index.ts:154-169）から確定

---

### REQ-FUNC-002: 最新株価の取得

**説明**: 指定した銘柄コードの最新の株価データを取得できる

**受け入れ基準**:
- WHEN ユーザーが銘柄コードを指定して実行する
- THEN システムはJ-Quants API（GET /prices/daily_quotes）から株価データを取得する
- AND 取得したデータの中から最新（日付が最も新しい）の株価を選択する

**優先度**: 🔴 高（必須機能）

**関連要件**: REQ-402

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のTASK-0009処理フローから確定、既存TASK-0007実装パターンから確定

---

### REQ-FUNC-003: データの統合

**説明**: 企業情報と最新株価を統合したデータを返却できる

**受け入れ基準**:
- WHEN 企業情報と株価データの両方を取得完了する
- THEN システムは2つのデータを統合してCompanyInfo形式で返却する
- AND 返却データには code, name, market, sector, latest_price, latest_date が含まれる

**優先度**: 🔴 高（必須機能）

**関連要件**: REQ-401, REQ-402

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: CompanyInfo型定義（src/types/index.ts:154-169）から確定

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
**【根拠】**: Phase 1タスク定義のTASK-0009テストケース1から確定、既存実装パターン（TASK-0006, 0007, 0008）から確定

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
**【根拠】**: 既存のvalidator.ts実装と Phase 1タスク定義のTASK-0009テストケース3から確定

---

## 📊 入出力仕様

### 入力パラメータ

```typescript
interface GetCompanyInfoParams {
  code: string;  // 必須: 銘柄コード（4桁数字）
}
```

#### パラメータ詳細

| パラメータ | 型 | 必須 | 説明 | 例 |
|-----------|---|------|------|-----|
| code | string | ✅ 必須 | 銘柄コード（4桁数字） | "7203", "9984" |

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のTASK-0009入力パラメータから確定

---

### 出力形式

```typescript
interface GetCompanyInfoResult {
  code: string;          // 銘柄コード
  name: string;          // 銘柄名
  market: string;        // 市場区分
  sector: string;        // 業種コード
  latest_price: number;  // 最新株価
  latest_date: string;   // 最新株価の日付（YYYY-MM-DD）
}
```

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: CompanyInfo型定義（src/types/index.ts:154-169）とPhase 1タスク定義から確定

#### 出力例

```json
{
  "code": "7203",
  "name": "トヨタ自動車",
  "market": "TSE",
  "sector": "0050",
  "latest_price": 3050.0,
  "latest_date": "2025-10-29"
}
```

---

## ⚠️ エラーハンドリング

### エラー種別

| エラータイプ | 発生条件 | エラーメッセージ | ステータス |
|------------|---------|----------------|-----------|
| ValidationError | code 未指定 | 必須パラメータ code が指定されていません | - |
| ValidationError | code が4桁数字でない | 銘柄コードは4桁の数字である必要があります | - |
| Error | 存在しない銘柄コード | 指定された銘柄コード（XXXX）は存在しません | - |
| Error | 株価データが存在しない | 株価データが利用できません | - |
| Error | API通信エラー | J-Quants APIへの接続に失敗しました | - |

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のTASK-0009エラーハンドリングから確定、既存実装パターンから確定

---

## 🔄 処理フロー

```
1. 入力パラメータ受け取り
   ↓
2. バリデーション
   ├─ code 必須チェック（REQ-VAL-001）
   └─ code 形式チェック（REQ-VAL-002）
   ↓
3. JQuantsClient 初期化
   ↓
4. 企業情報取得
   ├─ J-Quants API 呼び出し（getListedInfo）
   ├─ パラメータ: { code }
   └─ エンドポイント: GET /listed/info
   ↓
5. 銘柄コードで企業情報をフィルタリング
   ↓
6. 株価データ取得
   ├─ J-Quants API 呼び出し（getDailyQuotes）
   ├─ パラメータ: { code }
   └─ エンドポイント: GET /prices/daily_quotes
   ↓
7. 最新株価を抽出（日付降順で先頭）
   ↓
8. データマージ
   ├─ 企業情報（code, name, market, sector）
   └─ 最新株価（latest_price, latest_date）
   ↓
9. 結果返却 { code, name, market, sector, latest_price, latest_date }
```

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義の処理フローとTASK-0006, TASK-0007実装パターンから確定

---

## 📐 制約事項

### 技術的制約

1. **TypeScript strict mode 準拠**: すべてのコードは strict mode でエラーなしでコンパイル可能
2. **J-Quants API 依存**: J-Quants API の可用性に依存する
3. **銘柄コード形式固定**: 4桁数字のみサポート
4. **最新株価のみ**: 過去の株価履歴は取得しない

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1技術要件とTASK-0002型定義から確定

### ビジネス制約

1. **データ取得範囲**: J-Quants API で提供される最新データのみ
2. **認証必須**: J-Quants API のリフレッシュトークンが必要
3. **レート制限**: J-Quants API のレート制限に従う
4. **データ更新頻度**: 日次（J-Quants APIの仕様）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: J-Quants API仕様とPhase 1タスク定義から確定

---

## 🧪 境界値・エッジケース

### 境界値

| ケース | 入力 | 期待される動作 |
|--------|------|---------------|
| 最小の銘柄コード | code: "0001" | 正常に処理される |
| 最大の銘柄コード | code: "9999" | 正常に処理される |

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義から確定

### エッジケース

| ケース | 入力 | 期待される動作 |
|--------|------|---------------|
| code が3桁 | code: "123" | ValidationError スロー |
| code が5桁 | code: "12345" | ValidationError スロー |
| code がアルファベット | code: "ABCD" | ValidationError スロー |
| 存在しない銘柄コード | code: "9999" | Error スロー |
| 株価データなし | code: "8000" | Error スロー または latest_price なしで返却 |
| API エラー | J-Quants API がエラーを返す | Error スロー |

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のTASK-0009テストケースから確定

---

## 🎯 テスト要件サマリー

### テストケース総数

**合計**: 7件（想定）
- 正常系: 2件
- 異常系: 3件
- 境界値: 2件

### 正常系テストケース

1. **TC-NORMAL-001**: code 指定で企業情報と最新株価を取得
2. **TC-NORMAL-002**: latest_price が最新の日付であることを確認

### 異常系テストケース

3. **TC-ERROR-001**: code パラメータ未指定
4. **TC-ERROR-002**: 不正な code 値（3桁、5桁、アルファベット）
5. **TC-ERROR-003**: 存在しない銘柄コード

### 境界値テストケース

6. **TC-BOUNDARY-001**: 株価データが存在しない企業
7. **TC-BOUNDARY-002**: データ構造確認（code, name, market, sector, latest_price, latest_date すべて含む）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のTASK-0009テストケース詳細から確定

---

## 🔗 データフロー

### システム内での位置づけ

```
[Claude Desktop]
      ↓
[MCP Server (src/index.ts)]
      ↓
[get_company_info Tool (src/tools/get-company-info.ts)]
      ↓
[JQuantsClient (src/api/j-quants-client.ts)]
      ├─ getListedInfo() → GET /listed/info
      └─ getDailyQuotes() → GET /prices/daily_quotes
```

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のアーキテクチャと既存実装から確定

### 依存関係

**依存タスク**:
- **TASK-0004**: JQuantsClient（`getListedInfo()`, `getDailyQuotes()` メソッド使用）
- **TASK-0005**: エラーハンドリング（`validator.ts`, `error-handler.ts`）
- **TASK-0002**: 型定義（`CompanyInfo`, `Company`, `StockPrice`）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義の依存タスクから確定

---

## 📚 参考情報

### 関連型定義

- `CompanyInfo` インターフェース: `src/types/index.ts:154-169`
- `Company` インターフェース: `src/types/index.ts:22-35`
- `StockPrice` インターフェース: `src/types/index.ts:42-59`
- `Market` enum: `src/types/index.ts`
- `Sector` enum: `src/types/index.ts`

### 関連API

- **J-Quants API エンドポイント1**: `GET /listed/info`
- **J-Quants API エンドポイント2**: `GET /prices/daily_quotes`
- **JQuantsClient メソッド1**: `getListedInfo()` - `src/api/j-quants-client.ts`
- **JQuantsClient メソッド2**: `getDailyQuotes(code: string)` - `src/api/j-quants-client.ts`

### 参考実装

- **TASK-0006**: `get_listed_companies` 実装パターンを参考
  - バリデーション: `validateRequiredParam()`, `validateCode()` 使用
  - APIクライアント初期化: TokenManager + JQuantsClient
  - エラーハンドリング: 統一されたエラーレスポンス形式

- **TASK-0007**: `get_stock_price` 実装パターンを参考
  - 必須パラメータバリデーション
  - 日付降順ソート
  - 最新データ抽出

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: 実装済みモジュールの確認から確定

---

## ✅ 完了基準

### 実装完了基準

- [ ] `src/tools/get-company-info.ts` が実装されている
- [ ] すべての機能要件（REQ-FUNC-001～003）が実装されている
- [ ] すべてのバリデーション要件（REQ-VAL-001～002）が実装されている
- [ ] TypeScript strict mode でエラーがない
- [ ] ESLint エラーがない

### テスト完了基準

- [ ] `tests/tools/get-company-info.test.ts` が実装されている
- [ ] 全テストケース（7件）が実装されている
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
As a 投資家
I want 企業の基本情報と最新株価を一度に取得したい
So that 投資判断を効率的に行える
```

### 使用パターン: 基本的な企業情報取得

**ユーザー要求**: "トヨタ自動車の情報を教えて"

**MCPツール呼び出し**:
```typescript
get_company_info({ code: '7203' })
```

**期待される出力**: トヨタ自動車の企業情報と最新株価

```json
{
  "code": "7203",
  "name": "トヨタ自動車",
  "market": "TSE",
  "sector": "0050",
  "latest_price": 3050.0,
  "latest_date": "2025-10-29"
}
```

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義とTDD標準プロセスから確定

---

## 📈 品質判定

### ✅ 高品質: 要件の曖昧さなし

**判定結果**: ✅ 高品質

**理由**:
- ✅ 要件の曖昧さ: なし（Phase 1タスク定義から明確に定義）
- ✅ 入出力定義: 完全（CompanyInfo型、既存API実装が定義済み）
- ✅ 制約条件: 明確（パフォーマンス、セキュリティ、互換性すべて定義）
- ✅ 実装可能性: 確実（JQuantsClient.getListedInfo(), getDailyQuotes()が実装済み）

**信頼性レベルの分布**:
- 🔵 青信号: 100%（すべての項目が確定）
- 🟡 黄信号: 0%
- 🔴 赤信号: 0%

**次のステップへの準備状況**: ✅ テストケース洗い出しに進める

---

## 🚀 次のステップ

### 推奨コマンド

```bash
/tsumiki:tdd-testcases
```

**実施内容**: 本要件定義書に基づいて、包括的なテストケースを洗い出します。

**期待される成果物**:
- `get-company-info-testcases.md`
- 正常系テストケース（2件）
- 異常系テストケース（3件）
- 境界値テストケース（2件）

---

**作成者**: Claude (Sonnet 4.5)
**最終更新**: 2025-10-30
**ステータス**: ✅ Requirements Phase 完了
**次フェーズ**: Test Cases Phase
