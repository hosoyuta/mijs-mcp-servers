# Phase 3: 高度な分析機能 - 詳細タスク計画書

## Phase 3 概要

**フェーズ名**: Phase 3: 高度な分析機能（Advanced Analysis Features）
**期間**: 8日間（64時間）
**目標**: 4つの高度な分析MCPツール実装、パフォーマンス最適化、キャッシング戦略実装を実施する
**タスク数**: 8タスク（TASK-0019～TASK-0026）
**ステータス**: 実装フェーズ（Day 19-26）

### Phase 3 成果物

1. ✅ 4つの高度な分析MCPツール実装完成
   - get_margin_trading（信用取引残高情報取得）
   - get_short_selling（空売り情報取得）
   - get_investment_breakdown（投資部門別売買高取得）
   - get_topix_data（TOPIX指数データ取得）
2. ✅ パフォーマンス最適化実装完成
3. ✅ キャッシング戦略実装完成
4. ✅ レート制限強化対応完成
5. ✅ 監視・メトリクス実装完成
6. ✅ Phase 3 統合テスト実施完了
7. ✅ Phase 3 ドキュメント完成

### Phase 3 関連要件

**高度な分析ツール要件**: REQ-901, REQ-902 ベースの拡張機能、Phase 3 要件仕様
**パフォーマンス要件**: NFR-001, NFR-002, NFR-003（5秒以内、起動10秒以内、メモリ500MB以下）
**キャッシング要件**: 応答時間最適化、API呼び出し削減
**監視・メトリクス要件**: REQ-902（APIレスポンスタイム計測、パフォーマンス監視）

---

## 週単位実施計画

### 第5週：高度な分析ツール実装（Day 19-23）

| 日付 | タスクID | タスク名 | 時間 | 種別 | 概要 |
|------|---------|---------|------|------|------|
| Day 19 | TASK-0019 | MCPツール9: get_margin_trading | 8h | TDD | 信用取引残高データ取得ツール実装 |
| Day 20 | TASK-0020 | MCPツール10: get_short_selling | 8h | TDD | 空売り情報取得ツール実装 |
| Day 21 | TASK-0021 | MCPツール11: get_investment_breakdown | 8h | TDD | 投資部門別売買高取得ツール実装 |
| Day 22 | TASK-0022 | MCPツール12: get_topix_data | 8h | TDD | TOPIX指数データ取得ツール実装 |
| Day 23 | TASK-0023 | パフォーマンス最適化 | 8h | DIRECT | レスポンス時間・メモリ使用量最適化 |

**第5週成果**: 4つの高度な分析ツール実装完成、パフォーマンス最適化完成

### 第6週：キャッシング・監視・統合（Day 24-26）

| 日付 | タスクID | タスク名 | 時間 | 種別 | 概要 |
|------|---------|---------|------|------|------|
| Day 24 | TASK-0024 | レート制限対応強化 | 8h | TDD | src/utils/rate-limiter.ts実装、REQ-605対応 |
| Day 25 | TASK-0025 | 監視・メトリクス実装 | 8h | DIRECT | src/utils/metrics.ts実装、性能監視 |
| Day 26 | TASK-0026 | Phase 3 統合テスト | 8h | TDD | 12つのツール統合テスト、パフォーマンス検証 |

**第6週成果**: キャッシング戦略完成、監視機能完成、全統合テスト完了

---

## 日別詳細タスク定義

### Day 19: TASK-0019: MCPツール9: get_margin_trading

**[ ] TASK-0019: MCPツール9: get_margin_trading**

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0019 |
| **タスク名** | MCPツール9: get_margin_trading（Margin Trading Tool） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | Phase 3 機能要件、REQ-901、REQ-701 |
| **依存タスク** | TASK-0004, TASK-0005, TASK-0011 |

#### 説明

指定銘柄の信用取引残高情報を取得するMCPツール `get_margin_trading` を実装します。買い持ち・売り持ち建玉、信用金利、返済期限等の情報を提供し、投資家の信用取引戦略分析を支援します。

#### 実装内容

1. **ツール実装 (src/tools/get-margin-trading.ts)**

   関数シグネチャ:
   ```typescript
   async function getMarginTrading(
     params: {
       code: string;           // 必須: 銘柄コード（4桁数字）
       period?: string;        // オプション: 期間指定（day, week, month）
     }
   ): Promise<{
     code: string;
     name: string;
     date: string;
     margin_balance: {
       buy_position: number;    // 買い建玉（株数）
       sell_position: number;   // 売り建玉（株数）
       buy_balance_amount: number;  // 買い建玉金額
       sell_balance_amount: number; // 売り建玉金額
       turnover_rate: number;   // 回転率（%）
     };
     interest_rate: number;     // 信用金利（%）
     trend: MarginTrend[];      // 過去のトレンド
   }>
   ```

2. **入力パラメータ**
   - `code`（必須）: 銘柄コード（4桁数字）
   - `period`（オプション）: 期間指定（day, week, month、デフォルト: week）

3. **出力形式**
   ```json
   {
     "code": "1234",
     "name": "トヨタ自動車",
     "date": "2025-10-29",
     "margin_balance": {
       "buy_position": 500000,
       "sell_position": 300000,
       "buy_balance_amount": 1500000000,
       "sell_balance_amount": 900000000,
       "turnover_rate": 2.5
     },
     "interest_rate": 1.2,
     "trend": [
       {
         "date": "2025-10-29",
         "buy_position": 500000,
         "sell_position": 300000
       },
       // ... 過去のデータ
     ]
   }
   ```

4. **データマッピング**
   - J-Quants API から信用取引残高データを取得
   - 買い・売り持ち別に整理
   - トレンド情報を含める

5. **バリデーション**
   - code が4桁数字か
   - period が有効な値（day, week, month）か

6. **エラーハンドリング**
   - code が存在しない → "指定された銘柄コード（XXXX）は存在しません"
   - 信用取引データが存在しない → "信用取引情報が利用できません"

#### TDD テスト要件

**Red フェーズ**:
- 信用取引データ取得 → FAIL
- 複数期間取得 → FAIL
- トレンド情報 → FAIL

**Green フェーズ**:
- 実装によってすべてのテストをPASS

**Refactor フェーズ**:
- データマッピング最適化
- トレンド計算ロジック改善

