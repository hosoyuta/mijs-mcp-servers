# TASK-0006: get_listed_companies MCPツール - テストケース定義書

**タスクID**: TASK-0006
**タスク名**: MCPツール1: get_listed_companies（Listed Companies Tool）
**種別**: TDD - Test Cases Phase
**作成日**: 2025-10-29
**参照**: get-listed-companies-requirements.md

---

## 開発言語・テストフレームワーク

### 🔵 プログラミング言語

**言語**: TypeScript 5.x

**言語選択の理由**:
- 型安全性によるバグの早期発見
- 既存コードベース（TASK-0002～0005）との一貫性
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
- 既存テスト（TASK-0003～0005）との一貫性

**テスト実行環境**:
- Node.js 20 LTS
- Windows/Unix両対応
- CI/CDパイプラインでの自動実行を想定

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: 既存のテストファイル（validator.test.ts等）で使用中

---

## テストケース一覧

### 正常系テストケース: 4件
### 異常系テストケース: 3件
### 境界値テストケース: 2件
**合計**: 9件

---

## 1. 正常系テストケース（4件）

### TC-NORMAL-001: パラメータなし - 全銘柄取得🔵

**テスト名**: getListedCompanies() - パラメータなし（全銘柄取得）
- **何をテストするか**: パラメータを指定しない場合に全上場銘柄が取得できること
- **期待される動作**: JQuantsClient.getListedInfo()が呼ばれ、全銘柄がそのまま返却される

**入力値**:
```typescript
params: {}
```
- **入力データの意味**: フィルタ条件なし、全銘柄を取得したい場合を想定
- **実際の使用場面**: 「全ての上場銘柄を教えて」というユーザー要求

**期待される結果**:
```typescript
{
  companies: [
    { code: '1234', name: 'トヨタ自動車', market: 'Prime', sector: '3700' },
    { code: '5678', name: 'ソフトバンクグループ', market: 'Prime', sector: '5250' },
    // ... 3000+銘柄
  ]
}
```
- **期待結果の理由**: APIから取得した全銘柄がフィルタなしで返却されるべき
- **データ件数**: 3000+件（実際のJ-Quants APIの銘柄数）

**テストの目的**: 基本機能（全銘柄取得）の確認
- **確認ポイント**:
  - companies配列が存在する
  - companies配列に3000件以上の銘柄が含まれる
  - 各銘柄がCompany型の構造を持つ（code, name, market, sector）
  - JQuantsClient.getListedInfo()が1回呼ばれる

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース1から確定

---

### TC-NORMAL-002: marketフィルタ - Prime市場のみ🔵

**テスト名**: getListedCompanies() - marketフィルタ（Prime市場のみ）
- **何をテストするか**: market='Prime'を指定した場合、Prime市場の銘柄のみが返却されること
- **期待される動作**: フィルタリングロジックが正しく動作し、条件に合致する銘柄のみが返却される

**入力値**:
```typescript
params: { market: 'Prime' }
```
- **入力データの意味**: プライム市場の銘柄のみを取得したい
- **実際の使用場面**: 「プライム市場の銘柄を教えて」というユーザー要求

**期待される結果**:
```typescript
{
  companies: [
    { code: '1234', name: 'トヨタ自動車', market: 'Prime', sector: '3700' },
    { code: '5678', name: 'ソフトバンクグループ', market: 'Prime', sector: '5250' },
    // ... Prime市場の銘柄のみ
  ]
}
```
- **期待結果の理由**: `company.market === 'Prime'` の条件でフィルタリング
- **データ件数**: Prime市場の銘柄数（1000～1500件程度）

**テストの目的**: marketフィルタリング機能の確認
- **確認ポイント**:
  - 返却された全銘柄の market が 'Prime' である
  - Standard, Growth, Other市場の銘柄が含まれていない
  - フィルタリング前の件数 > フィルタリング後の件数

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース2から確定

---

### TC-NORMAL-003: sectorフィルタ - 銀行業のみ🔵

**テスト名**: getListedCompanies() - sectorフィルタ（業種コード指定）
- **何をテストするか**: sector='7050'を指定した場合、銀行業の銘柄のみが返却されること
- **期待される動作**: 業種コードでのフィルタリングが正しく動作する

**入力値**:
```typescript
params: { sector: '7050' }
```
- **入力データの意味**: 銀行業（業種コード7050）の銘柄のみを取得したい
- **実際の使用場面**: 「銀行業の銘柄を教えて」というユーザー要求

