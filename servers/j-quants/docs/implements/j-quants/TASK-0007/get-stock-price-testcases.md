# TASK-0007: get_stock_price MCPツール - テストケース定義書

**タスクID**: TASK-0007
**タスク名**: MCPツール2: get_stock_price（Stock Price Tool）
**種別**: TDD - Test Cases Phase
**作成日**: 2025-10-30
**参照**: get-stock-price-requirements.md

---

## 開発言語・テストフレームワーク

### 🔵 プログラミング言語

**言語**: TypeScript 5.x

**言語選択の理由**:
- 型安全性によるバグの早期発見
- 既存コードベース（TASK-0002～0006）との一貫性
- MCPツールの標準実装言語

**テストに適した機能**:
- 型推論によるテストコードの補完
- インターフェース定義によるモックの容易性
- strictモードによる堅牢なテストコード

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義（REQ-1001 TypeScript strict mode）から確定

### 🔵 テストフレームワーク

**フレームワーク**: Vitest 2.1.4

**フレームワーク選択の理由**:
- TypeScriptのネイティブサポート
- 高速な実行速度
- Jestライクな使いやすいAPI
- 既存テスト（TASK-0003～0006）との一貫性

**テスト実行環境**:
- Node.js 20 LTS
- Windows/Unix両対応
- CI/CDパイプラインでの自動実行を想定

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: 既存のテストファイル（get-listed-companies.test.ts等）で使用中

---

## テストケース一覧

### 正常系テストケース: 4件
### 異常系テストケース: 4件
### 境界値テストケース: 1件
**合計**: 9件

---

## 1. 正常系テストケース（4件）

### TC-NORMAL-001: codeのみ指定 - 全期間データ取得（日付降順確認）🔵

**テスト名**: getStockPrice() - codeのみ指定（全期間データ取得、日付降順）
- **何をテストするか**: 銘柄コードのみを指定した場合に全期間の株価データが日付降順で取得できること
- **期待される動作**: JQuantsClient.getDailyQuotes()が呼ばれ、全期間のデータが日付降順でソートされて返却される

**入力値**:
```typescript
params: { code: '7203' }
```
- **入力データの意味**: トヨタ自動車（7203）の全期間株価データを取得
- **実際の使用場面**: 「7203の株価を教えて」というユーザー要求

**期待される結果**:
```typescript
{
  code: '7203',
  prices: [
    { code: '7203', date: '2025-10-29', open: 3000, high: 3100, low: 2950, close: 3050, volume: 1000000 },
    { code: '7203', date: '2025-10-28', open: 2950, high: 3020, low: 2900, close: 3000, volume: 950000 },
    { code: '7203', date: '2025-10-27', open: 2900, high: 2980, low: 2850, close: 2950, volume: 900000 },
    // ... 日付降順（新しい順）
  ]
}
```
- **期待結果の理由**: APIから取得したデータを日付降順でソートして返却
- **日付降順確認**: prices[0].date >= prices[1].date >= prices[2].date ...

**テストの目的**: 基本機能（全期間取得、日付降順ソート）の確認
- **確認ポイント**:
  - code プロパティが入力値と一致する
  - prices配列が存在する
  - prices配列に複数の株価データが含まれる
  - prices[0].date >= prices[1].date >= ... の日付降順である
  - 各pricesオブジェクトがStockPrice型の構造を持つ（code, date, open, high, low, close, volume）
  - JQuantsClient.getDailyQuotes()が code='7203' で1回呼ばれる

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース2から確定、REQ-FUNC-001, REQ-FUNC-005に対応

---

### TC-NORMAL-002: code + from_date - 開始日以降のデータ取得🔵

**テスト名**: getStockPrice() - code + from_date（開始日フィルタ）
- **何をテストするか**: from_date を指定した場合、指定日以降のデータのみが返却されること
- **期待される動作**: 全期間データ取得後、from_date <= date の条件でフィルタリングされる

**入力値**:
```typescript
params: {
  code: '7203',
  from_date: '2025-10-01'
}
```
- **入力データの意味**: トヨタ自動車の2025年10月1日以降のデータを取得
- **実際の使用場面**: 「7203の10月以降の株価を教えて」というユーザー要求