#### テストケース詳細

```typescript
// test/tools/get-margin-trading.test.ts

1. code のみ指定（デフォルト: week）
   - params: { code: '1234' }
   ✓ 当週の信用取引残高が返却される
   ✓ margin_balance に必要なフィールドが含まれる

2. period: day 指定
   - params: { code: '1234', period: 'day' }
   ✓ 日単位のデータが返却される
   ✓ trend に複数日分が含まれる

3. 買い・売り建玉確認
   - 返却されたデータの合計を確認
   ✓ buy_position > 0
   ✓ sell_position > 0

4. 信用金利確認
   - interest_rate が合理的な値
   ✓ interest_rate > 0 && interest_rate < 10

5. 回転率計算
   - turnover_rate が正しく計算されている
   ✓ turnover_rate は合理的な値

6. トレンド情報
   - trend 配列が時系列でソートされている
   ✓ trend[0].date <= trend[1].date

7. 不正な code
   - params: { code: '123' }
   ✓ ValidationError スロー

8. 無効な period
   - params: { code: '1234', period: 'invalid' }
   ✓ ValidationError スロー

9. 存在しないコード
   - params: { code: '9999' }
   ✓ エラーメッセージ返却

10. 信用取引データ非対応企業
    - params: { code: '5000' }（仮想的な新興企業）
    ✓ エラーメッセージ返却: "信用取引情報が利用できません"
```

#### 完了基準

- [ ] `src/tools/get-margin-trading.ts` が実装
- [ ] 信用取引残高データ取得実装
- [ ] トレンド情報取得実装
- [ ] すべてのテストケース（PASS 条件）がパス
- [ ] レスポンス形式が仕様に準拠
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   ├── types/
│   │   └── index.ts (修正、MarginBalance型追加)
│   └── tools/
│       └── get-margin-trading.ts (新規)
└── tests/
    └── tools/
        └── get-margin-trading.test.ts (新規)
```

---

### Day 20: TASK-0020: MCPツール10: get_short_selling

**[ ] TASK-0020: MCPツール10: get_short_selling**

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0020 |
| **タスク名** | MCPツール10: get_short_selling（Short Selling Tool） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | Phase 3 機能要件、REQ-901、REQ-701 |
| **依存タスク** | TASK-0004, TASK-0005, TASK-0011 |

#### 説明

指定銘柄の空売り情報を取得するMCPツール `get_short_selling` を実装します。空売り数量、空売り売却数量、規制銘柄の別等の情報を提供し、市場の空売り動向を分析できます。

#### 実装内容

1. **ツール実装 (src/tools/get-short-selling.ts)**

   関数シグネチャ:
   ```typescript
   async function getShortSelling(
     params: {
       code: string;           // 必須: 銘柄コード（4桁数字）
       from_date?: string;     // オプション: 開始日（YYYY-MM-DD）
       to_date?: string;       // オプション: 終了日（YYYY-MM-DD）
     }
   ): Promise<{
     code: string;
     name: string;
     current_status: {
       short_position: number;  // 空売り数量（株）
       short_sales_volume: number; // 空売り売却数量
       short_rate: number;     // 空売り比率（%）
       is_regulated: boolean;  // 規制銘柄か
       regulation_type?: string; // 規制の種類
     };
     history: ShortSellingRecord[];
   }>
   ```

2. **入力パラメータ**
   - `code`（必須）: 銘柄コード（4桁数字）
   - `from_date`（オプション）: 開始日（YYYY-MM-DD）
   - `to_date`（オプション）: 終了日（YYYY-MM-DD）

3. **出力形式**
   ```json
   {
     "code": "1234",
     "name": "トヨタ自動車",
     "current_status": {
       "short_position": 50000,
       "short_sales_volume": 1000000,
       "short_rate": 2.5,
       "is_regulated": false
     },
     "history": [
       {
         "date": "2025-10-29",
         "short_position": 50000,
         "short_sales_volume": 100000,
         "short_rate": 2.5
       },
       // ... 過去のデータ
     ]
   }
   ```

4. **バリデーション**
   - code が4桁数字か
   - from_date, to_date が YYYY-MM-DD 形式か
   - from_date <= to_date か

5. **エラーハンドリング**
   - code が存在しない → "指定された銘柄コード（XXXX）は存在しません"
   - 空売り情報が存在しない → "空売り情報が利用できません"

#### TDD テスト要件

**Red フェーズ**:
- 空売り情報取得 → FAIL
- 日付範囲フィルタ → FAIL
- 規制銘柄確認 → FAIL

**Green フェーズ**:
- 実装によってすべてのテストをPASS

**Refactor フェーズ**:
- フィルタリング最適化
- データ整理ロジック改善

#### テストケース詳細

```typescript
// test/tools/get-short-selling.test.ts

1. code のみ指定
   - params: { code: '1234' }
   ✓ 空売り情報が返却される
   ✓ current_status に必要なフィールドが含まれる

2. 日付範囲指定
   - params: { code: '1234', from_date: '2025-01-01', to_date: '2025-12-31' }
   ✓ 指定範囲内のデータのみが返却される

3. 規制銘柄判定
   - is_regulated が boolean
   ✓ 規制銘柄の場合、regulation_type が設定される

4. 空売り比率計算
   - short_rate が正しく計算されている
   ✓ short_rate = short_sales_volume / 総売買高 × 100

5. 履歴情報
   - history 配列が時系列でソートされている
   ✓ history[0].date <= history[1].date

6. 不正な code
   - params: { code: '123' }
   ✓ ValidationError スロー

7. 不正な日付形式
   - params: { code: '1234', from_date: '2025/01/01' }
   ✓ ValidationError スロー

8. from_date > to_date
   - params: { code: '1234', from_date: '2025-12-31', to_date: '2025-01-01' }
   ✓ ValidationError スロー

9. 存在しないコード
   - params: { code: '9999' }
   ✓ エラーメッセージ返却

10. 空売り情報非対応企業
    - params: { code: '5000' }
    ✓ エラーメッセージ返却: "空売り情報が利用できません"
