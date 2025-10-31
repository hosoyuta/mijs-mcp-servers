# TASK-0008: get_financial_statements - テストケース仕様書

**タスクID**: TASK-0008
**タスク名**: MCPツール3: get_financial_statements（Financial Statements Tool）
**テストフレームワーク**: Vitest 2.1.4
**言語**: TypeScript 5.x
**作成日**: 2025-10-30
**作成者**: Claude (Sonnet 4.5)

---

## 📚 テストケース概要

### テストケース総数

**合計**: 9件
- **正常系**: 3件
- **異常系**: 4件
- **境界値**: 2件

### テストケース分類の理由

- **正常系**: 基本機能の動作確認（codeのみ、連結指定、単体指定）
- **異常系**: エラーハンドリングの確認（バリデーションエラー、存在しないデータ）
- **境界値**: 極端な条件での動作確認（データなし、データ構造）

---

## 🛠️ 開発言語・フレームワーク

### プログラミング言語: TypeScript 5.x

**言語選択の理由**:
- Phase 1タスク定義で TypeScript strict mode が必須要件
- 既存のTASK-0006, TASK-0007 も TypeScript で実装済み
- 型安全性により財務諸表の複雑な型定義を厳密に管理可能

**テストに適した機能**:
- strict モードによる型チェック
- インターフェース定義による明確なテストデータ構造
- async/await による非同期テストの可読性向上

🔵 **信頼性レベル**: 青信号
**根拠**: Phase 1タスク定義とTASK-0001～0007の実装から確定

### テストフレームワーク: Vitest 2.1.4

**フレームワーク選択の理由**:
- Phase 1タスク定義でVitest使用が確定
- 既存のTASK-0006, TASK-0007 も Vitest で実装済み
- TypeScript のネイティブサポート
- 高速な実行速度とHMR対応

**テスト実行環境**:
- Node.js 20 LTS
- npm test コマンドで実行
- ファイルパス: `tests/tools/get-financial-statements.test.ts`

🔵 **信頼性レベル**: 青信号
**根拠**: Phase 1タスク定義とpackage.jsonから確定

---

## ✅ 正常系テストケース（3件）

### TC-NORMAL-001: codeのみ指定（デフォルト：連結財務諸表取得）

**テスト名**: getFinancialStatements() - codeのみ指定

**何をテストするか**:
- 銘柄コードのみを指定した場合に最新の財務諸表データが取得できること
- statement_type 未指定時にデフォルトで連結財務諸表が返却されること

**期待される動作**:
- JQuantsClient.getStatements()が呼ばれる
- 連結財務諸表（Consolidated）のデータが返却される
- balance_sheet, profit_loss, cash_flow の3つのオブジェクトが含まれる

**入力値**:
```typescript
{
  code: '7203' // トヨタ自動車の銘柄コード
}
```

**入力データの意味**:
- code='7203': 実在する大企業の銘柄コード（トヨタ自動車）
- statement_type未指定: デフォルト動作を確認するため

**期待される結果**:
```typescript
{
  code: '7203',
  fiscal_year: '2024',
  statement_type: 'Consolidated',
  balance_sheet: {
    total_assets: 10000000000,
    current_assets: 5000000000,
    non_current_assets: 5000000000,
    total_liabilities: 4000000000,
    current_liabilities: 3000000000,
    non_current_liabilities: 1000000000,
    net_assets: 6000000000,
    equity: 5500000000
  },
  profit_loss: {
    revenue: 500000000,
    cost_of_sales: 350000000,
    gross_profit: 150000000,
    operating_profit: 50000000,
    ordinary_profit: 48000000,
    profit_before_tax: 45000000,
    net_profit: 30000000,
    earnings_per_share: 150.5
  },
  cash_flow: {
    operating_cash_flow: 40000000,
    investing_cash_flow: -10000000,
    financing_cash_flow: -5000000,
    free_cash_flow: 30000000,
    cash_and_equivalents: 100000000
  }
}
```

**期待結果の理由**:
- デフォルトで連結財務諸表を取得する仕様（REQ-FUNC-004）
- 財務三表（BS/PL/CF）がすべて含まれる仕様（REQ-FUNC-001）