**期待される結果**:
```typescript
{
  code: '7203',
  prices: [
    { code: '7203', date: '2025-10-29', ... },
    { code: '7203', date: '2025-10-28', ... },
    // ... 2025-10-01以降のデータのみ（日付降順）
  ]
}
```
- **期待結果の理由**: date >= '2025-10-01' の条件でフィルタリング
- **除外データ**: 2025-09-30以前のデータは含まれない

**テストの目的**: from_date フィルタリング機能の確認
- **確認ポイント**:
  - すべての prices[i].date >= '2025-10-01' である
  - 2025-09-30以前のデータが含まれていない
  - 日付降順が維持されている
  - フィルタ前の件数 > フィルタ後の件数

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース3から確定、REQ-FUNC-002に対応

---

### TC-NORMAL-003: code + to_date - 終了日以前のデータ取得🔵

**テスト名**: getStockPrice() - code + to_date（終了日フィルタ）
- **何をテストするか**: to_date を指定した場合、指定日以前のデータのみが返却されること
- **期待される動作**: 全期間データ取得後、date <= to_date の条件でフィルタリングされる

**入力値**:
```typescript
params: {
  code: '7203',
  to_date: '2025-10-31'
}
```
- **入力データの意味**: トヨタ自動車の2025年10月31日以前のデータを取得
- **実際の使用場面**: 「7203の10月末までの株価を教えて」というユーザー要求

**期待される結果**:
```typescript
{
  code: '7203',
  prices: [
    { code: '7203', date: '2025-10-31', ... },
    { code: '7203', date: '2025-10-30', ... },
    { code: '7203', date: '2025-10-29', ... },
    // ... 2025-10-31以前のデータのみ（日付降順）
  ]
}
```
- **期待結果の理由**: date <= '2025-10-31' の条件でフィルタリング
- **除外データ**: 2025-11-01以降のデータは含まれない

**テストの目的**: to_date フィルタリング機能の確認
- **確認ポイント**:
  - すべての prices[i].date <= '2025-10-31' である
  - 2025-11-01以降のデータが含まれていない
  - 日付降順が維持されている
  - フィルタ前の件数 > フィルタ後の件数

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース4から確定、REQ-FUNC-003に対応

---

### TC-NORMAL-004: code + from_date + to_date - 日付範囲フィルタ🔵

**テスト名**: getStockPrice() - code + from_date + to_date（日付範囲フィルタ）
- **何をテストするか**: from_date と to_date を両方指定した場合、指定範囲内のデータのみが返却されること
- **期待される動作**: 全期間データ取得後、from_date <= date <= to_date の条件でフィルタリングされる

**入力値**:
```typescript
params: {
  code: '7203',
  from_date: '2025-10-01',
  to_date: '2025-10-31'
}
```
- **入力データの意味**: トヨタ自動車の2025年10月のデータのみを取得
- **実際の使用場面**: 「7203の10月の株価を教えて」というユーザー要求

**期待される結果**:
```typescript
{
  code: '7203',
  prices: [
    { code: '7203', date: '2025-10-31', ... },
    { code: '7203', date: '2025-10-30', ... },
    // ... 2025-10-01～2025-10-31のデータのみ（日付降順）
    { code: '7203', date: '2025-10-01', ... },
  ]
}
```
- **期待結果の理由**: from_date <= date <= to_date の条件でフィルタリング
- **除外データ**: 2025-09-30以前、2025-11-01以降のデータは含まれない

**テストの目的**: 日付範囲フィルタリング（AND条件）の確認
- **確認ポイント**:
  - すべての prices[i].date >= '2025-10-01' である
  - すべての prices[i].date <= '2025-10-31' である
  - 範囲外のデータが含まれていない
  - 日付降順が維持されている
  - from_date単独フィルタ > from_date+to_date複合フィルタの件数

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース5から確定、REQ-FUNC-004に対応

---

## 2. 異常系テストケース（4件）

### TC-ERROR-001: codeパラメータ未指定🔵

**テスト名**: getStockPrice() - codeパラメータ未指定（ValidationError）
- **エラーケースの概要**: 必須パラメータ code が指定されていない場合のエラーハンドリング
- **エラー処理の重要性**: 必須パラメータの不足を早期に検出し、わかりやすいエラーメッセージを返す