```

#### 完了基準

- [ ] `src/tools/get-short-selling.ts` が実装
- [ ] 空売り情報取得実装
- [ ] 日付範囲フィルタリング実装
- [ ] 規制銘柄判定実装
- [ ] すべてのテストケース（PASS 条件）がパス
- [ ] レスポンス形式が仕様に準拠
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   ├── types/
│   │   └── index.ts (修正、ShortSelling型追加)
│   └── tools/
│       └── get-short-selling.ts (新規)
└── tests/
    └── tools/
        └── get-short-selling.test.ts (新規)
```

---

### Day 21: TASK-0021: MCPツール11: get_investment_breakdown

**[ ] TASK-0021: MCPツール11: get_investment_breakdown**

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0021 |
| **タスク名** | MCPツール11: get_investment_breakdown（Investment Breakdown Tool） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | Phase 3 機能要件、REQ-901、REQ-701 |
| **依存タスク** | TASK-0004, TASK-0005, TASK-0011 |

#### 説明

指定銘柄の投資部門別売買高情報を取得するMCPツール `get_investment_breakdown` を実装します。個人投資家、機関投資家、外国人等の部門別売買額・売買数量を提供し、投資家構成の分析を支援します。

#### 実装内容

1. **ツール実装 (src/tools/get-investment-breakdown.ts)**

   関数シグネチャ:
   ```typescript
   async function getInvestmentBreakdown(
     params: {
       code: string;           // 必須: 銘柄コード（4桁数字）
       period?: string;        // オプション: 期間指定（day, week, month）
     }
   ): Promise<{
     code: string;
     name: string;
     date: string;
     breakdown: {
       individual: InvestorCategory;
       institution: InvestorCategory;
       foreign: InvestorCategory;
       other: InvestorCategory;
     };
     summary: {
       total_buy_volume: number;
       total_sell_volume: number;
       total_buy_amount: number;
       total_sell_amount: number;
     };
   }>
   ```

2. **入力パラメータ**
   - `code`（必須）: 銘柄コード（4桁数字）
   - `period`（オプション）: 期間指定（day, week, month、デフォルト: day）

3. **出力形式**
   ```json
   {
     "code": "1234",
     "name": "トヨタ自動車",
     "date": "2025-10-29",
     "breakdown": {
       "individual": {
         "buy_volume": 5000000,
         "sell_volume": 4500000,
         "buy_amount": 15000000000,
         "sell_amount": 13500000000,
         "net_buy": 500000,
         "buy_percentage": 25.0
       },
       "institution": {
         "buy_volume": 10000000,
         "sell_volume": 11000000,
         "buy_amount": 30000000000,
         "sell_amount": 33000000000,
         "net_buy": -1000000,
         "buy_percentage": 50.0
       },
       "foreign": {
         "buy_volume": 5000000,
         "sell_volume": 4500000,
         "buy_amount": 15000000000,
         "sell_amount": 13500000000,
         "net_buy": 500000,
         "buy_percentage": 25.0
       },
       "other": {
         "buy_volume": 0,
         "sell_volume": 0,
         "buy_amount": 0,
         "sell_amount": 0,
         "net_buy": 0,
         "buy_percentage": 0.0
       }
     },
     "summary": {
       "total_buy_volume": 20000000,
       "total_sell_volume": 20000000,
       "total_buy_amount": 60000000000,
       "total_sell_amount": 60000000000
     }
   }
   ```

4. **InvestorCategory インターフェース**
   ```typescript
   interface InvestorCategory {
     buy_volume: number;
     sell_volume: number;
     buy_amount: number;
     sell_amount: number;
     net_buy: number;
     buy_percentage: number;
   }
   ```

5. **バリデーション**
   - code が4桁数字か
   - period が有効な値（day, week, month）か

6. **エラーハンドリング**
   - code が存在しない → "指定された銘柄コード（XXXX）は存在しません"
   - 投資部門別データが存在しない → "投資部門別データが利用できません"

#### TDD テスト要件

**Red フェーズ**:
- 投資部門別データ取得 → FAIL
- パーセンテージ計算 → FAIL
- 複数期間取得 → FAIL

**Green フェーズ**:
- 実装によってすべてのテストをPASS

**Refactor フェーズ**:
- 計算ロジック最適化
- データ集計改善

#### テストケース詳細

```typescript
// test/tools/get-investment-breakdown.test.ts

1. code のみ指定（デフォルト: day）
   - params: { code: '1234' }
   ✓ 日単位の投資部門別データが返却される
   ✓ breakdown に4つの投資家カテゴリーが含まれる

2. period: week 指定
   - params: { code: '1234', period: 'week' }
   ✓ 週単位のデータが返却される

3. 売買額の合計確認
   - summary が正確に計算されている
   ✓ total_buy_amount = sum(breakdown[*].buy_amount)
   ✓ total_sell_amount = sum(breakdown[*].sell_amount)

4. パーセンテージ確認
   - buy_percentage が正しく計算されている
   ✓ buy_percentage = buy_amount / total_buy_amount × 100

5. net_buy計算
   - net_buy が正確に計算されている
   ✓ net_buy = buy_volume - sell_volume

6. 4つの投資家カテゴリーの確認
   - individual, institution, foreign, other が含まれる
   ✓ すべてのカテゴリーが返却される

7. 不正な code
   - params: { code: '123' }
   ✓ ValidationError スロー

8. 無効な period
   - params: { code: '1234', period: 'invalid' }
   ✓ ValidationError スロー

9. 存在しないコード
   - params: { code: '9999' }
   ✓ エラーメッセージ返却

10. 投資部門別データ非対応企業
    - params: { code: '5000' }
    ✓ エラーメッセージ返却: "投資部門別データが利用できません"

11. パーセンテージ合計確認
    - 全カテゴリーの buy_percentage を合計
    ✓ 合計がほぼ100%（誤差許容）

12. 複数期間の一貫性
    - 異なる period で同じ code を取得
    ✓ データの信頼性が保証される
```

#### 完了基準

- [ ] `src/tools/get-investment-breakdown.ts` が実装
- [ ] 投資部門別データ取得実装
- [ ] パーセンテージ・net_buy 計算実装
- [ ] 複数期間サポート実装
- [ ] すべてのテストケース（PASS 条件）がパス
- [ ] レスポンス形式が仕様に準拠
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   ├── types/
│   │   └── index.ts (修正、InvestmentBreakdown型追加)
│   └── tools/
│       └── get-investment-breakdown.ts (新規)
└── tests/
    └── tools/
        └── get-investment-breakdown.test.ts (新規)