**テストの目的**:
- 基本的な財務諸表取得機能の確認
- デフォルト動作（連結財務諸表）の確認
- 返却データ構造の確認

**確認ポイント**:
- code プロパティが一致すること
- statement_type が 'Consolidated' であること
- balance_sheet, profit_loss, cash_flow の3つが存在すること
- 各財務諸表オブジェクトが正しい構造を持つこと

🔵 **信頼性レベル**: 青信号
**根拠**: 要件定義書REQ-FUNC-001, REQ-FUNC-004とPhase 1タスク定義のテストケース2から確定

---

### TC-NORMAL-002: code + statement_type='Consolidated' 指定

**テスト名**: getFinancialStatements() - 連結財務諸表を明示的に指定

**何をテストするか**:
- statement_type='Consolidated' を明示的に指定した場合に連結財務諸表が取得できること
- 連結財務諸表のみが返却されること

**期待される動作**:
- JQuantsClient.getStatements()が statement_type='Consolidated' で呼ばれる
- 連結財務諸表のデータが返却される

**入力値**:
```typescript
{
  code: '7203',
  statement_type: 'Consolidated'
}
```

**入力データの意味**:
- code='7203': トヨタ自動車の銘柄コード
- statement_type='Consolidated': 連結財務諸表を明示的に指定

**期待される結果**:
```typescript
{
  code: '7203',
  fiscal_year: '2024',
  statement_type: 'Consolidated',
  balance_sheet: { /* データ */ },
  profit_loss: { /* データ */ },
  cash_flow: { /* データ */ }
}
```

**期待結果の理由**:
- 明示的に指定したstatement_typeが反映される仕様（REQ-FUNC-002）
- 連結財務諸表が存在する場合は正常に返却される

**テストの目的**:
- statement_type パラメータの機能確認
- 連結財務諸表取得の明示的指定確認

**確認ポイント**:
- statement_type が 'Consolidated' であること
- JQuantsClient.getStatements() が正しいパラメータで呼ばれること
- 返却データが連結財務諸表であること

🔵 **信頼性レベル**: 青信号
**根拠**: 要件定義書REQ-FUNC-002とPhase 1タスク定義のテストケース3から確定

---

### TC-NORMAL-003: code + statement_type='NonConsolidated' 指定

**テスト名**: getFinancialStatements() - 単体財務諸表を指定

**何をテストするか**:
- statement_type='NonConsolidated' を指定した場合に単体財務諸表が取得できること
- 単体（非連結）財務諸表のみが返却されること

**期待される動作**:
- JQuantsClient.getStatements()が statement_type='NonConsolidated' で呼ばれる
- 単体財務諸表のデータが返却される

**入力値**:
```typescript
{
  code: '7203',
  statement_type: 'NonConsolidated'
}
```

**入力データの意味**:
- code='7203': トヨタ自動車の銘柄コード
- statement_type='NonConsolidated': 単体財務諸表を明示的に指定

**期待される結果**:
```typescript
{
  code: '7203',
  fiscal_year: '2024',
  statement_type: 'NonConsolidated',
  balance_sheet: { /* データ */ },
  profit_loss: { /* データ */ },
  cash_flow: { /* データ */ }
}
```

**期待結果の理由**:
- 明示的に指定したstatement_typeが反映される仕様（REQ-FUNC-003）
- 単体財務諸表が存在する場合は正常に返却される

**テストの目的**:
- statement_type パラメータによる単体財務諸表取得の確認
- 連結と単体の区別が正しく機能することの確認

**確認ポイント**:
- statement_type が 'NonConsolidated' であること
- JQuantsClient.getStatements() が正しいパラメータで呼ばれること
- 返却データが単体財務諸表であること

🔵 **信頼性レベル**: 青信号
**根拠**: 要件定義書REQ-FUNC-003とPhase 1タスク定義のテストケース4から確定

---

## ❌ 異常系テストケース（4件）

### TC-ERROR-001: codeパラメータ未指定

**テスト名**: getFinancialStatements() - code未指定エラー

**エラーケースの概要**:
- 必須パラメータ code が指定されていない状態で実行
- バリデーションエラーが適切にスローされることを確認

**エラー処理の重要性**:
- 必須パラメータの不足は最も基本的なバリデーション
- ユーザーが誤って呼び出した場合に明確なエラーメッセージで誘導する