**入力値**:
```typescript
params: {}
```
- **不正な理由**: code は必須パラメータだが、指定されていない
- **実際の発生シナリオ**: ユーザーが銘柄コードを指定せずにツールを実行した場合

**期待される結果**:
```typescript
ValidationError がスローされる
エラーメッセージ: "必須パラメータ code が指定されていません"
```
- **エラーメッセージの内容**: どのパラメータが必須であるかを明示
- **システムの安全性**: 不正な状態でAPIを呼ばずにバリデーションで弾く

**テストの目的**: 必須パラメータのバリデーション確認
- **確認ポイント**:
  - ValidationError がスローされる
  - エラーメッセージに 'code' が含まれる
  - エラーメッセージに '必須' が含まれる
  - JQuantsClient.getDailyQuotes()が呼ばれない（バリデーションで事前に弾かれる）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース1、REQ-VAL-001から確定

---

### TC-ERROR-002: 不正なcode値🔵

**テスト名**: getStockPrice() - 不正なcode値（ValidationError）
- **エラーケースの概要**: 4桁数字以外の code を指定した場合のエラーハンドリング
- **エラー処理の重要性**: 不正なフォーマットの銘柄コードで無駄なAPI呼び出しを防ぐ

**入力値**:
```typescript
// ケース1: 3桁
params: { code: '123' }

// ケース2: 5桁
params: { code: '12345' }

// ケース3: アルファベット
params: { code: 'ABCD' }
```
- **不正な理由**: code は4桁の数字でなければならない
- **実際の発生シナリオ**: ユーザーが誤った形式の銘柄コードを入力した場合

**期待される結果**:
```typescript
ValidationError がスローされる
エラーメッセージ: "code は4桁の数字である必要があります"
```
- **エラーメッセージの内容**: 正しいフォーマット（4桁数字）を示唆
- **システムの安全性**: 不正なフォーマットでのAPI呼び出しを防ぐ

**テストの目的**: code パラメータの形式バリデーション確認
- **確認ポイント**:
  - ValidationError がスローされる
  - エラーメッセージに 'code' と '4桁' が含まれる
  - 3桁、5桁、アルファベットのすべてのケースでエラーになる
  - JQuantsClient.getDailyQuotes()が呼ばれない

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース6、REQ-VAL-002から確定

---

### TC-ERROR-003: 不正な日付形式🔵

**テスト名**: getStockPrice() - 不正な日付形式（ValidationError）
- **エラーケースの概要**: YYYY-MM-DD 形式以外の日付を指定した場合のエラーハンドリング
- **エラー処理の重要性**: 不正な日付形式でフィルタリングエラーを防ぐ

**入力値**:
```typescript
// ケース1: スラッシュ区切り
params: { code: '7203', from_date: '2025/10/01' }

// ケース2: 短縮形式
params: { code: '7203', from_date: '2025-1-1' }

// ケース3: 存在しない日付
params: { code: '7203', from_date: '2025-13-01' }
```
- **不正な理由**: 日付は YYYY-MM-DD 形式でなければならない
- **実際の発生シナリオ**: ユーザーが異なる日付フォーマットで入力した場合

**期待される結果**:
```typescript
ValidationError がスローされる
エラーメッセージ: "日付は YYYY-MM-DD 形式で指定してください"
```
- **エラーメッセージの内容**: 正しい日付形式（YYYY-MM-DD）を明示
- **システムの安全性**: 不正な日付でのフィルタリングを防ぐ

**テストの目的**: 日付形式バリデーション確認
- **確認ポイント**:
  - ValidationError がスローされる
  - エラーメッセージに 'YYYY-MM-DD' が含まれる
  - from_date, to_date の両方で検証される
  - JQuantsClient.getDailyQuotes()が呼ばれない

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース7、REQ-VAL-003から確定

---

### TC-ERROR-004: from_date > to_date🔵

**テスト名**: getStockPrice() - from_date > to_date（ValidationError）
- **エラーケースの概要**: from_date が to_date より後の日付の場合のエラーハンドリング
- **エラー処理の重要性**: 論理的に矛盾する日付範囲を早期に検出