**期待される結果**:
```typescript
{
  companies: [
    { code: '8306', name: '三菱UFJフィナンシャル・グループ', market: 'Prime', sector: '7050' },
    { code: '8316', name: '三井住友フィナンシャルグループ', market: 'Prime', sector: '7050' },
    // ... 銀行業（7050）の銘柄のみ
  ]
}
```
- **期待結果の理由**: `company.sector === '7050'` の条件でフィルタリング
- **データ件数**: 銀行業の銘柄数（80～100件程度）

**テストの目的**: sectorフィルタリング機能の確認
- **確認ポイント**:
  - 返却された全銘柄の sector が '7050' である
  - 他の業種コードの銘柄が含まれていない
  - フィルタリング前の件数 > フィルタリング後の件数

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース3から確定

---

### TC-NORMAL-004: 複合フィルタ - market + sector🔵

**テスト名**: getListedCompanies() - 複合フィルタ（market + sector）
- **何をテストするか**: market='Prime' と sector='3700' を同時指定した場合、AND条件でフィルタリングされること
- **期待される動作**: 両方の条件を満たす銘柄のみが返却される

**入力値**:
```typescript
params: {
  market: 'Prime',
  sector: '3700' // 輸送用機器（自動車）
}
```
- **入力データの意味**: プライム市場の自動車メーカーのみを取得したい
- **実際の使用場面**: 「プライム市場の自動車メーカーを教えて」というユーザー要求

**期待される結果**:
```typescript
{
  companies: [
    { code: '7201', name: '日産自動車', market: 'Prime', sector: '3700' },
    { code: '7203', name: 'トヨタ自動車', market: 'Prime', sector: '3700' },
    { code: '7267', name: 'ホンダ', market: 'Prime', sector: '3700' },
    // ... Prime市場 且つ 輸送用機器の銘柄のみ
  ]
}
```
- **期待結果の理由**: `company.market === 'Prime' && company.sector === '3700'` の条件でフィルタリング
- **データ件数**: Prime市場の自動車メーカー数（10～20件程度）

**テストの目的**: 複合フィルタリング（AND条件）の確認
- **確認ポイント**:
  - 返却された全銘柄の market が 'Prime' である
  - 返却された全銘柄の sector が '3700' である
  - 片方の条件のみ満たす銘柄が含まれていない
  - market単独フィルタ > market+sector複合フィルタの件数

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース4から確定

---

## 2. 異常系テストケース（3件）

### TC-ERROR-001: 不正なmarket値🔵

**テスト名**: getListedCompanies() - 不正なmarket値（ValidationError）
- **エラーケースの概要**: 存在しない市場区分を指定した場合のエラーハンドリング
- **エラー処理の重要性**: 不正なパラメータを早期に検出し、わかりやすいエラーメッセージを返す

**入力値**:
```typescript
params: { market: 'TSE' }
```
- **不正な理由**: 'TSE'は旧市場区分名で、現在のMarket列挙型に含まれない
- **実際の発生シナリオ**: ユーザーが古い市場区分名を指定した場合

**期待される結果**:
```typescript
ValidationError がスローされる
エラーメッセージ: "パラメータ market の値が不正です。有効な値: Prime, Standard, Growth, Other"
```
- **エラーメッセージの内容**: どのパラメータがなぜ不正かを明示
- **システムの安全性**: 不正な値でAPIを呼ばずにバリデーションで弾く

**テストの目的**: marketパラメータのバリデーション確認
- **確認ポイント**:
  - ValidationError がスローされる
  - エラーメッセージに 'market' が含まれる
  - エラーメッセージに有効な値（Prime, Standard, Growth, Other）が含まれる
  - JQuantsClient.getListedInfo()が呼ばれない（バリデーションで事前に弾かれる）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース5、TASK-0005のvalidator.tsから確定

---

### TC-ERROR-002: 不正なsector値🔵

**テスト名**: getListedCompanies() - 不正なsector値（ValidationError）
- **エラーケースの概要**: 存在しない業種コードを指定した場合のエラーハンドリング
- **エラー処理の重要性**: 不正な業種コードで無駄なAPI呼び出しを防ぐ

**入力値**:
```typescript
params: { sector: 'FINANCE' }
```
- **不正な理由**: 'FINANCE'は業種名であり、業種コード（0050～9050）ではない
- **実際の発生シナリオ**: ユーザーが業種名を英語で指定した場合