**入力値**:
```typescript
{} // code を指定しない
```

**不正な理由**:
- code は必須パラメータ（REQ-VAL-001）
- 銘柄コードなしでは財務諸表を特定できない

**実際の発生シナリオ**:
- ユーザーがパラメータ指定を忘れた場合
- APIクライアントのバグでパラメータが欠落した場合

**期待される結果**:
```typescript
// ValidationError がスローされる
{
  name: 'ValidationError',
  message: '必須パラメータ code が指定されていません',
  code: ErrorCode.MISSING_PARAM
}
```

**エラーメッセージの内容**:
- 日本語で分かりやすい
- どのパラメータが不足しているかが明確

**システムの安全性**:
- 不完全なリクエストでAPI呼び出しが実行されない
- 早期にエラーを検出して処理を中断

**テストの目的**:
- 必須パラメータバリデーションの確認
- 適切なエラーメッセージが返却されることの確認

**品質保証の観点**:
- ユーザーに対する親切なエラーメッセージ提供
- システムの安全な動作保証

🔵 **信頼性レベル**: 青信号
**根拠**: 要件定義書REQ-VAL-001とPhase 1タスク定義のテストケース1から確定

---

### TC-ERROR-002: 不正なcode値

**テスト名**: getFinancialStatements() - 不正な銘柄コード

**エラーケースの概要**:
- 4桁数字以外の不正な銘柄コードが指定された場合
- 形式バリデーションが適切に機能することを確認

**エラー処理の重要性**:
- 不正な形式の銘柄コードでAPI呼び出しをすると無駄なリクエストになる
- 早期にバリデーションすることでAPIコストとレスポンス時間を節約

**入力値**:
```typescript
// パターン1: 3桁
{ code: '123' }

// パターン2: 5桁
{ code: '12345' }

// パターン3: アルファベット
{ code: 'ABCD' }
```

**不正な理由**:
- 銘柄コードは4桁数字と定義されている（REQ-VAL-002）
- 日本の証券コードは4桁数字の標準

**実際の発生シナリオ**:
- ユーザーが誤った銘柄コードを入力
- 海外株式コード（アルファベット）を誤って入力
- 入力ミスで桁数が不正

**期待される結果**:
```typescript
// ValidationError がスローされる
{
  name: 'ValidationError',
  message: '銘柄コードは4桁の数字である必要があります',
  code: ErrorCode.INVALID_CODE
}
```

**エラーメッセージの内容**:
- 正しい形式（4桁数字）が明示されている
- ユーザーが修正方法を理解できる

**システムの安全性**:
- 不正な形式のコードでAPI呼び出しをしない
- バリデーションで早期に不正を検出

**テストの目的**:
- 銘柄コード形式バリデーションの確認
- 複数の不正パターンに対応することの確認

**品質保証の観点**:
- 入力値の厳格な検証
- 無駄なAPI呼び出しの防止

🔵 **信頼性レベル**: 青信号
**根拠**: 要件定義書REQ-VAL-002とPhase 1タスク定義のテストケース5から確定

---

### TC-ERROR-003: 不正なstatement_type値

**テスト名**: getFinancialStatements() - 不正な財務諸表種別

**エラーケースの概要**:
- 'Consolidated' または 'NonConsolidated' 以外の値が指定された場合
- 列挙型バリデーションが適切に機能することを確認

**エラー処理の重要性**:
- 不正な statement_type では正しいデータを取得できない
- StatementType enum に定義された値のみを受け付ける厳格性が必要

**入力値**:
```typescript
{
  code: '7203',
  statement_type: 'INVALID' // 不正な値
}
```

**不正な理由**:
- statement_type は 'Consolidated' | 'NonConsolidated' のみ許可（REQ-VAL-003）
- StatementType enum に定義されていない値

**実際の発生シナリオ**:
- ユーザーが誤った値を指定
- 古いAPI仕様の値を使用
- タイポや大文字小文字の誤り

**期待される結果**:
```typescript
// ValidationError がスローされる
{
  name: 'ValidationError',
  message: 'statement_type パラメータの値が不正です',
  code: ErrorCode.INVALID_CODE
}
```