```

---

### Day 22: TASK-0022: MCPツール12: get_topix_data

**[ ] TASK-0022: MCPツール12: get_topix_data**

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0022 |
| **タスク名** | MCPツール12: get_topix_data（TOPIX Index Tool） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | Phase 3 機能要件、REQ-901、REQ-701 |
| **依存タスク** | TASK-0004, TASK-0005, TASK-0011 |

#### 説明

東京証券取引所のTOPIX指数データを取得するMCPツール `get_topix_data` を実装します。指数値、騰落率、構成銘柄の変動を取得し、市場全体のトレンド分析を支援します。

#### 実装内容

1. **ツール実装 (src/tools/get-topix-data.ts)**

   関数シグネチャ:
   ```typescript
   async function getTopixData(
     params: {
       from_date?: string;     // オプション: 開始日（YYYY-MM-DD）
       to_date?: string;       // オプション: 終了日（YYYY-MM-DD）
       include_composition?: boolean; // オプション: 構成銘柄を含めるか
     }
   ): Promise<{
     index_name: string;
     current_value: number;
     change: number;
     change_percent: number;
     date: string;
     history: TopixRecord[];
     composition?: TopixComponent[];
   }>
   ```

2. **入力パラメータ**
   - `from_date`（オプション）: 開始日（YYYY-MM-DD、デフォルト: 1年前）
   - `to_date`（オプション）: 終了日（YYYY-MM-DD、デフォルト: 今日）
   - `include_composition`（オプション）: 構成銘柄を含めるか（デフォルト: false）

3. **出力形式**
   ```json
   {
     "index_name": "TOPIX",
     "current_value": 2500.50,
     "change": 25.00,
     "change_percent": 1.01,
     "date": "2025-10-29",
     "history": [
       {
         "date": "2025-10-29",
         "value": 2500.50,
         "change": 25.00,
         "change_percent": 1.01,
         "trading_volume": 1000000000
       },
       // ... 過去のデータ
     ],
     "composition": [
       {
         "rank": 1,
         "code": "1234",
         "name": "トヨタ自動車",
         "weight": 5.5,
         "price": 3050.0
       },
       // ... 上位構成銘柄
     ]
   }
   ```

4. **TopixRecord と TopixComponent インターフェース**
   ```typescript
   interface TopixRecord {
     date: string;
     value: number;
     change: number;
     change_percent: number;
     trading_volume: number;
   }

   interface TopixComponent {
     rank: number;
     code: string;
     name: string;
     weight: number;     // ウェイト（%）
     price: number;
   }
   ```

5. **バリデーション**
   - from_date, to_date が YYYY-MM-DD 形式か
   - from_date <= to_date か
   - include_composition が boolean か

6. **エラーハンドリング**
   - 指数データが利用できない → "TOPIX指数データが利用できません"
   - 日付が無効 → 日付関連のエラーメッセージ

#### TDD テスト要件

**Red フェーズ**:
- TOPIX指数取得 → FAIL
- 日付範囲フィルタ → FAIL
- 構成銘柄取得 → FAIL

**Green フェーズ**:
- 実装によってすべてのテストをPASS

**Refactor フェーズ**:
- フィルタリング最適化
- データソート改善

#### テストケース詳細

```typescript
// test/tools/get-topix-data.test.ts

1. パラメータなし（デフォルト）
   - params: {}
   ✓ 過去1年のTOPIXデータが返却される
   ✓ current_value が存在

2. 日付範囲指定
   - params: { from_date: '2025-01-01', to_date: '2025-12-31' }
   ✓ 指定範囲のデータのみが返却される

3. 構成銘柄を含める
   - params: { include_composition: true }
   ✓ composition 配列が含まれる
   ✓ composition の length > 0

4. 構成銘柄を含めない
   - params: { include_composition: false }
   ✓ composition が undefined または含まれない

5. change と change_percent の一貫性
   - change_percent が正しく計算されている
   ✓ change_percent = (change / 前営業日value) × 100

6. 履歴の時系列確認
   - history 配列が日付順にソートされている
   ✓ history[0].date <= history[1].date

7. 構成銘柄のウェイト合計
   - composition のウェイト合計が100%に近い
   ✓ sum(composition[*].weight) ≈ 100%

8. 構成銘柄のランク確認
   - rank が1から始まり連番
   ✓ composition[0].rank = 1
   ✓ composition[1].rank = 2

9. 不正な日付形式
   - params: { from_date: '2025/01/01' }
   ✓ ValidationError スロー

10. from_date > to_date
    - params: { from_date: '2025-12-31', to_date: '2025-01-01' }
    ✓ ValidationError スロー

11. 無効な include_composition
    - params: { include_composition: 'true' } （文字列）
    ✓ ValidationError スロー

12. 複数年のデータ取得
    - params: { from_date: '2020-01-01', to_date: '2025-12-31' }
    ✓ 5年分のデータが返却される
```

#### 完了基準

- [ ] `src/tools/get-topix-data.ts` が実装
- [ ] TOPIX指数データ取得実装
- [ ] 日付範囲フィルタリング実装
- [ ] 構成銘柄取得実装（オプション）
- [ ] すべてのテストケース（PASS 条件）がパス
- [ ] レスポンス形式が仕様に準拠
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   ├── types/
│   │   └── index.ts (修正、TopixData型追加)
│   └── tools/
│       └── get-topix-data.ts (新規)
└── tests/
    └── tools/
        └── get-topix-data.test.ts (新規)
```

---

### Day 23: TASK-0023: パフォーマンス最適化

**[ ] TASK-0023: パフォーマンス最適化**

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0023 |
| **タスク名** | パフォーマンス最適化（Performance Optimization） |
| **推定時間** | 8時間 |
| **種別** | DIRECT |
| **関連要件** | NFR-001, NFR-002, NFR-003 |
| **依存タスク** | TASK-0004, TASK-0019～TASK-0022 |

#### 説明

Phase 3 で実装した4つの高度な分析ツールを含むすべてのツールのパフォーマンスを最適化します。レスポンス時間削減、メモリ使用量最適化、API呼び出し削減を実現します。

#### 実装内容