**期待される結果**:
```typescript
ValidationError がスローされる
エラーメッセージ: "パラメータ sector の値が不正です。有効な値: 0050, 1050, ..., 9050"
```
- **エラーメッセージの内容**: 業種コードの形式（4桁数字）を示唆
- **システムの安全性**: 不正な業種コードでのフィルタリングを防ぐ

**テストの目的**: sectorパラメータのバリデーション確認
- **確認ポイント**:
  - ValidationError がスローされる
  - エラーメッセージに 'sector' が含まれる
  - エラーメッセージに有効な業種コードのサンプル（0050, 9050等）が含まれる
  - JQuantsClient.getListedInfo()が呼ばれない

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース6、TASK-0005のvalidator.tsから確定

---

### TC-ERROR-003: API通信エラー🔵

**テスト名**: getListedCompanies() - API通信エラー（ネットワークエラー）
- **エラーケースの概要**: J-Quants APIへの接続が失敗した場合のエラーハンドリング
- **エラー処理の重要性**: ネットワーク障害時にも適切にエラーを返却し、リトライを試みる

**入力値**:
```typescript
params: {}
```
- **不正な理由**: ネットワーク障害、APIサーバーダウン等
- **実際の発生シナリオ**: インターネット接続断、J-Quants APIのメンテナンス時

**モック設定**:
```typescript
JQuantsClient.getListedInfo() → throws Error('Network error')
```
- **モックの理由**: ネットワークエラーを再現するため

**期待される結果**:
```typescript
APIError がスローされる
エラーメッセージ: "J-Quants APIへの接続に失敗しました"
リトライ: 最大3回試行（JQuantsClientのリトライロジック）
```
- **エラーメッセージの内容**: ネットワークエラーであることを明示
- **システムの安全性**: リトライ後、適切にエラーを伝播する

**テストの目的**: API通信エラー時のエラーハンドリング確認
- **確認ポイント**:
  - APIError または Error がスローされる
  - エラーメッセージに 'API' または '接続' が含まれる
  - JQuantsClient.getListedInfo()のリトライロジックが動作する（TASK-0004実装済み）
  - エラー発生後もアプリケーションがクラッシュしない

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: REQ-601（リトライロジック）、REQ-602（エラーハンドリング）から確定

---

## 3. 境界値テストケース（2件）

### TC-BOUNDARY-001: 空のフィルタ結果🟡

**テスト名**: getListedCompanies() - 空のフィルタ結果（該当銘柄なし）
- **境界値の意味**: フィルタ条件に合致する銘柄が1件も存在しない場合
- **境界値での動作保証**: 空配列を返却し、エラーにならないこと

**入力値**:
```typescript
params: {
  market: 'Growth',
  sector: '7050' // 銀行業
}
```
- **境界値選択の根拠**: グロース市場に銀行業の銘柄は通常存在しない
- **実際の使用場面**: ユーザーが実在しない組み合わせを指定した場合

**期待される結果**:
```typescript
{
  companies: []
}
```
- **境界での正確性**: エラーではなく空配列を返却
- **一貫した動作**: 0件でも companies配列の構造は維持される

**テストの目的**: 空のフィルタ結果の適切な処理確認
- **確認ポイント**:
  - エラーがスローされない
  - companies配列が空配列 `[]` である
  - companies配列の型が正しい（Company[]）
  - JQuantsClient.getListedInfo()は正常に呼ばれている

**【信頼性レベル】**: 🟡 黄信号
**【根拠】**: Phase 1タスク定義に明示されていないが、要件から妥当な動作として推測

---

### TC-BOUNDARY-002: 大量データ処理（3000+銘柄）🟡

**テスト名**: getListedCompanies() - 大量データ処理（パフォーマンス確認）
- **境界値の意味**: 全銘柄（3000+件）を処理する場合のパフォーマンス
- **境界値での動作保証**: 5秒以内にレスポンスが返ること（REQ-603）

**入力値**:
```typescript
params: {}
```
- **境界値選択の根拠**: 最大件数のデータ処理を想定
- **実際の使用場面**: ユーザーが全銘柄を取得する場合

**期待される結果**:
```typescript
{
  companies: [ ... ] // 3000+件
}
レスポンス時間: 5秒以内
```
- **境界での正確性**: 大量データでも正確に処理される
- **一貫した動作**: データ件数に関わらず構造は同じ