**入力値**:
```typescript
params: {
  code: '7203',
  from_date: '2025-12-31',
  to_date: '2025-01-01'
}
```
- **不正な理由**: from_date は to_date 以前でなければならない
- **実際の発生シナリオ**: ユーザーが日付の順序を誤って入力した場合

**期待される結果**:
```typescript
ValidationError がスローされる
エラーメッセージ: "from_date は to_date 以前である必要があります"
```
- **エラーメッセージの内容**: 日付範囲の論理的矛盾を明示
- **システムの安全性**: 無効な範囲でのフィルタリングを防ぐ

**テストの目的**: 日付範囲の妥当性バリデーション確認
- **確認ポイント**:
  - ValidationError がスローされる
  - エラーメッセージに 'from_date' と 'to_date' が含まれる
  - エラーメッセージに '以前' または '<=', が含まれる
  - JQuantsClient.getDailyQuotes()が呼ばれない

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース8、REQ-VAL-004から確定

---

## 3. 境界値テストケース（1件）

### TC-BOUNDARY-001: 存在しない銘柄コード - 空配列返却🔵

**テスト名**: getStockPrice() - 存在しない銘柄コード（空配列返却）
- **境界値の意味**: 指定した銘柄コードのデータが1件も存在しない場合
- **境界値での動作保証**: 空配列を返却し、エラーにならないこと

**入力値**:
```typescript
params: { code: '9999' }
```
- **境界値選択の根拠**: '9999'は通常存在しない銘柄コード
- **実際の使用場面**: ユーザーが上場廃止銘柄や存在しない銘柄コードを指定した場合

**期待される結果**:
```typescript
{
  code: '9999',
  prices: []
}
```
- **境界での正確性**: エラーではなく空配列を返却
- **一貫した動作**: 0件でも { code, prices } の構造は維持される

**テストの目的**: 存在しない銘柄コードの適切な処理確認
- **確認ポイント**:
  - エラーがスローされない
  - code プロパティが '9999' である
  - prices配列が空配列 `[]` である
  - prices配列の型が正しい（StockPrice[]）
  - JQuantsClient.getDailyQuotes()は正常に呼ばれている（API側で空を返す）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース9から確定

---

## テストケース実装時の日本語コメント指針

### テストファイル構造

```typescript
/**
 * TASK-0007: get_stock_price MCPツール テストケース
 *
 * 【テストフェーズ】: TDD Red Phase（失敗するテストを作成）
 * 【作成日】: 2025-10-30
 * 【テストフレームワーク】: Vitest 2.1.4
 * 【言語】: TypeScript 5.x
 * 【目的】: get_stock_priceツールのテスト実装
 * 【対応要件】: REQ-201, REQ-202, REQ-203, REQ-503, REQ-504, REQ-701
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStockPrice } from '../../src/tools/get-stock-price';
import { JQuantsClient } from '../../src/api/j-quants-client';
import { TokenManager } from '../../src/auth/token-manager';
import { StockPrice } from '../../src/types';
import { ValidationError } from '../../src/utils/validator';

// =========================================
// 正常系テストケース（4件）
// =========================================
describe('get-stock-price.ts - 正常系テストケース', () => {
  // テストケース実装...
});

// =========================================
// 異常系テストケース（4件）
// =========================================
describe('get-stock-price.ts - 異常系テストケース', () => {
  // テストケース実装...
});

// =========================================
// 境界値テストケース（1件）
// =========================================
describe('get-stock-price.ts - 境界値テストケース', () => {
  // テストケース実装...
});
```

### 各テストケースのコメント形式