1. **レスポンス時間最適化**

   対象エリア:
   - APIリクエスト最適化（バッチ処理、並列処理）
   - データフィルタリング最適化（効率的なアルゴリズム）
   - ソート最適化（大規模データセット対応）

   実装詳細:
   ```typescript
   // 並列APIリクエスト例
   async function getCompanyDataBatch(codes: string[]) {
     const promises = codes.map(code => getCompanyInfo(code));
     return Promise.all(promises); // 複数リクエストを並列実行
   }

   // 効率的なフィルタリング例
   function filterByDateRange(data: any[], from: string, to: string) {
     const fromTime = new Date(from).getTime();
     const toTime = new Date(to).getTime();
     return data.filter(item => {
       const itemTime = new Date(item.date).getTime();
       return itemTime >= fromTime && itemTime <= toTime;
     });
   }
   ```

2. **メモリ使用量最適化**

   対象エリア:
   - 大規模データセットのストリーミング処理
   - 中間オブジェクトの生成最小化
   - オブジェクトの早期解放

   実装詳細:
   ```typescript
   // ストリーミング処理例
   async function* streamLargeDataset(code: string) {
     const pageSize = 100;
     for (let page = 0; ; page++) {
       const data = await fetchPage(code, page, pageSize);
       if (data.length === 0) break;
       yield data;
     }
   }

   // メモリ効率的な処理
   for await (const chunk of streamLargeDataset('1234')) {
     processChunk(chunk); // メモリに保持しながら処理
   }
   ```

3. **API呼び出し削減**

   対象エリア:
   - 重複リクエストの排除
   - データの再利用（キャッシング）
   - 不要なAPI呼び出しの削除

4. **ボトルネック特定と改善**

   分析対象:
   - [`src/api/j-quants-client.ts`] - HTTP通信層
   - [`src/tools/*.ts`] - ツール実装層
   - [`src/utils/*.ts`] - ユーティリティ層

   計測内容:
   - APIリクエスト時間
   - データ処理時間
   - ツール実行総時間

#### 最適化目標

| 項目 | 目標値 | 現状値 | 改善率 |
|------|-------|--------|--------|
| 単一ツール実行時間 | < 5秒 | TBD | - |
| サーバー起動時間 | < 10秒 | TBD | - |
| メモリ使用量（起動後） | < 500MB | TBD | - |
| 複数ツール並列実行 | < 15秒 | TBD | - |

#### 完了基準

- [ ] すべてのツールが 5秒以内に完了
- [ ] サーバー起動が 10秒以内に完了
- [ ] メモリ使用量が 500MB 以下
- [ ] パフォーマンスレポートが作成
- [ ] ボトルネック分析が完了

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   ├── api/
│   │   └── j-quants-client.ts (修正、パフォーマンス改善)
│   └── tools/
│       ├── get-listed-companies.ts (修正)
│       ├── get-stock-price.ts (修正)
│       ├── get-financial-statements.ts (修正)
│       ├── get-company-info.ts (修正)
│       ├── get-dividend-info.ts (修正)
│       ├── get-trading-calendar.ts (修正)
│       ├── search-companies.ts (修正)
│       ├── get-sector-stocks.ts (修正)
│       ├── get-margin-trading.ts (修正)
│       ├── get-short-selling.ts (修正)
│       ├── get-investment-breakdown.ts (修正)
│       └── get-topix-data.ts (修正)
└── docs/
    └── performance-report.md (新規)
```

---

### Day 24: TASK-0024: レート制限対応強化

**[ ] TASK-0024: レート制限対応強化**

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0024 |
| **タスク名** | レート制限対応強化（Rate Limiting Enhancement） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | REQ-605、NFR-001 |
| **依存タスク** | TASK-0004, TASK-0005, TASK-0011 |

#### 説明

API呼び出しのレート制限を管理する `RateLimiter` クラスを実装します。J-Quants APIのレート制限ポリシーに準拠し、429エラーを効果的に回避します。

#### 実装内容

1. **レート制限マネージャー (src/utils/rate-limiter.ts)**

   主要メソッド:
   - `constructor(options?: RateLimiterOptions)` - 初期化
   - `async executeWithRateLimit<T>(fn: () => Promise<T>): Promise<T>` - レート制限付き実行
   - `getRemainingRequests(): number` - 残りリクエスト数
   - `getResetTime(): Date` - リセット時刻
   - `updateFromHeaders(headers: Record<string, string>): void` - ヘッダーから制限情報更新

2. **レート制限オプション**
   ```typescript
   interface RateLimiterOptions {
     requestsPerMinute?: number;      // 1分あたりのリクエスト数（デフォルト: 300）
     requestsPerHour?: number;        // 1時間あたりのリクエスト数（デフォルト: 10000）
     retryOnRateLimit?: boolean;      // 429時にリトライするか（デフォルト: true）
     backoffStrategy?: 'exponential' | 'linear'; // バックオフ戦略
   }
   ```

3. **リクエスト数管理**
   ```typescript
   interface RequestCounter {
     minute: {
       count: number;
       resetTime: number;
     };
     hour: {
       count: number;
       resetTime: number;
     };
   }
   ```

4. **429エラーハンドリング**
   - Retry-After ヘッダーから待機時間を取得
   - 待機後に自動リトライ
   - リトライ失敗時は適切なエラーメッセージ返却

5. **レート制限情報の通知**
   - 残りリクエスト数が少ないときに警告ログ
   - リセット時刻を記録
   - 日次レポート出力

#### TDD テスト要件

**Red フェーズ**:
- リクエスト数カウント → FAIL
- レート制限判定 → FAIL
- 429エラー処理 → FAIL

**Green フェーズ**:
- 実装によってすべてのテストをPASS

**Refactor フェーズ**:
- キューイング ロジック改善
- リトライ戦略最適化

#### テストケース詳細

```typescript
// test/utils/rate-limiter.test.ts

1. リクエスト数カウント
   - 複数のリクエストを実行
   ✓ getRemainingRequests() が正確に返却される

2. レート制限判定（1分単位）
   - 300リクエストを実行
   ✓ 300個目のリクエストが成功
   ✓ 301個目のリクエストが待機

3. レート制限判定（1時間単位）
   - 10000リクエストを実行
   ✓ 時間制限に達する