**テストの目的**: パフォーマンス要件の確認
- **確認ポイント**:
  - レスポンス時間が5秒以内
  - メモリ使用量が500MB以下（Phase 1統合テスト基準）
  - すべてのデータが欠損なく返却される
  - フィルタリング処理がO(n)の線形時間で完了する

**【信頼性レベル】**: 🟡 黄信号
**【根拠】**: REQ-603（タイムアウト5秒）とPhase 1統合テスト基準から推測

---

## テストケース実装時の日本語コメント指針

### テストファイル構造

```typescript
/**
 * TASK-0006: get_listed_companies MCPツール テストケース
 *
 * 【テストフェーズ】: TDD Red Phase（失敗するテストを作成）
 * 【作成日】: 2025-10-29
 * 【テストフレームワーク】: Vitest 2.1.4
 * 【言語】: TypeScript 5.x
 * 【目的】: get_listed_companiesツールのテスト実装
 * 【対応要件】: REQ-101, REQ-102, REQ-501, REQ-502, REQ-701
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getListedCompanies } from '../../src/tools/get-listed-companies';
import { JQuantsClient } from '../../src/api/j-quants-client';
import { Market, Sector, type Company } from '../../src/types';

// =========================================
// 正常系テストケース（4件）
// =========================================
describe('get-listed-companies.ts - 正常系テストケース', () => {
  // テストケース実装...
});

// =========================================
// 異常系テストケース（3件）
// =========================================
describe('get-listed-companies.ts - 異常系テストケース', () => {
  // テストケース実装...
});

// =========================================
// 境界値テストケース（2件）
// =========================================
describe('get-listed-companies.ts - 境界値テストケース', () => {
  // テストケース実装...
});
```

### 各テストケースのコメント形式

```typescript
/**
 * TC-NORMAL-001: getListedCompanies() - パラメータなし（全銘柄取得）🔵
 *
 * 【テスト目的】: パラメータを指定しない場合に全上場銘柄が取得できること
 * 【テスト内容】: パラメータ{}でgetListedCompanies()を呼び出し
 * 【期待される動作】: 全銘柄（3000+件）が返却される
 * 🔵 信頼性レベル: 青信号（要件定義書とPhase 1タスク定義から確定）
 */
it('TC-NORMAL-001: getListedCompanies() - パラメータなし（全銘柄取得）', async () => {
  // Given（前提条件）: JQuantsClientのモックを準備
  // 【テストデータ準備】: 全銘柄データ（3000+件）をモック
  const mockCompanies: Company[] = [
    { code: '1234', name: 'トヨタ自動車', market: Market.PRIME, sector: Sector.TRANSPORTATION_EQUIPMENT },
    { code: '5678', name: 'ソフトバンクグループ', market: Market.PRIME, sector: Sector.INFORMATION_COMMUNICATION },
    // ... 3000+件
  ];
  vi.spyOn(JQuantsClient.prototype, 'getListedInfo').mockResolvedValue(mockCompanies);

  // When（実行）: getListedCompanies()をパラメータなしで呼び出し
  // 【実際の処理実行】: 全銘柄取得処理の実行
  const result = await getListedCompanies({});

  // Then（検証）: 全銘柄が返却されることを確認
  // 【結果検証】: companies配列に全銘柄が含まれること
  expect(result.companies).toHaveLength(mockCompanies.length);
  // 【確認内容】: 全銘柄がフィルタなしで返却される
  expect(result.companies).toEqual(mockCompanies);
  // 【確認内容】: JQuantsClient.getListedInfo()が1回呼ばれる
  expect(JQuantsClient.prototype.getListedInfo).toHaveBeenCalledTimes(1);
});
```

---

## 要件カバレッジ

| 要件ID | 要件内容 | 対応テストケース | カバレッジ |
|--------|---------|----------------|-----------|
| **REQ-101** | 全上場銘柄取得 | TC-NORMAL-001 | ✅ 100% |
| **REQ-102** | marketフィルタリング | TC-NORMAL-002, TC-ERROR-001 | ✅ 100% |
| **REQ-102** | sectorフィルタリング | TC-NORMAL-003, TC-ERROR-002 | ✅ 100% |
| **REQ-102** | 複合フィルタリング | TC-NORMAL-004 | ✅ 100% |
| **REQ-501** | MCPツール基本構造 | 全テストケース | ✅ 100% |
| **REQ-502** | エラーハンドリング | TC-ERROR-001, TC-ERROR-002, TC-ERROR-003 | ✅ 100% |
| **REQ-603** | パフォーマンス（5秒以内） | TC-BOUNDARY-002 | ✅ 100% |
| **REQ-701** | バリデーション | TC-ERROR-001, TC-ERROR-002 | ✅ 100% |

