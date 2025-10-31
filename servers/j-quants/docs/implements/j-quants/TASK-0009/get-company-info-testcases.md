# TASK-0009: get_company_info - テストケース仕様書

**タスクID**: TASK-0009
**タスク名**: MCPツール4: get_company_info（Company Info Tool）
**作成日**: 2025-10-30
**作成者**: Claude (Sonnet 4.5)
**テストフレームワーク**: Vitest 2.1.4
**プログラミング言語**: TypeScript 5.x

---

## 📋 概要

本ドキュメントは、TASK-0009（get_company_info）のテストケース仕様書です。要件定義書（`get-company-info-requirements.md`）に基づいて、包括的なテストケースを定義します。

### テストケース総数

**合計**: 7件
- 正常系: 2件
- 異常系: 3件
- 境界値: 2件

---

## 🧪 開発言語・フレームワーク

### プログラミング言語: TypeScript 5.x

**言語選択の理由**:
- Phase 1タスク定義で確定済み（TASK-0002型定義がTypeScriptで実装済み）
- strict mode 完全対応
- 既存実装（TASK-0006, 0007, 0008）と同じ技術スタック

**テストに適した機能**:
- 型安全性: インターフェース定義（CompanyInfo、Company、StockPrice）により型エラーをコンパイル時に検出
- モックサポート: Vitest の vi.spyOn() でTypeScriptのクラスメソッドを簡潔にモック化
- IntelliSense: IDE補完により、テストコード記述が効率化

🔵 **信頼性レベル**: 青信号（Phase 1タスク定義とTASK-0002から確定）

### テストフレームワーク: Vitest 2.1.4

**フレームワーク選択の理由**:
- 既存テスト（TASK-0006, 0007, 0008）と同一フレームワーク
- 高速実行: Jest互換APIながら、Viteベースで高速
- TypeScript ネイティブサポート: 設定不要で TypeScript を実行可能
- モックAPI充実: vi.spyOn(), vi.mock() で柔軟なモック作成

**テスト実行環境**:
- Node.js 環境
- Vitest CLI経由で実行
- ファイル: `tests/tools/get-company-info.test.ts`
- 実行コマンド: `npm test tests/tools/get-company-info.test.ts`

🔵 **信頼性レベル**: 青信号（既存テストファイルから確定）

---

## 🎯 正常系テストケース（2件）

### TC-NORMAL-001: 基本的な企業情報+最新株価取得

**テスト名**: getCompanyInfo() - codeのみ指定（基本的な企業情報+最新株価取得）

**何をテストするか**:
- 銘柄コード指定で企業情報（名称、市場、業種）と最新株価を統合して取得できること

**期待される動作**:
- JQuantsClient.getListedInfo() で企業情報を取得
- JQuantsClient.getDailyQuotes() で株価データを取得
- 2つのデータを統合して CompanyInfo 形式で返却
- 株価データから最新日（日付降順で先頭）を抽出

#### 入力値
```typescript
{ code: '7203' }
```

**入力データの意味**:
- code: '7203' = トヨタ自動車の銘柄コード（4桁数字形式の有効な銘柄コード）

#### 期待される結果
```typescript
{
  code: '7203',
  name: 'トヨタ自動車',
  market: Market.PRIME,
  sector: Sector.TRANSPORTATION_EQUIPMENT,
  latest_price: 3050.0,
  latest_date: '2025-10-29'
}
```

**期待結果の理由**:
- code: 入力パラメータと一致
- name, market, sector: getListedInfo() から取得した企業情報
- latest_price: getDailyQuotes() から取得した最新株価（日付降順で先頭のclose値）
- latest_date: 最新株価の日付

**テストの目的**:
- 企業情報と株価データの統合処理が正しく動作することを確認
- 最新株価の抽出ロジック（日付降順ソート）が正しく動作することを確認

**確認ポイント**:
- CompanyInfo の全プロパティ（code, name, market, sector, latest_price, latest_date）が存在すること
- latest_price が最新日付のデータから取得されていること
- JQuantsClient.getListedInfo() が1回呼ばれること
- JQuantsClient.getDailyQuotes() が1回呼ばれること