4. 429エラーのリトライ
   - API が429を返却
   ✓ 自動的に待機してリトライ
   ✓ リトライ後に成功

5. Retry-After ヘッダー対応
   - Retry-After: 60 ヘッダーあり
   ✓ 60秒待機してリトライ

6. リセット時刻の計算
   - getResetTime() が正確に返却される
   ✓ リセット時刻が正確

7. 複数リクエストの並列実行
   - 複数のリクエストを並列実行
   ✓ レート制限を順守
   ✓ すべてのリクエストが完了

8. リセット後の復帰
   - 制限に達したが待機してリセット
   ✓ リセット後、新しいリクエストが可能

9. オプション設定（カスタム制限値）
   - options: { requestsPerMinute: 100 }
   ✓ カスタム制限が適用される

10. 警告ログ出力
    - 残りリクエスト数が少ないとき
    ✓ 警告ログが出力される（例: 残り50件以下）
```

#### 完了基準

- [ ] `src/utils/rate-limiter.ts` が実装
- [ ] リクエスト数カウント実装
- [ ] 429エラーハンドリング実装
- [ ] Retry-After ヘッダー対応実装
- [ ] すべてのテストケース（PASS 条件）がパス
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   └── utils/
│       ├── rate-limiter.ts (新規)
│       └── j-quants-client.ts (修正、レート制限統合)
└── tests/
    └── utils/
        └── rate-limiter.test.ts (新規)
```

---

### Day 25: TASK-0025: 監視・メトリクス実装

**[ ] TASK-0025: 監視・メトリクス実装**

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0025 |
| **タスク名** | 監視・メトリクス実装（Monitoring & Metrics） |
| **推定時間** | 8時間 |
| **種別** | DIRECT |
| **関連要件** | REQ-902、NFR-001, NFR-002 |
| **依存タスク** | TASK-0005, TASK-0017, TASK-0023 |

#### 説明

パフォーマンス監視とメトリクス記録のための `Metrics` クラスを実装します。APIレスポンスタイム、ツール実行時間、メモリ使用量、エラー率等を計測・記録し、パフォーマンス分析を支援します。

#### 実装内容

1. **メトリクス記録マネージャー (src/utils/metrics.ts)**

   主要メソッド:
   - `constructor(options?: MetricsOptions)` - 初期化
   - `recordApiCall(endpoint: string, duration: number, status: number): void` - API呼び出し記録
   - `recordToolExecution(toolName: string, duration: number, success: boolean): void` - ツール実行記録
   - `recordMemoryUsage(): void` - メモリ使用量記録
   - `recordError(errorCode: string, toolName?: string): void` - エラー記録
   - `getMetrics(): MetricsSnapshot` - メトリクス取得
   - `exportMetrics(format: 'json' | 'csv'): string` - メトリクスエクスポート
   - `clearMetrics(): void` - メトリクスクリア

2. **メトリクスオプション**
   ```typescript
   interface MetricsOptions {
     enableDetailedLogging?: boolean;  // 詳細ログを有効化
     metricsInterval?: number;         // メトリクス記録間隔（ms）
     maxHistorySize?: number;          // 履歴最大保持数
     exportPath?: string;              // エクスポート先パス
   }
   ```

3. **メトリクススナップショット**
   ```typescript
   interface MetricsSnapshot {
     timestamp: number;
     apiCalls: {
       total: number;
       byEndpoint: Record<string, number>;
       avgDuration: number;
       errorRate: number;
     };
     toolExecution: {
       total: number;
       byTool: Record<string, ToolMetrics>;
       avgDuration: number;
       successRate: number;
     };
     memory: {
       current: number;
       peak: number;
       average: number;
     };
     errors: {
       total: number;
       byCode: Record<string, number>;
     };
   }

   interface ToolMetrics {
     count: number;
     avgDuration: number;
     successCount: number;
     failureCount: number;
     lastExecutedAt: number;
   }
   ```

4. **リアルタイム監視**
   - 1分単位でメトリクスを計算
   - 異常値検出（平均の2倍以上）
   - アラート通知

5. **メトリクス出力**
   ```
   ===== Metrics Report (2025-10-29 15:30:00) =====

   API Calls:
   - Total: 150
   - Avg Duration: 234ms
   - Error Rate: 2.3%

   Tool Execution:
   - get_stock_price: 50 calls, avg 234ms, success rate 98%
   - get_listed_companies: 30 calls, avg 456ms, success rate 100%
   - search_companies: 20 calls, avg 345ms, success rate 95%

   Memory Usage:
   - Current: 250MB
   - Peak: 320MB
   - Average: 270MB

   Errors:
   - EDGE-001: 3
   - EDGE-051: 2
   - TIMEOUT: 2

   Performance Issues:
   - ⚠️ get_sector_stocks taking 2x average (1200ms vs 600ms avg)
   ```

#### 完了基準

- [ ] `src/utils/metrics.ts` が実装
- [ ] API呼び出し記録実装
- [ ] ツール実行時間記録実装
- [ ] メモリ使用量監視実装
- [ ] メトリクスエクスポート実装
- [ ] リアルタイム監視実装

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   └── utils/
│       └── metrics.ts (新規)
├── src/
│   └── index.ts (修正、メトリクス統合)
└── metrics/
    ├── daily/ (日別レポート)
    └── hourly/ (時間別レポート)