```typescript
/**
 * TC-NORMAL-001: getStockPrice() - codeのみ指定（全期間データ取得、日付降順）🔵
 *
 * 【テスト目的】: 銘柄コードのみを指定した場合に全期間の株価データが日付降順で取得できること
 * 【テスト内容】: code='7203'でgetStockPrice()を呼び出し
 * 【期待される動作】: 全期間のデータが日付降順でソートされて返却される
 * 🔵 信頼性レベル: 青信号（要件定義書とPhase 1タスク定義から確定）
 */
it('TC-NORMAL-001: getStockPrice() - codeのみ指定', async () => {
  // Given（前提条件）: JQuantsClientのモックを準備
  // 【テストデータ準備】: 複数日の株価データをモック
  const mockPrices: StockPrice[] = [
    { code: '7203', date: '2025-10-29', open: 3000, high: 3100, low: 2950, close: 3050, volume: 1000000 },
    { code: '7203', date: '2025-10-28', open: 2950, high: 3020, low: 2900, close: 3000, volume: 950000 },
    { code: '7203', date: '2025-10-27', open: 2900, high: 2980, low: 2850, close: 2950, volume: 900000 },
  ];
  vi.spyOn(JQuantsClient.prototype, 'getDailyQuotes').mockResolvedValue(mockPrices);

  // When（実行）: getStockPrice()をcodeのみで呼び出し
  // 【実際の処理実行】: 全期間データ取得処理の実行
  const result = await getStockPrice({ code: '7203' });

  // Then（検証）: 日付降順でデータが返却されることを確認
  // 【結果検証】: codeとprices配列の存在を確認
  expect(result.code).toBe('7203'); // 【確認内容】: codeが一致すること 🔵
  expect(result.prices).toHaveLength(3); // 【確認内容】: 全3件が返却されること 🔵

  // 【日付降順確認】: prices[0].date >= prices[1].date >= prices[2].date
  expect(result.prices[0].date).toBe('2025-10-29'); // 【確認内容】: 最新日が最初 🔵
  expect(result.prices[1].date).toBe('2025-10-28'); // 【確認内容】: 2番目に新しい日 🔵
  expect(result.prices[2].date).toBe('2025-10-27'); // 【確認内容】: 3番目に新しい日 🔵

  // 【API呼び出し確認】: JQuantsClient.getDailyQuotes()が正しく呼ばれたことを確認
  expect(JQuantsClient.prototype.getDailyQuotes).toHaveBeenCalledWith('7203'); // 【確認内容】: codeで呼ばれること 🔵
});
```

---

## 要件カバレッジ

| 要件ID | 要件内容 | 対応テストケース | カバレッジ |
|--------|---------|----------------|-----------|
| **REQ-FUNC-001** | 基本的な株価データ取得 | TC-NORMAL-001 | ✅ 100% |
| **REQ-FUNC-002** | 開始日フィルタリング | TC-NORMAL-002 | ✅ 100% |
| **REQ-FUNC-003** | 終了日フィルタリング | TC-NORMAL-003 | ✅ 100% |
| **REQ-FUNC-004** | 日付範囲フィルタリング | TC-NORMAL-004 | ✅ 100% |
| **REQ-FUNC-005** | 日付降順ソート | TC-NORMAL-001, 002, 003, 004 | ✅ 100% |
| **REQ-VAL-001** | 必須パラメータ検証 | TC-ERROR-001 | ✅ 100% |
| **REQ-VAL-002** | 銘柄コード形式検証 | TC-ERROR-002 | ✅ 100% |
| **REQ-VAL-003** | 日付形式検証 | TC-ERROR-003 | ✅ 100% |
| **REQ-VAL-004** | 日付範囲妥当性検証 | TC-ERROR-004 | ✅ 100% |

**要件カバレッジ**: ✅ **9/9 要件（100%）**

---

## 機能カバレッジ

| 機能 | テストケース | カバレッジ |
|------|------------|-----------|
| **全期間データ取得** | TC-NORMAL-001 | ✅ |
| **from_date フィルタリング** | TC-NORMAL-002 | ✅ |
| **to_date フィルタリング** | TC-NORMAL-003 | ✅ |
| **日付範囲フィルタリング** | TC-NORMAL-004 | ✅ |
| **日付降順ソート** | TC-NORMAL-001～004 | ✅ |
| **code 必須チェック** | TC-ERROR-001 | ✅ |
| **code 形式バリデーション** | TC-ERROR-002 | ✅ |
| **日付形式バリデーション** | TC-ERROR-003 | ✅ |
| **日付範囲バリデーション** | TC-ERROR-004 | ✅ |
| **存在しない銘柄処理** | TC-BOUNDARY-001 | ✅ |

**機能カバレッジ**: ✅ **10/10 機能（100%）**

---