🔵 **信頼性レベル**: 青信号（要件定義書 REQ-FUNC-001, REQ-FUNC-002, REQ-FUNC-003 から確定）

---

### TC-NORMAL-002: 最新株価の日付検証

**テスト名**: getCompanyInfo() - 最新株価が正しく抽出されることを確認

**何をテストするか**:
- 複数日の株価データが存在する場合に、最新日（日付が最も新しい）のデータが抽出されること

**期待される動作**:
- getDailyQuotes() が複数日のデータを返却
- 日付降順でソート
- 先頭（最新日）のデータから latest_price, latest_date を抽出

#### 入力値
```typescript
{ code: '7203' }
```

**入力データの意味**:
- code: '7203' = トヨタ自動車の銘柄コード

#### モックデータ（JQuantsClient.getDailyQuotes()）
```typescript
[
  { code: '7203', date: '2025-10-27', close: 2950 },
  { code: '7203', date: '2025-10-29', close: 3050 },  // 最新
  { code: '7203', date: '2025-10-28', close: 3000 },
]
```

**入力データの意味**:
- 日付が順不同の株価データ（実際のAPIはソートされていない可能性があるため）

#### 期待される結果
```typescript
{
  latest_price: 3050.0,
  latest_date: '2025-10-29'
}
```

**期待結果の理由**:
- latest_price: 3050.0 = 日付降順ソート後の先頭データ（2025-10-29）の close 値
- latest_date: '2025-10-29' = 最新の日付

**テストの目的**:
- 日付降順ソート処理が正しく動作することを確認
- 最新データの抽出ロジックが正しく動作することを確認

**確認ポイント**:
- latest_date が '2025-10-29' であること（最新日）
- latest_price が 3050.0 であること（最新日のclose値）
- 古い日付のデータ（2025-10-27, 2025-10-28）が使われていないこと

🔵 **信頼性レベル**: 青信号（要件定義書 REQ-FUNC-002 と Phase 1タスク定義から確定）

---

## ⚠️ 異常系テストケース（3件）

### TC-ERROR-001: codeパラメータ未指定

**テスト名**: getCompanyInfo() - codeパラメータ未指定

**エラーケースの概要**: 必須パラメータ code が指定されていない

**エラー処理の重要性**:
- 必須パラメータの欠如を早期に検出し、不正なAPI呼び出しを防ぐ
- ユーザーに明確なエラーメッセージを返却し、修正を促す

#### 入力値
```typescript
{}
```

**不正な理由**: code は必須パラメータだが指定されていない

**実際の発生シナリオ**:
- ユーザーが銘柄コードを指定せずにツールを実行した場合
- パラメータの渡し忘れ

#### 期待される結果
```typescript
ValidationError: 必須パラメータ code が指定されていません
```

**エラーメッセージの内容**:
- ユーザーにとって分かりやすい日本語メッセージ
- どのパラメータが不足しているかを明示

**システムの安全性**:
- バリデーションで早期にエラーを検出
- 不正なリクエストでAPIを呼び出さない

**テストの目的**:
- validateRequiredParam() が正しく動作することを確認
- ValidationError が適切にスローされることを確認

**品質保証の観点**:
- 必須パラメータの検証により、APIリクエストの整合性を保証
- エラーハンドリングの一貫性を確保

🔵 **信頼性レベル**: 青信号（要件定義書 REQ-VAL-001 と既存実装パターンから確定）

---

### TC-ERROR-002: 不正なcode値

**テスト名**: getCompanyInfo() - 不正なcode値（3桁、5桁、アルファベット）

**エラーケースの概要**: 4桁数字以外の形式の code が指定されている

**エラー処理の重要性**:
- 不正なフォーマットの code で API 呼び出しを防ぐ
- J-Quants API のエラーを事前に防止

#### 入力値
```typescript
[
  { code: '123' },     // 3桁
  { code: '12345' },   // 5桁
  { code: 'ABCD' },    // アルファベット
]
```

**不正な理由**:
- code は4桁の数字でなければならない（J-Quants API の仕様）
- 3桁、5桁は桁数が不正
- アルファベットは数字でない

**実際の発生シナリオ**:
- ユーザーが誤った形式の銘柄コードを入力した場合
- ティッカーシンボル（例: AAPL）と混同した場合