```

---

### Day 26: TASK-0026: Phase 3 統合テスト

**[ ] TASK-0026: Phase 3 統合テスト**

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0026 |
| **タスク名** | Phase 3 統合テスト（Phase 3 Integration Testing） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | NFR-001, NFR-002, NFR-003 |
| **依存タスク** | TASK-0019～TASK-0025 |

#### 説明

Phase 3 で実装したすべてのコンポーネント（4つの高度な分析ツール、パフォーマンス最適化、レート制限、監視機能）の統合テストを実施します。全体的な動作確認とパフォーマンス検証を行い、Phase 3 完了を確認します。

#### 実装内容

1. **統合テストスイート実装**

   テストカバレッジ:
   - 12つのMCPツール（Phase 1 の4つ + Phase 2 の4つ + Phase 3 の4つ）
   - パフォーマンス最適化（レスポンス時間、メモリ使用量）
   - レート制限管理（429エラー回避）
   - 監視・メトリクス（記録と出力）

2. **ツール機能テスト**
   ```typescript
   describe('Phase 3 Integration Tests', () => {
     // Tool tests (12つのツール)
     describe('get_listed_companies', () => { ... })
     describe('get_stock_price', () => { ... })
     describe('get_financial_statements', () => { ... })
     describe('get_company_info', () => { ... })
     describe('get_dividend_info', () => { ... })
     describe('get_trading_calendar', () => { ... })
     describe('search_companies', () => { ... })
     describe('get_sector_stocks', () => { ... })
     describe('get_margin_trading', () => { ... })
     describe('get_short_selling', () => { ... })
     describe('get_investment_breakdown', () => { ... })
     describe('get_topix_data', () => { ... })

     // Performance tests
     describe('Performance', () => { ... })

     // Rate limiting tests
     describe('Rate Limiting', () => { ... })

     // Metrics tests
     describe('Monitoring & Metrics', () => { ... })
   })
   ```

3. **テストケース**

   **ツール機能テスト** (各ツール 5～10 ケース):
   - 正常系テスト
   - エラー系テスト
   - エッジケーステスト
   - パラメータバリデーションテスト

   **パフォーマンステスト** (15+ ケース):
   - 単一ツール実行時間 < 5 秒
   - サーバー起動時間 < 10 秒
   - メモリ使用量 < 500MB
   - 複数ツール並列実行
   - メモリリーク検出

   **レート制限テスト** (10+ ケース):
   - リクエスト数カウント
   - 429エラーハンドリング
   - Retry-After 対応
   - 並列リクエスト制限

   **監視・メトリクステスト** (8+ ケース):
   - APIレスポンスタイム記録
   - ツール実行時間記録
   - メモリ使用量記録
   - エラー率計算
   - メトリクスエクスポート

4. **テスト実施順序**

   ```
   1. ユニットテスト確認
      - TASK-0019～0022 の各ツールテストが PASS
      - TASK-0024 のレート制限テストが PASS
      - TASK-0025 のメトリクステストが PASS

   2. 統合テスト実施
      - MCPサーバー起動テスト
      - 12つのツール実行テスト
      - パフォーマンステスト
      - レート制限テスト
      - 監視機能テスト

   3. エンドツーエンドテスト（オプション）
      - Claude Desktop との実際の連携
      - 複合ツール利用シナリオ
   ```

5. **テスト結果レポート**
   ```
   Phase 3 Integration Test Report
   ================================

   Test Execution Date: 2025-10-29
   Test Environment: Node.js 20 LTS

   Overall Results:
   - Total Tests: 200+
   - Passed: 200
   - Failed: 0
   - Skipped: 0
   - Success Rate: 100%

   Tool Tests:
   - All 12 tools: PASS

   Performance Tests:
   - Average response time: 450ms
   - Max response time: 4800ms
   - Memory usage: 280MB
   - No memory leaks detected

   Rate Limiting Tests:
   - All rate limit scenarios: PASS

   Metrics Tests:
   - All metrics recording: PASS

   Code Quality:
   - TypeScript strict mode: PASS
   - ESLint: 0 errors
   ```

#### テストケース詳細

```typescript
// test/integration/phase3.test.ts

describe('Phase 3 Integration Tests', () => {

  // Tool Tests (Phases 1, 2, 3)
  describe('Tool Integration', () => {
    test('All 12 tools are registered', async () => {
      const tools = server.getRegisteredTools();
      expect(tools.length).toBe(12);
      expect(tools.map(t => t.name)).toContain('get_margin_trading');
      expect(tools.map(t => t.name)).toContain('get_short_selling');
      expect(tools.map(t => t.name)).toContain('get_investment_breakdown');
      expect(tools.map(t => t.name)).toContain('get_topix_data');
    });

    test('get_margin_trading returns valid data', async () => {
      const result = await server.callTool('get_margin_trading', { code: '1234' });
      expect(result).toHaveProperty('margin_balance');
      expect(result.margin_balance).toHaveProperty('buy_position');
      expect(result).toHaveProperty('trend');
    });

    test('get_short_selling returns valid data', async () => {
      const result = await server.callTool('get_short_selling', { code: '1234' });
      expect(result).toHaveProperty('current_status');
      expect(result.current_status).toHaveProperty('short_position');
    });

    test('get_investment_breakdown returns valid data', async () => {
      const result = await server.callTool('get_investment_breakdown', { code: '1234' });
      expect(result).toHaveProperty('breakdown');
      expect(result.breakdown).toHaveProperty('individual');
      expect(result.breakdown).toHaveProperty('institution');
    });

    test('get_topix_data returns valid data', async () => {
      const result = await server.callTool('get_topix_data', {});
      expect(result).toHaveProperty('current_value');
      expect(result).toHaveProperty('history');
    });
  });

  // Performance Tests
  describe('Performance', () => {
    test('All tools respond < 5 seconds', async () => {
      const tools = ['get_listed_companies', 'get_stock_price', /* ... */];
      for (const tool of tools) {
        const start = performance.now();
        await server.callTool(tool, /* params */);
        const elapsed = performance.now() - start;
        expect(elapsed).toBeLessThan(5000);
      }
    });

    test('Server startup < 10 seconds', async () => {
      const start = performance.now();
      await startServer();
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(10000);
    });

    test('Memory usage < 500MB', async () => {
      const memory = process.memoryUsage().heapUsed / 1024 / 1024;
      expect(memory).toBeLessThan(500);
    });

    test('No memory leaks after repeated calls', async () => {
      const measurements = [];
      for (let i = 0; i < 20; i++) {
        const memory = process.memoryUsage().heapUsed / 1024 / 1024;
        await server.callTool('get_stock_price', { code: '1234' });
        measurements.push(memory);
      }
      // Check that memory doesn't continuously increase
      const isMemoryLeaking = measurements[15] > measurements[5] + 50;
      expect(isMemoryLeaking).toBeFalsy();
    });
  });

  // Rate Limiting Tests
  describe('Rate Limiting', () => {
    test('Rate limiter prevents excessive requests', async () => {
      const rateLimiter = new RateLimiter({ requestsPerMinute: 10 });
      let successCount = 0;
      let blockedCount = 0;

      for (let i = 0; i < 15; i++) {
        try {
          await rateLimiter.executeWithRateLimit(async () => 'success');
          successCount++;
        } catch (error) {
          blockedCount++;
        }
      }

      expect(successCount).toBe(10);
      expect(blockedCount).toBeGreaterThan(0);
    });

    test('429 error triggers automatic retry', async () => {
      const result = await server.callTool('get_listed_companies', {});
      expect(result).toBeDefined();
    });
  });

  // Metrics Tests
  describe('Monitoring & Metrics', () => {
    test('Metrics records API calls', async () => {
      const metrics = getMetrics();
      expect(metrics.apiCalls.total).toBeGreaterThan(0);
      expect(metrics.apiCalls.avgDuration).toBeGreaterThan(0);
    });

    test('Metrics records tool execution times', async () => {
      await server.callTool('get_stock_price', { code: '1234' });
      const metrics = getMetrics();
      expect(metrics.toolExecution.byTool['get_stock_price']).toBeDefined();
    });

    test('Metrics records memory usage', async () => {
      const metrics = getMetrics();
      expect(metrics.memory.current).toBeGreaterThan(0);
      expect(metrics.memory.peak).toBeGreaterThan(0);
    });

    test('Metrics can be exported', async () => {
      const json = exportMetrics('json');
      expect(json).toBeDefined();
      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('apiCalls');
    });
  });
});
```

#### 完了基準

- [ ] すべてのユニットテスト（TASK-0019～0025）が PASS
- [ ] 統合テスト（200+ ケース）が PASS
- [ ] パフォーマンスが要件を満たしている（レスポンス < 5秒）
- [ ] メモリ使用量が 500MB 以下
- [ ] レート制限が正常に動作
- [ ] 監視・メトリクスが正常に動作
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   └── index.ts (修正、12つのツール登録確認)
└── tests/
    └── integration/
        └── phase3.test.ts (新規、統合テスト)
```