**要件カバレッジ**: ✅ **8/8 要件（100%）**

---

## 機能カバレッジ

| 機能 | テストケース | カバレッジ |
|------|------------|-----------|
| **全銘柄取得** | TC-NORMAL-001 | ✅ |
| **marketフィルタリング** | TC-NORMAL-002 | ✅ |
| **sectorフィルタリング** | TC-NORMAL-003 | ✅ |
| **複合フィルタリング** | TC-NORMAL-004 | ✅ |
| **marketバリデーション** | TC-ERROR-001 | ✅ |
| **sectorバリデーション** | TC-ERROR-002 | ✅ |
| **API通信エラー処理** | TC-ERROR-003 | ✅ |
| **空のフィルタ結果処理** | TC-BOUNDARY-001 | ✅ |
| **大量データ処理** | TC-BOUNDARY-002 | ✅ |

**機能カバレッジ**: ✅ **9/9 機能（100%）**

---

## テスト実装上の注意事項

### 1. モック戦略

**JQuantsClientのモック**:
```typescript
import { vi } from 'vitest';
import { JQuantsClient } from '../../src/api/j-quants-client';

// getListedInfo()メソッドをモック
vi.spyOn(JQuantsClient.prototype, 'getListedInfo').mockResolvedValue(mockCompanies);
```

**理由**: 実際のJ-Quants APIを呼ばずにテストを高速化し、テストの独立性を保つ

### 2. テストデータ

**サンプル銘柄データ**:
```typescript
const mockCompanies: Company[] = [
  { code: '1234', name: 'テスト銘柄A', market: Market.PRIME, sector: Sector.TRANSPORTATION_EQUIPMENT },
  { code: '5678', name: 'テスト銘柄B', market: Market.STANDARD, sector: Sector.INFORMATION_COMMUNICATION },
  { code: '9012', name: 'テスト銘柄C', market: Market.GROWTH, sector: Sector.BANKS },
];
```

**理由**: 多様な市場区分・業種を含むテストデータで網羅的にテスト

### 3. 非同期処理

**async/await の使用**:
```typescript
it('テストケース名', async () => {
  const result = await getListedCompanies({});
  expect(result).toBeDefined();
});
```

**理由**: getListedCompanies()は非同期関数（Promise返却）のため

### 4. エラーハンドリングのテスト

**例外のテスト**:
```typescript
await expect(getListedCompanies({ market: 'INVALID' })).rejects.toThrow(ValidationError);
```

**理由**: 非同期関数のエラーは `rejects.toThrow()` でテスト

---

## 品質判定

### ✅ 高品質: テストケース網羅率100%

**判定結果**: ✅ **高品質**

**判定理由**:
- ✅ **テストケース分類**: 正常系4件、異常系3件、境界値2件で網羅されている
- ✅ **期待値定義**: 各テストケースの期待値が明確（入出力、エラーメッセージまで定義）
- ✅ **技術選択**: TypeScript 5.x + Vitest 2.1.4で確定（既存コードベースと一貫）
- ✅ **実装可能性**: JQuantsClient, validator, error-handlerが実装済みで実現可能

**信頼性レベルの分布**:
- 🔵 **青信号**: 78%（7/9件 - 要件定義書とPhase 1タスク定義から確定）
- 🟡 **黄信号**: 22%（2/9件 - 境界値テストケースのみ推測）
- 🔴 **赤信号**: 0%（推測のみの項目なし）

**テストカバレッジ**:
- 要件カバレッジ: **100%**（8/8要件）
- 機能カバレッジ: **100%**（9/9機能）

---

## 次のステップ

### 推奨コマンド

```bash
/tsumiki:tdd-red
```

**実施内容**: 本テストケース定義書に基づいて、失敗するテストコードを作成します（Red Phase）。

**期待される成果物**:
- `tests/tools/get-listed-companies.test.ts`（約300～400行）
- 9件のテストケース実装（すべて失敗する状態）
- Given-When-Then形式の日本語コメント
- Vitestによるテスト実行確認

---

**作成者**: Claude Code (TDD Test Cases Agent)
**最終更新**: 2025-10-29
**ステータス**: ✅ Test Cases Phase 完了
**次フェーズ**: Red Phase（失敗するテスト作成）