#### 期待される結果
```typescript
ValidationError: 銘柄コードは4桁の数字である必要があります
```

**エラーメッセージの内容**:
- 正しい形式（4桁の数字）を明示
- ユーザーが修正しやすいメッセージ

**システムの安全性**:
- フォーマット検証により、API エラーを事前に防止
- 不正なリクエストを排除

**テストの目的**:
- validateCode() が正しく動作することを確認
- すべての不正形式でエラーがスローされることを確認

**品質保証の観点**:
- 入力値検証の網羅性を保証
- エッジケースでのエラーハンドリングの一貫性

🔵 **信頼性レベル**: 青信号（要件定義書 REQ-VAL-002 と既存実装パターンから確定）

---

### TC-ERROR-003: 存在しない銘柄コード

**テスト名**: getCompanyInfo() - 存在しない銘柄コード

**エラーケースの概要**: 形式は正しいが実在しない銘柄コードが指定されている

**エラー処理の重要性**:
- 存在しないデータへのアクセスを適切に処理
- ユーザーに銘柄コードの誤りを通知

#### 入力値
```typescript
{ code: '9999' }
```

**不正な理由**:
- 形式は4桁数字で正しいが、実在しない銘柄コード
- J-Quants API がデータを返却しない

**実際の発生シナリオ**:
- ユーザーが誤った銘柄コードを入力した場合
- 上場廃止された銘柄コードを指定した場合

#### 期待される結果
```typescript
Error: 指定された銘柄コード（9999）は存在しません
```

**エラーメッセージの内容**:
- どの銘柄コードが存在しないかを明示
- ユーザーが修正しやすいメッセージ

**システムの安全性**:
- API エラーを適切にハンドリング
- エラーメッセージをユーザーに分かりやすく伝える

**テストの目的**:
- 存在しない銘柄コードに対するエラーハンドリングが正しく動作することを確認
- JQuantsClient のエラーが適切に伝播されることを確認

**品質保証の観点**:
- 外部 API エラーの適切な処理
- ユーザーエクスペリエンスの向上

🔵 **信頼性レベル**: 青信号（Phase 1タスク定義のテストケース5と既存実装パターンから確定）

---

## 🔄 境界値テストケース（2件）

### TC-BOUNDARY-001: 株価データが存在しない企業

**テスト名**: getCompanyInfo() - 株価データが存在しない企業

**境界値の意味**: 企業情報は存在するが株価データが存在しない境界ケース

**境界値での動作保証**:
- 企業情報は取得できるが株価データがない場合の適切な処理
- エラーではなく、latest_price なしでデータを返却するか、エラーをスローするか（実装方針による）

#### 入力値
```typescript
{ code: '8000' }
```

**境界値選択の根拠**:
- 企業情報は存在するが株価データが存在しないケース
- IPO直後の企業や、取引停止中の企業

**実際の使用場面**:
- IPO直後でまだ株価データが登録されていない企業
- 取引停止中の企業

#### モックデータ
- JQuantsClient.getListedInfo(): 企業情報を返却
- JQuantsClient.getDailyQuotes(): 空配列を返却

#### 期待される結果（パターンA: latest_price なしで返却）
```typescript
{
  code: '8000',
  name: '企業名',
  market: Market.PRIME,
  sector: Sector.INFORMATION_COMMUNICATION,
  // latest_price: undefined or null
  // latest_date: undefined or null
}
```

**または**

#### 期待される結果（パターンB: エラーをスロー）
```typescript
Error: 株価データが利用できません
```

**境界での正確性**:
- 株価データが0件の場合でも、企業情報は正しく返却される
- エラーハンドリングが一貫している

**一貫した動作**:
- 他の境界値ケースと同様の形式でエラー処理
- CompanyInfo の型定義に準拠

**テストの目的**:
- 株価データが存在しない場合の処理が正しく動作することを確認
- エッジケースでのデータ整合性を保証

**堅牢性の確認**:
- 部分的なデータ欠損に対する堅牢性
- エラーハンドリングの一貫性

🔵 **信頼性レベル**: 青信号（Phase 1タスク定義のテストケース6から確定）

---