---

## Phase 3 全体統合テスト

**実施日**: Day 26 完了後
**実施者**: 開発チーム
**テスト環境**: ローカル環境

### 統合テスト計画

#### 1. 環境セットアップ確認
- [ ] Node.js 20 LTS インストール確認
- [ ] Phase 1, 2 のコンポーネントが正常に動作
- [ ] Phase 3 での追加パッケージがインストール確認
- [ ] 環境変数が正確に設定

#### 2. ツール機能テスト
- [ ] 12つのMCPツール全て実行可能
- [ ] 各ツールが正確なデータを返却
- [ ] エラーハンドリング機能正常

#### 3. パフォーマンステスト
- [ ] 単一ツール実行: < 5秒
- [ ] サーバー起動: < 10秒
- [ ] メモリ使用量: < 500MB
- [ ] メモリリークなし

#### 4. 品質テスト
- [ ] 全テストケース PASS
- [ ] TypeScript strict mode エラーなし
- [ ] ESLint エラーなし

#### 5. ドキュメント確認
- [ ] Phase 3 タスク完了書
- [ ] パフォーマンスレポート
- [ ] 監視・メトリクスガイド

### Phase 3 完了判定基準

✅ すべての以下の条件が満たされたら Phase 3 完了

1. **実装完了**
   - [ ] TASK-0019～TASK-0026 すべて完了
   - [ ] 4つの高度な分析ツール実装完成
   - [ ] パフォーマンス最適化完成
   - [ ] レート制限・監視機能実装完成

2. **テスト完了**
   - [ ] ユニットテスト: 全テストケース PASS
   - [ ] 統合テスト: 12つのツール動作確認完了
   - [ ] パフォーマンステスト: 全要件満たし確認

3. **ドキュメント完成**
   - [ ] Phase 3 タスク完了書
   - [ ] パフォーマンスレポート
   - [ ] 監視・メトリクスガイド

4. **要件充足**
   - [ ] 4つの高度な分析ツール実装完了
   - [ ] パフォーマンス最適化（レスポンス < 5秒）実現
   - [ ] レート制限対応完了
   - [ ] 監視・メトリクス機能実装完了

---

## Phase 3 ドキュメント成果物

Phase 3 完了時に作成すべきドキュメント:

1. **Phase 3 完了報告書** (`docs/tasks/j-quants-phase3-completion.md`)
   - 実装概要
   - タスク完了状況
   - テスト結果報告
   - パフォーマンス測定結果

2. **パフォーマンスレポート** (`docs/performance-report-phase3.md`)
   - レスポンス時間測定結果
   - メモリ使用量分析
   - ボトルネック分析
   - 改善効果測定

3. **監視・メトリクスガイド** (`docs/monitoring-guide.md`)
   - メトリクス記録方法
   - レポート確認方法
   - アラート設定
   - トラブルシューティング

4. **高度な分析ツール仕様書** (`docs/advanced-tools-spec.md`)
   - 4つの高度な分析ツール仕様詳細
   - 入出力パラメータ定義
   - レスポンス形式定義

5. **レート制限設計書** (`docs/rate-limiting-design.md`)
   - レート制限アーキテクチャ
   - 429エラー対応戦略
   - Retry-After 処理詳細

---

## 次フェーズへの移行

Phase 3 完了後、以下を Phase 4 へ引き継ぎ:

1. **完成したコンポーネント**
   - 12つのMCPツール（Phase 1, 2, 3 合計）
   - パフォーマンス最適化完成
   - レート制限・監視機能完成

2. **既知の制約・注意事項**
   - J-Quants API フリープラン制約
   - レート制限の詳細
   - パフォーマンス境界値

3. **Phase 4 で実施すべきこと**
   - 単体テスト網羅的実装
   - E2Eテスト実装
   - ドキュメント最終化
   - リリース準備

---

**最終更新**: 2025-10-29
**作成者**: Claude Code
**ステータス**: 完成・実装待ち

---

## 参考資料

- [J-Quants 要件定義書](../spec/j-quants-requirements.md)
- [J-Quants アーキテクチャ設計書](../design/architecture.md)
- [J-Quants Phase 1 詳細タスク計画書](./j-quants-phase1.md)
- [J-Quants Phase 2 詳細タスク計画書](./j-quants-phase2.md)
- [J-Quants 全体タスク概要](./j-quants-overview.md)
- [技術スタック](../../../../docs/tech-stack.md)
