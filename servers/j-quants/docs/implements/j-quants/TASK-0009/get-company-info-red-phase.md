# TASK-0009: get_company_info - Red Phase レポート

**タスクID**: TASK-0009
**タスク名**: MCPツール4: get_company_info（Company Info Tool）
**フェーズ**: Red Phase（失敗するテスト作成）
**作成日**: 2025-10-30
**作成者**: Claude (Sonnet 4.5)

---

## 📋 概要

TDD Red Phaseとして、get_company_info機能の7件のテストケースを実装しました。すべてのテストは実装ファイルが存在しないため、期待通りに失敗します。

---

## 🎯 実装したテストケース

### 正常系テストケース（2件）

#### TC-NORMAL-001: code指定で企業情報と最新株価を取得
- **目的**: 銘柄コード指定で企業情報と最新株価を統合して取得できること
- **入力**: `{ code: '7203' }`
- **期待**: CompanyInfo形式で企業情報（code, name, market, sector）と最新株価（latest_price）が返却される
- **検証項目**:
  - すべてのプロパティが存在すること
  - JQuantsClient.getListedInfo()が1回呼ばれること
  - JQuantsClient.getDailyQuotes()が1回呼ばれること

#### TC-NORMAL-002: 最新株価の日付検証
- **目的**: 複数日の株価データから最新日のデータが正しく抽出されること
- **入力**: `{ code: '7203' }` + 複数日の株価データ（順不同）
- **期待**: 最新日（2025-10-29）のclose値（3050）がlatest_priceに設定される
- **検証項目**:
  - latest_priceが最新日のclose値であること
  - 古い日付のデータが使われていないこと

---

### 異常系テストケース（3件）

#### TC-ERROR-001: codeパラメータ未指定
- **目的**: 必須パラメータcode未指定時にValidationErrorがスローされること
- **入力**: `{}`
- **期待**: `ValidationError: 必須パラメータ code が指定されていません`
- **検証項目**:
  - ValidationErrorがスローされること
  - エラーメッセージが正しいこと

#### TC-ERROR-002: 不正なcode値
- **目的**: 4桁数字以外のcode指定時にValidationErrorがスローされること
- **入力**: `{ code: '123' }`, `{ code: '12345' }`, `{ code: 'ABCD' }`
- **期待**: `ValidationError: 銘柄コードは4桁の数字である必要があります`
- **検証項目**:
  - すべての不正形式でValidationErrorがスローされること
  - エラーメッセージが正しいこと

#### TC-ERROR-003: 存在しない銘柄コード
- **目的**: 実在しない銘柄コード指定時にErrorがスローされること
- **入力**: `{ code: '9999' }` + getListedInfo()が空配列を返す
- **期待**: `Error: 指定された銘柄コード...`
- **検証項目**:
  - Errorがスローされること
  - エラーメッセージに銘柄コードが含まれること

---

### 境界値テストケース（2件）

#### TC-BOUNDARY-001: 株価データが存在しない企業
- **目的**: 企業情報は存在するが株価データが存在しない場合の処理確認
- **入力**: `{ code: '8000' }` + getDailyQuotes()が空配列を返す
- **期待**: 企業情報は返却され、latest_priceはundefined
- **検証項目**:
  - 企業情報（code, name, market, sector）が正しく返却されること
  - latest_priceがundefinedであること

#### TC-BOUNDARY-002: データ構造の完全性確認
- **目的**: CompanyInfoインターフェースの全プロパティが存在することを確認
- **入力**: `{ code: '7203' }`
- **期待**: すべてのプロパティ（code, name, market, sector, latest_price）が存在
- **検証項目**:
  - 全プロパティが存在すること
  - 各プロパティの型が正しいこと

---

## 📝 テストコードの特徴

### Given-When-Then形式
すべてのテストケースでGiven-When-Then形式を採用：
- **Given**: モックデータの準備、初期条件設定
- **When**: getCompanyInfo()の実行
- **Then**: 結果の検証、期待値確認

### 詳細な日本語コメント
各テストに以下のコメントを付与：
- 【テスト目的】: テストの目的を明確化
- 【テスト内容】: 具体的なテスト内容
- 【期待される動作】: 期待される結果
- 【テストデータ準備】: なぜこのデータを用意するかの理由
- 【結果検証】: 何を検証するかの説明
- 🔵 信頼性レベル: すべて青信号（要件定義書から確定）

### モック戦略
以下をモック化：
- **TokenManager.prototype.getIdToken**: 認証トークン取得をモック
- **JQuantsClient.prototype.getListedInfo**: 企業情報取得をモック
- **JQuantsClient.prototype.getDailyQuotes**: 株価データ取得をモック

---

## 🧪 テスト実行結果

### 実行コマンド
```bash
npm test -- tests/tools/get-company-info.test.ts
```

### 期待される失敗
```
Error: Failed to load url ../../src/tools/get-company-info (resolved id: ../../src/tools/get-company-info) in C:/workspace/mijs-mcp-servers/servers/j-quants/tests/tools/get-company-info.test.ts. Does the file exist?
```

### 失敗理由
✅ **期待通りの失敗**: 実装ファイル `src/tools/get-company-info.ts` が存在しないため、テストがロードできない