### TC-BOUNDARY-002: データ構造の完全性確認

**テスト名**: getCompanyInfo() - データ構造の完全性確認

**境界値の意味**:
- 返却データが CompanyInfo インターフェースの全プロパティを含むことの境界
- 部分的なデータではなく、完全なデータ構造が返却される

**境界値での動作保証**:
- すべてのプロパティが存在すること
- TypeScript strict mode でコンパイルエラーがないこと

#### 入力値
```typescript
{ code: '7203' }
```

**境界値選択の根拠**:
- CompanyInfo インターフェースの全プロパティが揃っている正常なケース
- データ構造の完全性を検証

**実際の使用場面**:
- すべてのデータを利用した分析
- CompanyInfo をそのまま他のシステムに渡す場合

#### 期待される結果
```typescript
{
  code: '7203',          // string
  name: 'トヨタ自動車',   // string
  market: Market.PRIME,  // Market enum
  sector: Sector.TRANSPORTATION_EQUIPMENT,  // Sector enum
  latest_price: 3050.0,  // number
  latest_date: '2025-10-29'  // string (YYYY-MM-DD)
}
```

**境界での正確性**:
- すべてのプロパティが存在すること
- 各プロパティの型が CompanyInfo 定義と一致すること

**一貫した動作**:
- CompanyInfo 型定義に完全に準拠
- TypeScript strict mode での型安全性

**テストの目的**:
- 返却データの構造が CompanyInfo インターフェースに完全に準拠することを確認
- すべてのプロパティが存在し、正しい型であることを確認

**堅牢性の確認**:
- データ構造の一貫性
- 型安全性の保証

🔵 **信頼性レベル**: 青信号（CompanyInfo 型定義とPhase 1タスク定義から確定）

---

## 🔧 モック戦略

### TokenManager モック

**モック対象**: `TokenManager.prototype.getIdToken`

**モック理由**:
- 実際のJ-Quants API認証を回避し、テストを高速化
- 認証トークンの取得に依存せず、テストを独立させる

**モック実装**:
```typescript
vi.spyOn(TokenManager.prototype, 'getIdToken').mockResolvedValue('mock-token');
```

🔵 **信頼性レベル**: 青信号（既存テストパターンから確定）

---

### JQuantsClient モック

#### JQuantsClient.prototype.getListedInfo モック

**モック対象**: `JQuantsClient.prototype.getListedInfo`

**モック理由**:
- 実際のAPI呼び出しを回避し、テストを高速化
- テストデータを完全にコントロール

**モック実装**:
```typescript
const mockCompany: Company = {
  code: '7203',
  name: 'トヨタ自動車',
  market: Market.PRIME,
  sector: Sector.TRANSPORTATION_EQUIPMENT,
};

vi.spyOn(JQuantsClient.prototype, 'getListedInfo').mockResolvedValue([mockCompany]);
```

🔵 **信頼性レベル**: 青信号（既存テストパターンから確定）

---

#### JQuantsClient.prototype.getDailyQuotes モック

**モック対象**: `JQuantsClient.prototype.getDailyQuotes`

**モック理由**:
- 実際のAPI呼び出しを回避し、テストを高速化
- 株価データをコントロールして、最新データ抽出ロジックを検証

**モック実装**:
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
  },
];

vi.spyOn(JQuantsClient.prototype, 'getDailyQuotes').mockResolvedValue(mockPrices);
```

🔵 **信頼性レベル**: 青信号（既存テストパターンから確定）

---

## 📊 テストケース実装時のコメント指針

### テストケース開始時のコメント

各テストケースの実装時には以下のコメントを必ず含めてください：

```typescript
/**
 * TC-XXXX-XXX: getCompanyInfo() - テスト名
 *
 * 【テスト目的】: このテストで何を確認するかを日本語で明記
 * 【テスト内容】: 具体的にどのような処理をテストするかを説明
 * 【期待される動作】: 正常に動作した場合の結果を説明
 * 🔵🟡🔴 信頼性レベル: 青信号/黄信号/赤信号
 */