## テスト実装上の注意事項

### 1. モック戦略

**JQuantsClientのモック**:
```typescript
import { vi } from 'vitest';
import { JQuantsClient } from '../../src/api/j-quants-client';

// getDailyQuotes()メソッドをモック
vi.spyOn(JQuantsClient.prototype, 'getDailyQuotes').mockResolvedValue(mockPrices);
```

**TokenManagerのモック**:
```typescript
// 環境変数設定
process.env.JQUANTS_REFRESH_TOKEN = 'test-refresh-token';

// TokenManager.getIdToken()をモック化
vi.spyOn(TokenManager.prototype, 'getIdToken').mockResolvedValue('mock-token');
```

**理由**: 実際のJ-Quants APIを呼ばずにテストを高速化し、テストの独立性を保つ

### 2. テストデータ

**サンプル株価データ**:
```typescript
const mockPrices: StockPrice[] = [
  {
    code: '7203',
    date: '2025-10-29',
    open: 3000,
    high: 3100,
    low: 2950,
    close: 3050,
    volume: 1000000,
    turnover: 3025000000,
    adjusted_close: 3050,
  },
  {
    code: '7203',
    date: '2025-10-28',
    open: 2950,
    high: 3020,
    low: 2900,
    close: 3000,
    volume: 950000,
    turnover: 2856250000,
    adjusted_close: 3000,
  },
];
```

**理由**: 複数日のデータで日付降順ソートとフィルタリングを検証

### 3. 非同期処理

**async/await の使用**:
```typescript
it('テストケース名', async () => {
  const result = await getStockPrice({ code: '7203' });
  expect(result).toBeDefined();
});
```

**理由**: getStockPrice()は非同期関数（Promise返却）のため

### 4. エラーハンドリングのテスト

**例外のテスト**:
```typescript
await expect(getStockPrice({})).rejects.toThrow(ValidationError);
await expect(getStockPrice({})).rejects.toThrow('必須パラメータ code が指定されていません');
```

**理由**: 非同期関数のエラーは `rejects.toThrow()` でテスト

### 5. 日付降順ソートの検証

**ソート順序の確認**:
```typescript
// 各連続する要素の日付を比較
for (let i = 0; i < result.prices.length - 1; i++) {
  expect(result.prices[i].date >= result.prices[i + 1].date).toBe(true);
}

// または個別に検証
expect(result.prices[0].date).toBeGreaterThanOrEqual(result.prices[1].date);
```

**理由**: 日付降順（新しい順）が確実に維持されていることを保証

---

## 品質判定

### ✅ 高品質: テストケース網羅率100%

**判定結果**: ✅ **高品質**

**判定理由**:
- ✅ **テストケース分類**: 正常系4件、異常系4件、境界値1件で網羅されている
- ✅ **期待値定義**: 各テストケースの期待値が明確（入出力、エラーメッセージまで定義）
- ✅ **技術選択**: TypeScript 5.x + Vitest 2.1.4で確定（既存コードベースと一貫）
- ✅ **実装可能性**: JQuantsClient.getDailyQuotes(), validator, TokenManagerが実装済みで実現可能

**信頼性レベルの分布**:
- 🔵 **青信号**: 100%（9/9件 - 要件定義書とPhase 1タスク定義から確定）
- 🟡 **黄信号**: 0%
- 🔴 **赤信号**: 0%（推測のみの項目なし）

**テストカバレッジ**:
- 要件カバレッジ: **100%**（9/9要件）
- 機能カバレッジ: **100%**（10/10機能）

---

## 次のステップ

### 推奨コマンド

```bash
/tsumiki:tdd-red
```

**実施内容**: 本テストケース定義書に基づいて、失敗するテストコードを作成します（Red Phase）。

**期待される成果物**:
- `tests/tools/get-stock-price.test.ts`（約350～450行）
- 9件のテストケース実装（すべて失敗する状態）
- Given-When-Then形式の日本語コメント
- Vitestによるテスト実行確認

---

**作成者**: Claude Code (TDD Test Cases Agent)
**最終更新**: 2025-10-30
**ステータス**: ✅ Test Cases Phase 完了
**次フェーズ**: Red Phase（失敗するテスト作成）