**エラーメッセージの内容**:
- どのパラメータが不正かが明確
- 有効な値が提示されることが望ましい

**システムの安全性**:
- 不正な statement_type でAPI呼び出しをしない
- 列挙型の厳格な検証

**テストの目的**:
- statement_type バリデーションの確認
- 列挙型バリデーション関数の動作確認

**品質保証の観点**:
- 型安全性の確保
- 明確なエラーメッセージ提供

🔵 **信頼性レベル**: 青信号
**根拠**: 要件定義書REQ-VAL-003とPhase 1タスク定義のテストケース6から確定

---

### TC-ERROR-004: 存在しない銘柄コード

**テスト名**: getFinancialStatements() - 存在しない銘柄コード

**エラーケースの概要**:
- 形式は正しいが実在しない銘柄コードが指定された場合
- API側でデータが見つからない場合の処理を確認

**エラー処理の重要性**:
- 実在しない銘柄コードへの適切な対応
- ユーザーに分かりやすいエラーメッセージを提供

**入力値**:
```typescript
{
  code: '9999' // 形式は正しいが実在しない銘柄コード
}
```

**不正な理由**:
- データベースに存在しない銘柄コード
- 上場廃止済みの銘柄コード
- 架空の銘柄コード

**実際の発生シナリオ**:
- ユーザーが誤った銘柄コードを入力
- 上場廃止した企業のコードを使用
- テスト用の架空コードを使用

**期待される結果**:
```typescript
// Error がスローされる
{
  message: '指定された銘柄コード（9999）は存在しません'
}
```

**エラーメッセージの内容**:
- どの銘柄コードが存在しないかが明確
- ユーザーが確認できる情報

**システムの安全性**:
- 存在しないデータへのアクセスを適切に処理
- システムがクラッシュしない

**テストの目的**:
- API側のエラーレスポンス処理の確認
- 存在しない銘柄コードへの対応確認

**品質保証の観点**:
- ユーザーフレンドリーなエラーメッセージ
- システムの安定性確保

🔵 **信頼性レベル**: 青信号
**根拠**: Phase 1タスク定義のテストケース7から確定

---

## 🎯 境界値テストケース（2件）

### TC-BOUNDARY-001: 財務データが存在しない企業

**テスト名**: getFinancialStatements() - 財務データなし

**境界値の意味**:
- 新興企業や財務諸表未提出企業などデータが存在しない極端なケース
- システムがデータ不在を適切に処理できるかの確認

**境界値での動作保証**:
- データが存在しない場合も適切なエラーメッセージを返却
- システムがクラッシュしない

**入力値**:
```typescript
{
  code: '8000' // 仮想的な新興企業（財務データなし）
}
```

**境界値選択の根拠**:
- 銘柄コードとしては存在するがデータがないケース
- 新興企業や未公開企業の可能性

**実際の使用場面**:
- IPO直後の企業
- 財務諸表提出前の企業
- データ更新中の企業

**期待される結果**:
```typescript
// Error がスローされる
{
  message: '財務諸表データが利用できません'
}
```

**境界での正確性**:
- データ不在を適切に検出
- ユーザーに分かりやすいメッセージを提供

**一貫した動作**:
- 他のエラーケースと同様の形式でエラーを返却
- システムの一貫性を保つ

**テストの目的**:
- データ不在時の処理確認
- エラーハンドリングの堅牢性確認

**堅牢性の確認**:
- データが存在しない極端な状況でも安定動作
- 適切なエラーメッセージ提供

🔵 **信頼性レベル**: 青信号
**根拠**: Phase 1タスク定義のテストケース8から確定

---

### TC-BOUNDARY-002: データ形式確認（balance_sheet, profit_loss, cash_flow 全て含む）

**テスト名**: getFinancialStatements() - データ構造の完全性確認

**境界値の意味**:
- 返却データが財務三表（BS/PL/CF）を完全に含むことの確認
- データ構造の整合性を保証

**境界値での動作保証**:
- 部分的なデータではなく完全な財務三表が返却される
- すべてのプロパティが存在する

**入力値**:
```typescript
{
  code: '7203'
}
```

**境界値選択の根拠**:
- 財務三表が揃っている正常なデータで構造を検証
- 必須プロパティの存在確認