```

### Given（準備フェーズ）のコメント

```typescript
// Given（前提条件）: モックデータの準備
// 【テストデータ準備】: なぜこのデータを用意するかの理由
// 【初期条件設定】: テスト実行前の状態を説明
```

### When（実行フェーズ）のコメント

```typescript
// When（実行）: getCompanyInfo()を呼び出し
// 【実際の処理実行】: どの機能/メソッドを呼び出すかを説明
// 【処理内容】: 実行される処理の内容を日本語で説明
```

### Then（検証フェーズ）のコメント

```typescript
// Then（検証）: 結果の検証
// 【結果検証】: 何を検証するかを具体的に説明
// 【期待値確認】: 期待される結果とその理由を説明
```

### 各expectステートメントのコメント

```typescript
expect(result.code).toBe('7203'); // 【確認内容】: codeが入力値と一致すること 🔵
expect(result.name).toBe('トヨタ自動車'); // 【確認内容】: nameが企業名と一致すること 🔵
expect(result.latest_price).toBe(3050.0); // 【確認内容】: latest_priceが最新日のclose値であること 🔵
```

🔵 **信頼性レベル**: 青信号（既存テストパターンから確定）

---

## 📈 要件カバレッジマトリクス

| 要件ID | 要件名 | カバーするテストケース | カバレッジ |
|--------|--------|----------------------|-----------|
| REQ-FUNC-001 | 基本的な企業情報取得 | TC-NORMAL-001, TC-BOUNDARY-002 | 100% |
| REQ-FUNC-002 | 最新株価の取得 | TC-NORMAL-001, TC-NORMAL-002, TC-BOUNDARY-001 | 100% |
| REQ-FUNC-003 | データの統合 | TC-NORMAL-001, TC-BOUNDARY-002 | 100% |
| REQ-VAL-001 | 必須パラメータ検証（code） | TC-ERROR-001 | 100% |
| REQ-VAL-002 | 銘柄コード形式検証 | TC-ERROR-002 | 100% |
| - | 存在しない銘柄コード | TC-ERROR-003 | 100% |
| - | 株価データが存在しない | TC-BOUNDARY-001 | 100% |

**全体カバレッジ**: 100%（5要件 + 2境界条件 = 7項目すべてカバー）

🔵 **信頼性レベル**: 青信号（要件定義書から確定）

---

## ✅ 品質判定

### 判定結果: ✅ 高品質

**判定基準に対する評価**:

1. **テストケース分類**: ✅ 正常系・異常系・境界値が網羅されている
   - 正常系: 2件（基本動作、最新株価抽出）
   - 異常系: 3件（code未指定、不正code、存在しない銘柄）
   - 境界値: 2件（株価データなし、データ構造完全性）

2. **期待値定義**: ✅ 各テストケースの期待値が明確
   - すべてのテストケースで入力値と期待される結果が具体的に定義
   - エラーケースのエラーメッセージも明確に定義

3. **技術選択**: ✅ プログラミング言語・テストフレームワークが確定
   - TypeScript 5.x: Phase 1タスク定義で確定
   - Vitest 2.1.4: 既存テスト（TASK-0006, 0007, 0008）で確定

4. **実装可能性**: ✅ 現在の技術スタックで実現可能
   - JQuantsClient.getListedInfo(): TASK-0004で実装済み
   - JQuantsClient.getDailyQuotes(): TASK-0004で実装済み
   - validateRequiredParam(), validateCode(): TASK-0005で実装済み
   - モックパターン: 既存テストで確立済み

**信頼性レベルの分布**:
- 🔵 青信号: 100%（すべてのテストケースが要件定義書または既存実装から確定）
- 🟡 黄信号: 0%
- 🔴 赤信号: 0%

---

## 🚀 次のステップ

### 推奨コマンド

```bash
/tsumiki:tdd-red
```

**実施内容**: 本テストケース仕様書に基づいて、失敗するテストコードを実装します（TDD Red Phase）。

**期待される成果物**:
- `tests/tools/get-company-info.test.ts`
- 7件のテストケース実装（すべて失敗する状態）
- Given-When-Then形式のテスト構造
- モックの適切な設定

---

**作成者**: Claude (Sonnet 4.5)
**最終更新**: 2025-10-30
**ステータス**: ✅ Test Cases Phase 完了
**次フェーズ**: Red Phase（失敗するテスト作成）