これはTDD Red Phaseの目的であり、正しい動作です。

---

## 📊 品質メトリクス

### テストカバレッジ

| 要件ID | 要件名 | テストケース | 実装状況 |
|--------|--------|------------|---------|
| REQ-FUNC-001 | 基本的な企業情報取得 | TC-NORMAL-001, TC-BOUNDARY-002 | ✅ 実装済み |
| REQ-FUNC-002 | 最新株価の取得 | TC-NORMAL-001, TC-NORMAL-002, TC-BOUNDARY-001 | ✅ 実装済み |
| REQ-FUNC-003 | データの統合 | TC-NORMAL-001, TC-BOUNDARY-002 | ✅ 実装済み |
| REQ-VAL-001 | 必須パラメータ検証（code） | TC-ERROR-001 | ✅ 実装済み |
| REQ-VAL-002 | 銘柄コード形式検証 | TC-ERROR-002 | ✅ 実装済み |
| - | 存在しない銘柄コード | TC-ERROR-003 | ✅ 実装済み |
| - | 株価データが存在しない | TC-BOUNDARY-001 | ✅ 実装済み |

**全体カバレッジ**: 100%（5要件 + 2境界条件 = 7項目すべてカバー）

### コード品質

- **テストファイル**: `tests/tools/get-company-info.test.ts`
- **テスト件数**: 7件
- **総行数**: 448行
- **コメント密度**: 高（Given-When-Then形式、日本語コメント付き）
- **TypeScript strict mode**: 準拠
- **ESLint**: エラーなし
- **信頼性レベル**: 🔵 青信号 100%

---

## 🚀 次のフェーズへの要求事項

### Green Phase（最小実装）で実装すべき内容

#### 1. 実装ファイルの作成
- **ファイル**: `src/tools/get-company-info.ts`
- **エクスポート**: `getCompanyInfo` 関数

#### 2. 機能要件の実装

**REQ-FUNC-001: 基本的な企業情報取得**
```typescript
// JQuantsClient.getListedInfo()で企業情報を取得
const companies = await client.getListedInfo();
// 指定codeで企業情報をフィルタリング
const company = companies.find(c => c.code === code);
```

**REQ-FUNC-002: 最新株価の取得**
```typescript
// JQuantsClient.getDailyQuotes()で株価データを取得
const prices = await client.getDailyQuotes(code);
// 日付降順でソート
const sortedPrices = prices.sort((a, b) => b.date.localeCompare(a.date));
// 最新（先頭）のclose値を取得
const latest_price = sortedPrices[0]?.close;
```

**REQ-FUNC-003: データの統合**
```typescript
// CompanyInfo形式で返却
return {
  code: company.code,
  name: company.name,
  market: company.market,
  sector: company.sector,
  latest_price: latest_price,
};
```

#### 3. バリデーション要件の実装

**REQ-VAL-001: 必須パラメータ検証**
```typescript
validateRequiredParam(params.code, 'code');
```

**REQ-VAL-002: 銘柄コード形式検証**
```typescript
const code = params.code as string;
validateCode(code);
```

#### 4. エラーハンドリング

**存在しない銘柄コード**
```typescript
if (!company) {
  throw new Error(`指定された銘柄コード（${code}）は存在しません`);
}
```

**株価データなし**
```typescript
// latest_priceをundefinedにする（CompanyInfo型定義のオプショナル）
```

#### 5. 依存モジュール
- `TokenManager` (from '../auth/token-manager')
- `JQuantsClient` (from '../api/j-quants-client')
- `validateRequiredParam`, `validateCode` (from '../utils/validator')
- `CompanyInfo` type (from '../types')

---

## ✅ 品質判定

### 判定結果: ✅ 高品質

**判定基準に対する評価**:

1. **テスト実行**: ✅ 成功（失敗することを確認）
   - 実装ファイル不在により期待通りに失敗

2. **期待値**: ✅ 明確で具体的
   - すべてのテストケースで入力値と期待される結果が明確に定義
   - エラーケースのエラーメッセージも具体的

3. **アサーション**: ✅ 適切
   - Given-When-Then形式で構造化
   - 各expectステートメントに日本語コメント付き

4. **実装方針**: ✅ 明確
   - Green Phaseで実装すべき内容が明確に定義
   - 既存パターン（TASK-0006, 0007, 0008）を踏襲

**信頼性レベルの分布**:
- 🔵 青信号: 100%（すべてのテストケースが要件定義書から確定）
- 🟡 黄信号: 0%
- 🔴 赤信号: 0%

---

## 🚀 次のステップ

### 推奨コマンド

```bash
/tsumiki:tdd-green
```

**実施内容**: 本Red Phaseレポートに基づいて、テストを通すための最小限の実装を行います（TDD Green Phase）。

**期待される成果物**:
- `src/tools/get-company-info.ts` (実装ファイル)
- 全7件のテストが成功する状態
- Green Phase レポート

---

**作成者**: Claude (Sonnet 4.5)
**最終更新**: 2025-10-30
**ステータス**: ✅ Red Phase 完了
**次フェーズ**: Green Phase（最小実装）