**実際の使用場面**:
- すべての財務データを利用した分析
- 完全なデータセットが必要な処理

**期待される結果**:
```typescript
{
  code: '7203',
  fiscal_year: '2024',
  statement_type: 'Consolidated',
  balance_sheet: {
    total_assets: [number],
    current_assets: [number],
    non_current_assets: [number],
    total_liabilities: [number],
    current_liabilities: [number],
    non_current_liabilities: [number],
    net_assets: [number],
    equity: [number]
  },
  profit_loss: {
    revenue: [number],
    cost_of_sales: [number],
    gross_profit: [number],
    operating_profit: [number],
    ordinary_profit: [number],
    profit_before_tax: [number],
    net_profit: [number],
    earnings_per_share: [number]
  },
  cash_flow: {
    operating_cash_flow: [number],
    investing_cash_flow: [number],
    financing_cash_flow: [number],
    free_cash_flow: [number],
    cash_and_equivalents: [number]
  }
}
```

**境界での正確性**:
- すべてのプロパティが存在すること
- 各プロパティが正しい型であること

**一貫した動作**:
- FinancialStatements 型定義に完全に準拠
- TypeScript strict mode での型安全性

**テストの目的**:
- データ構造の完全性確認
- 型定義との整合性確認

**堅牢性の確認**:
- 部分的なデータが返却されないことの保証
- TypeScript strict mode での型安全性確保

🔵 **信頼性レベル**: 青信号
**根拠**: Phase 1タスク定義のテストケース9と要件定義書REQ-FUNC-001から確定

---

## 🧪 テストケース実装時の指針

### モック戦略

**TokenManager のモック**:
```typescript
vi.spyOn(TokenManager.prototype, 'getIdToken').mockResolvedValue('mock-token');
```
- 理由: 実際のトークン取得を回避し、テストを高速化

**JQuantsClient のモック**:
```typescript
vi.spyOn(JQuantsClient.prototype, 'getStatements').mockResolvedValue(mockData);
```
- 理由: 実際のAPI呼び出しを回避し、テストを安定化

🔵 **信頼性レベル**: 青信号
**根拠**: 既存のTASK-0006, TASK-0007のテストパターンから確定

### テストデータの準備

**正常系テストデータ**:
- code: '7203' (トヨタ自動車)
- fiscal_year: '2024'
- statement_type: 'Consolidated' または 'NonConsolidated'
- 完全な財務三表データ

**異常系テストデータ**:
- code未指定: {}
- 不正なcode: '123', '12345', 'ABCD'
- 不正なstatement_type: 'INVALID'
- 存在しないcode: '9999'

🔵 **信頼性レベル**: 青信号
**根拠**: 要件定義書とPhase 1タスク定義のテストケースから確定

---

## ✅ 品質判定

### 判定結果: ✅ 高品質

**理由**:
- ✅ テストケース分類: 正常系・異常系・境界値が網羅されている（3+4+2=9件）
- ✅ 期待値定義: 各テストケースの期待値が明確に定義されている
- ✅ 技術選択: TypeScript 5.x + Vitest 2.1.4 が確定している
- ✅ 実装可能性: 既存のTASK-0006, TASK-0007のパターンで実現可能

**テストケース網羅率**:
- 機能要件カバレッジ: 100%（REQ-FUNC-001～004すべてカバー）
- バリデーション要件カバレッジ: 100%（REQ-VAL-001～003すべてカバー）

**信頼性レベル分布**:
- 🔵 青信号: 100%（すべてのテストケースが要件定義書・既存実装から確定）
- 🟡 黄信号: 0%
- 🔴 赤信号: 0%

---

## 🚀 次のステップ

### 推奨コマンド

```bash
/tsumiki:tdd-red
```

**実施内容**: 本テストケース仕様書に基づいて、Red Phase（失敗するテスト）を実装します。

**期待される成果物**:
- `tests/tools/get-financial-statements.test.ts`（失敗するテストファイル）
- 9件のテストケース実装
- すべてのテストが FAIL（実装が存在しないため）

---

**作成者**: Claude (Sonnet 4.5)
**最終更新**: 2025-10-30
**ステータス**: ✅ Test Cases Phase 完了
**次フェーズ**: Red Phase（失敗テスト作成）
