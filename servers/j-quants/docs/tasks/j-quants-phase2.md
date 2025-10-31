# Phase 2: 拡張機能実装 - 詳細タスク計画書

## Phase 2 概要

**フェーズ名**: Phase 2: 拡張機能実装（Extended Features）
**期間**: 8日間（64時間）
**目標**: 4つの追加MCPツール実装、エラーメッセージの詳細化、ロギング・デバッグ機能の強化、パフォーマンス最適化を実施する
**タスク数**: 8タスク（TASK-0011～TASK-0018）

### Phase 2 成果物

1. ✅ 4つの追加MCPツール実装完成
   - get_dividend_info（配当情報取得）
   - get_trading_calendar（取引カレンダー取得）
   - search_companies（企業検索）
   - get_sector_stocks（業種別銘柄一覧）
2. ✅ エラーメッセージ詳細化完成（EDGE-001～EDGE-302）
3. ✅ ロギング・デバッグ機能強化完成
4. ✅ パフォーマンス最適化完成
5. ✅ Phase 2 統合テスト実施完了
6. ✅ Phase 2 ドキュメント完成

### Phase 2 関連要件

**拡張ツール要件**: REQ-901, REQ-902 に基づく拡張機能
**エラー処理要件**: EDGE-001～EDGE-302（詳細なエラーメッセージ）
**ロギング・デバッグ要件**: REQ-901, REQ-902（デバッグモード、レスポンスタイム計測）
**パフォーマンス要件**: NFR-001, NFR-002, NFR-003（5秒以内、起動10秒以内、メモリ500MB以下）

---

## 週単位実施計画

### 第3週：拡張ツール実装（Day 11-15）

| 日付 | タスクID | タスク名 | 時間 | 種別 | 概要 |
|------|---------|---------|------|------|------|
| Day 11 | TASK-0011 | リトライロジック強化 | 8h | TDD | src/utils/retry.ts拡張、Exponential backoff詳細実装 |
| Day 12 | TASK-0012 | MCPツール5: get_dividend_info | 8h | TDD | 配当情報取得ツール実装 |
| Day 13 | TASK-0013 | MCPツール6: get_trading_calendar | 8h | TDD | 取引カレンダー取得ツール実装 |
| Day 14 | TASK-0014 | MCPツール7: search_companies | 8h | TDD | 企業検索ツール実装 |
| Day 15 | TASK-0015 | MCPツール8: get_sector_stocks | 8h | TDD | 業種別銘柄一覧ツール実装 |

**第3週成果**: 4つの追加ツール実装完成

### 第4週：エラー処理・最適化・統合（Day 16-18）

| 日付 | タスクID | タスク名 | 時間 | 種別 | 概要 |
|------|---------|---------|------|------|------|
| Day 16 | TASK-0016 | エラーメッセージ詳細化 | 8h | DIRECT | EDGE-001～EDGE-302実装、日本語詳細メッセージ |
| Day 17 | TASK-0017 | デバッグ機能強化 | 8h | DIRECT | logger.ts拡張、デバッグモード、レスポンスタイム計測 |
| Day 18 | TASK-0018 | Phase 2 統合テスト | 8h | TDD | 8つのツール統合テスト、パフォーマンス検証 |

**第4週成果**: 詳細エラー処理完成、デバッグ機能完成、全統合テスト完了

---

## 日別詳細タスク定義

### Day 11: TASK-0011: リトライロジック強化

**[ ] TASK-0011: リトライロジック強化**

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0011 |
| **タスク名** | リトライロジック強化（Retry Logic Enhancement） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | REQ-601, REQ-605, NFR-001 |
| **依存タスク** | TASK-0004, TASK-0005 |

#### 説明

Phase 1で実装した基本的なリトライロジックを拡張します。Exponential backoffの詳細実装、レート制限への対応、リトライ戦略の最適化を行い、APIアクセスの信頼性を大幅に向上させます。

#### 実装内容

1. **リトライユーティリティ拡張 (src/utils/retry.ts)**

   主要メソッド:
   - `sleep(ms: number): Promise<void>` - 遅延関数
   - `calculateBackoffDelay(attempt: number, baseDelay: number = 1000, maxDelay: number = 30000): number` - Exponential backoff計算（最大30秒）
   - `retryableRequest<T>(fn: () => Promise<T>, maxRetries: number = 3, strategy?: RetryStrategy): Promise<T>` - リトライ関数（戦略パターン）
   - `isRetryableError(error: any): boolean` - リトライ可能エラー判定
   - `getRetryDelay(error: any, attempt: number): number` - エラータイプに応じた遅延計算

2. **リトライ戦略パターン**
   ```typescript
   interface RetryStrategy {
     maxRetries: number;           // 最大リトライ回数（デフォルト: 3）
     baseDelay: number;            // 基本遅延時間（デフォルト: 1000ms）
     maxDelay: number;             // 最大遅延時間（デフォルト: 30000ms）
     backoffMultiplier: number;    // バックオフ乗数（デフォルト: 2）
     jitter: boolean;              // ジッター追加有効（デフォルト: true）
     retryableStatuses: number[];  // リトライ対象HTTPステータス
   }
   ```

3. **リトライ可能エラーの判定**
   - 5xx（500-599） - サーバーエラー
   - 429 - レート制限
   - タイムアウト
   - ネットワークエラー
   - リトライ不可能: 4xx（400-499）、その他の恒久的エラー

4. **レート制限への対応**
   - Retry-After ヘッダーの確認
   - 429エラー時の待機時間計算
   - Exponential backoff の上限設定（30秒）

5. **ジッター機能**
   - ランダムな遅延を追加し、同時リトライを回避
   - `delay = (baseDelay * (2^attempt)) + random(0, jitterRange)`

#### TDD テスト要件

**Red フェーズ**:
- Sleep関数 → FAIL
- Backoff計算 → FAIL
- ジッター追加 → FAIL
- リトライ戦略 → FAIL

**Green フェーズ**:
- 実装によってすべてのテストをPASS

**Refactor フェーズ**:
- リトライ戦略の設定整理
- エラー判定ロジックの最適化

#### テストケース詳細

```typescript
// test/utils/retry.test.ts

1. sleep() - 遅延動作
   - sleep(100) 実行
   ✓ 100ms以上待機

2. calculateBackoffDelay() - Exponential backoff計算
   - 1回目: 1000ms
   - 2回目: 2000ms
   - 3回目: 4000ms
   ✓ 各回の遅延が正確に計算される

3. calculateBackoffDelay() - 上限設定
   - 最大遅延: 30000ms を超えない
   ✓ 30000ms以下に制限される

4. calculateBackoffDelay() - ジッター追加
   - 複数回実行して遅延時間が異なる
   ✓ ジッターが適用されている（完全一致しない）

5. isRetryableError() - 5xx エラー
   - error: { status: 500 }
   ✓ true を返却

6. isRetryableError() - 429 レート制限
   - error: { status: 429 }
   ✓ true を返却

7. isRetryableError() - 4xx エラー
   - error: { status: 400 }
   ✓ false を返却

8. retryableRequest() - 成功時
   - 1回目で成功
   ✓ 結果が返却される

9. retryableRequest() - リトライ後成功
   - 1回目: 500 エラー
   - 2回目: 200 OK
   ✓ 2回目で成功し、適切な遅延後に実行

10. retryableRequest() - 最大リトライ超過
    - 3回すべて失敗
    ✓ エラーがスロー

11. getRetryDelay() - 429 エラー時
    - Retry-After: 60 ヘッダーあり
    ✓ 60秒の遅延を返却

12. getRetryDelay() - Exponential backoff
    - Retry-After ヘッダーなし
    ✓ Exponential backoff遅延を返却
```

#### 完了基準

- [ ] `src/utils/retry.ts` が完成し、Exponential backoffが実装
- [ ] レート制限（429）対応が実装
- [ ] ジッター機能が実装
- [ ] 最大遅延30秒の上限が設定
- [ ] すべてのテストケース（PASS 条件）がパス
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   └── utils/
│       └── retry.ts (修正、拡張実装)
└── tests/
    └── utils/
        └── retry.test.ts (修正、テスト追加)
```

---

### Day 12: TASK-0012: MCPツール5: get_dividend_info

**[ ] TASK-0012: MCPツール5: get_dividend_info**

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0012 |
| **タスク名** | MCPツール5: get_dividend_info（Dividend Information Tool） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | Phase 2 機能要件、REQ-701 |
| **依存タスク** | TASK-0004, TASK-0005, TASK-0011 |

#### 説明

指定銘柄の配当情報を取得するMCPツール `get_dividend_info` を実装します。過去数年分の配当実績と配当利回りを取得し、投資判断の参考情報として提供します。

#### 実装内容

1. **ツール実装 (src/tools/get-dividend-info.ts)**

   関数シグネチャ:
   ```typescript
   async function getDividendInfo(
     params: {
       code: string;         // 必須: 銘柄コード（4桁数字）
       years?: number;       // オプション: 取得年数（デフォルト: 5年）
     }
   ): Promise<{
     code: string;
     name: string;
     current_price: number;
     dividend_yield: number;
     dividends: DividendRecord[];
   }>
   ```

2. **入力パラメータ**
   - `code`（必須）: 銘柄コード（4桁数字）
   - `years`（オプション）: 取得対象年数（1～10年、デフォルト: 5年）

3. **出力形式**
   ```json
   {
     "code": "1234",
     "name": "トヨタ自動車",
     "current_price": 3050.0,
     "dividend_yield": 3.5,
     "dividends": [
       {
         "fiscal_year": "2024",
         "dividend_per_share": 250.0,
         "ex_dividend_date": "2024-09-27",
         "payment_date": "2024-12-20"
       },
       // ... 過去分
     ]
   }
   ```

4. **データマッピング**
   - J-Quants API から配当データを取得
   - 現在株価を get_stock_price で取得
   - 配当利回り = 年間配当金 / 現在株価 × 100（%）
   - fiscal_year で降順ソート

5. **バリデーション**
   - code が4桁数字か
   - years が1～10の範囲か

6. **エラーハンドリング**
   - code が存在しない → "指定された銘柄コード（XXXX）は存在しません"
   - 配当情報がない → "配当情報が利用できません"

#### TDD テスト要件

**Red フェーズ**:
- 配当情報取得 → FAIL
- 複数年取得 → FAIL
- 配当利回り計算 → FAIL

**Green フェーズ**:
- 実装によってすべてのテストをPASS

**Refactor フェーズ**:
- 計算ロジック最適化
- エラーメッセージ改善

#### テストケース詳細

```typescript
// test/tools/get-dividend-info.test.ts

1. code のみ指定（デフォルト5年）
   - params: { code: '1234' }
   ✓ 過去5年の配当情報が返却される
   ✓ dividends 配列に5件が含まれる

2. years パラメータ指定
   - params: { code: '1234', years: 3 }
   ✓ 過去3年の配当情報が返却される
   ✓ dividends 配列に3件が含まれる

3. 配当利回り計算
   - current_price: 3000, 年間配当: 105
   ✓ dividend_yield: 3.5（= 105/3000*100）

4. fiscal_year 降順ソート
   - 複数年のデータを取得
   ✓ dividends[0].fiscal_year > dividends[1].fiscal_year

5. 不正な code
   - params: { code: '123' }
   ✓ ValidationError スロー

6. 無効な years パラメータ
   - params: { code: '1234', years: 15 }
   ✓ ValidationError スロー: "取得年数は1～10年で指定してください"

7. 存在しないコード
   - params: { code: '9999' }
   ✓ エラーメッセージ返却

8. 配当情報がない企業
   - params: { code: '5000' }（仮想的な新興企業）
   ✓ エラーメッセージ返却: "配当情報が利用できません"

9. current_price と dividend_yield の一貫性
   - get_stock_price で取得した価格と整合性確認
   ✓ 計算結果が一致

10. 複数企業の配当情報
    - 高配当銘柄と低配当銘柄を比較
    ✓ 各企業の dividend_yield が異なる
```

#### 完了基準

- [ ] `src/tools/get-dividend-info.ts` が実装
- [ ] 配当データ取得とマッピング実装
- [ ] 配当利回り計算実装
- [ ] 年数フィルタリング実装
- [ ] すべてのテストケース（PASS 条件）がパス
- [ ] レスポンス形式が仕様に準拠
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   ├── types/
│   │   └── index.ts (修正、DividendRecord型追加)
│   └── tools/
│       └── get-dividend-info.ts (新規)
└── tests/
    └── tools/
        └── get-dividend-info.test.ts (新規)
```

---

### Day 13: TASK-0013: MCPツール6: get_trading_calendar

**[ ] TASK-0013: MCPツール6: get_trading_calendar**

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0013 |
| **タスク名** | MCPツール6: get_trading_calendar（Trading Calendar Tool） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | Phase 2 機能要件、REQ-701 |
| **依存タスク** | TASK-0004, TASK-0005 |

#### 説明

東京証券取引所の取引カレンダーを取得するMCPツール `get_trading_calendar` を実装します。営業日・休場日・イベント（大型連休）を取得し、株価データ取得時の日付妥当性確認に活用できます。

#### 実装内容

1. **ツール実装 (src/tools/get-trading-calendar.ts)**

   関数シグネチャ:
   ```typescript
   async function getTradingCalendar(
     params: {
       from_date?: string;   // オプション: 開始日（YYYY-MM-DD）
       to_date?: string;     // オプション: 終了日（YYYY-MM-DD）
     }
   ): Promise<{
     trading_days: TradingDay[];
     statistics: {
       total_days: number;
       trading_days: number;
       holidays: number;
     };
   }>
   ```

2. **入力パラメータ**
   - `from_date`（オプション）: 開始日（YYYY-MM-DD、デフォルト: 2年前）
   - `to_date`（オプション）: 終了日（YYYY-MM-DD、デフォルト: 今日）

3. **出力形式**
   ```json
   {
     "trading_days": [
       {
         "date": "2025-10-29",
         "is_trading_day": true,
         "day_of_week": "水",
         "event": null
       },
       {
         "date": "2025-10-30",
         "is_trading_day": false,
         "day_of_week": "木",
         "event": "祝日"
       },
       // ...
     ],
     "statistics": {
       "total_days": 730,
       "trading_days": 500,
       "holidays": 230
     }
   }
   ```

4. **TradingDay インターフェース**
   ```typescript
   interface TradingDay {
     date: string;              // YYYY-MM-DD
     is_trading_day: boolean;   // 取引可能日か
     day_of_week: string;       // 月～日
     event?: string;            // イベント名（祝日、大型連休等）
   }
   ```

5. **取引カレンダーソース**
   - J-Quants APIから取引カレンダー情報を取得
   - 祝日・お盆・正月等を含めた情報を保有

6. **バリデーション**
   - from_date, to_date が YYYY-MM-DD 形式か
   - from_date <= to_date か

#### TDD テスト要件

**Red フェーズ**:
- 取引カレンダー取得 → FAIL
- 日付範囲フィルタ → FAIL
- 統計計算 → FAIL

**Green フェーズ**:
- 実装によってすべてのテストをPASS

**Refactor フェーズ**:
- フィルタリング最適化
- 統計計算の効率化

#### テストケース詳細

```typescript
// test/tools/get-trading-calendar.test.ts

1. パラメータなし（デフォルト: 2年間）
   - params: {}
   ✓ 過去2年のカレンダーが返却される
   ✓ trading_days 配列に 500+ の取引日が含まれる

2. from_date 指定
   - params: { from_date: '2025-01-01' }
   ✓ 2025-01-01 以降のカレンダーのみ返却

3. to_date 指定
   - params: { to_date: '2025-12-31' }
   ✓ 2025-12-31 以前のカレンダーのみ返却

4. from_date + to_date 指定
   - params: { from_date: '2025-01-01', to_date: '2025-12-31' }
   ✓ 指定範囲のカレンダーのみ返却

5. 統計情報計算
   - 返却されたカレンダーから統計計算
   ✓ total_days, trading_days, holidays が正確に計算される
   ✓ trading_days + holidays = total_days

6. 祝日情報
   - 2025-01-13（成人の日）が祝日として返却
   ✓ is_trading_day: false, event: "祝日"

7. 営業日の day_of_week
   - 2025-10-29 (水) が取引日
   ✓ day_of_week: "水"

8. 不正な日付形式
   - params: { from_date: '2025/01/01' }
   ✓ ValidationError スロー

9. from_date > to_date
   - params: { from_date: '2025-12-31', to_date: '2025-01-01' }
   ✓ ValidationError スロー

10. 連続した取引日確認
    - 月曜日から金曜日が連続で取引可能
    ✓ 営業日が連続している
```

#### 完了基準

- [ ] `src/tools/get-trading-calendar.ts` が実装
- [ ] 取引カレンダー取得実装
- [ ] 日付範囲フィルタリング実装
- [ ] 統計情報計算実装
- [ ] すべてのテストケース（PASS 条件）がパス
- [ ] レスポンス形式が仕様に準拠
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   ├── types/
│   │   └── index.ts (修正、TradingDay型追加)
│   └── tools/
│       └── get-trading-calendar.ts (新規)
└── tests/
    └── tools/
        └── get-trading-calendar.test.ts (新規)
```

---

### Day 14: TASK-0014: MCPツール7: search_companies

**[ ] TASK-0014: MCPツール7: search_companies**

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0014 |
| **タスク名** | MCPツール7: search_companies（Company Search Tool） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | Phase 2 機能要件、REQ-701 |
| **依存タスク** | TASK-0004, TASK-0005, TASK-0011 |

#### 説明

企業名や銘柄コードで銘柄を検索するMCPツール `search_companies` を実装します。パーシャルマッチング、複合検索、検索結果のランキング機能を提供します。

#### 実装内容

1. **ツール実装 (src/tools/search-companies.ts)**

   関数シグネチャ:
   ```typescript
   async function searchCompanies(
     params: {
       query: string;        // 必須: 検索キーワード（企業名、銘柄コード、業種等）
       market?: string;      // オプション: 市場フィルタ
       sector?: string;      // オプション: 業種コードフィルタ
       limit?: number;       // オプション: 結果件数制限（デフォルト: 20、最大: 100）
     }
   ): Promise<{
     query: string;
     total_results: number;
     results: SearchResult[];
   }>
   ```

2. **入力パラメータ**
   - `query`（必須）: 検索キーワード（企業名・銘柄コード・業種名等）
   - `market`（オプション）: 市場フィルタ
   - `sector`（オプション）: 業種コードフィルタ
   - `limit`（オプション）: 結果件数制限（1～100、デフォルト: 20）

3. **出力形式**
   ```json
   {
     "query": "トヨタ",
     "total_results": 3,
     "results": [
       {
         "rank": 1,
         "code": "1234",
         "name": "トヨタ自動車",
         "market": "TSE",
         "sector": "0050",
         "match_type": "exact_name",
         "relevance_score": 100
       },
       {
         "rank": 2,
         "code": "5678",
         "name": "トヨタ紡織",
         "market": "TSE",
         "sector": "0050",
         "match_type": "partial_name",
         "relevance_score": 85
       },
       // ...
     ]
   }
   ```

4. **検索アルゴリズム**
   - 正確一致: relevance_score = 100
   - 企業名前方一致: relevance_score = 90
   - 企業名部分一致: relevance_score = 80
   - 銘柄コード一致: relevance_score = 95
   - 業種名一致: relevance_score = 70

5. **検索ロジック**
   - get_listed_companies で全銘柄を取得
   - クエリを複数キーワードに分割
   - 各キーワードで企業名・銘柄コード・業種名をマッチング
   - relevance_score でランク付け
   - limit で結果件数を制限

6. **バリデーション**
   - query が空でないか
   - limit が1～100の範囲か

#### TDD テスト要件

**Red フェーズ**:
- 企業名検索 → FAIL
- 銘柄コード検索 → FAIL
- 複合検索 → FAIL
- ランキング → FAIL

**Green フェーズ**:
- 実装によってすべてのテストをPASS

**Refactor フェーズ**:
- 検索アルゴリズム最適化
- ランキング計算の調整

#### テストケース詳細

```typescript
// test/tools/search-companies.test.ts

1. 企業名完全一致
   - params: { query: 'トヨタ自動車' }
   ✓ トヨタ自動車が最初の結果
   ✓ match_type: "exact_name", relevance_score: 100

2. 企業名前方一致
   - params: { query: 'トヨタ' }
   ✓ トヨタ自動車が最初の結果
   ✓ トヨタ紡織も含まれている
   ✓ relevance_score が降順でソート

3. 銘柄コード検索
   - params: { query: '1234' }
   ✓ 銘柄コード 1234 の企業が返却される
   ✓ match_type: "code"

4. 複合フィルタ（企業名 + market）
   - params: { query: 'トヨタ', market: 'TSE' }
   ✓ TSE のみのトヨタ関連企業が返却される

5. 複合フィルタ（企業名 + sector）
   - params: { query: 'トヨタ', sector: '0050' }
   ✓ 業種 0050 のみのトヨタ関連企業が返却される

6. limit パラメータ
   - params: { query: 'トヨタ', limit: 5 }
   ✓ 結果が最大5件に制限される

7. 検索結果なし
   - params: { query: 'ほげほげ企業' }
   ✓ total_results: 0, results: []

8. 空クエリ
   - params: { query: '' }
   ✓ ValidationError スロー

9. 無効な limit
   - params: { query: 'トヨタ', limit: 200 }
   ✓ ValidationError スロー: "limit は1～100で指定してください"

10. relevance_score の降順確認
    - 複数の検索結果を取得
    ✓ results[0].relevance_score >= results[1].relevance_score

11. rank パラメータの確認
    - 複数の検索結果を取得
    ✓ results[0].rank = 1, results[1].rank = 2, ...

12. 複数キーワード検索（スペース区切り）
    - params: { query: 'トヨタ 自動車' }
    ✓ 両キーワードにマッチした企業が優先される
```

#### 完了基準

- [ ] `src/tools/search-companies.ts` が実装
- [ ] パーシャルマッチング検索実装
- [ ] relevance_score ランキング実装
- [ ] 複合フィルタリング実装
- [ ] すべてのテストケース（PASS 条件）がパス
- [ ] レスポンス形式が仕様に準拠
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   ├── types/
│   │   └── index.ts (修正、SearchResult型追加)
│   └── tools/
│       └── search-companies.ts (新規)
└── tests/
    └── tools/
        └── search-companies.test.ts (新規)
```

---

### Day 15: TASK-0015: MCPツール8: get_sector_stocks

**[ ] TASK-0015: MCPツール8: get_sector_stocks**

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0015 |
| **タスク名** | MCPツール8: get_sector_stocks（Sector Stocks Tool） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | Phase 2 機能要件、REQ-701 |
| **依存タスク** | TASK-0004, TASK-0005, TASK-0011 |

#### 説明

指定業種の銘柄一覧を取得し、株価や市場データとともに返却するMCPツール `get_sector_stocks` を実装します。業種別の銘柄パフォーマンス分析を可能にします。

#### 実装内容

1. **ツール実装 (src/tools/get-sector-stocks.ts)**

   関数シグネチャ:
   ```typescript
   async function getSectorStocks(
     params: {
       sector: string;       // 必須: 業種コード（e.g., '0050'）
       market?: string;      // オプション: 市場フィルタ
       sort_by?: string;     // オプション: ソート対象（price, market_cap, volume）
       order?: string;       // オプション: 昇順/降順（asc/desc）
     }
   ): Promise<{
     sector_name: string;
     sector_code: string;
     total_stocks: number;
     stocks: SectorStock[];
     market_statistics: {
       average_price: number;
       highest_price: number;
       lowest_price: number;
       total_volume: number;
     };
   }>
   ```

2. **入力パラメータ**
   - `sector`（必須）: 業種コード（4桁）
   - `market`（オプション）: 市場フィルタ
   - `sort_by`（オプション）: ソート対象（price, market_cap, volume）
   - `order`（オプション）: 昇順/降順（asc/desc、デフォルト: desc）

3. **出力形式**
   ```json
   {
     "sector_name": "自動車・同部品",
     "sector_code": "0050",
     "total_stocks": 15,
     "stocks": [
       {
         "code": "1234",
         "name": "トヨタ自動車",
         "market": "TSE",
         "latest_price": 3050.0,
         "price_change": 50.0,
         "price_change_percent": 1.67,
         "market_cap": 45000000000000,
         "volume": 1000000
       },
       // ... 他の企業
     ],
     "market_statistics": {
       "average_price": 2800.0,
       "highest_price": 5000.0,
       "lowest_price": 1000.0,
       "total_volume": 50000000
     }
   }
   ```

4. **SectorStock インターフェース**
   ```typescript
   interface SectorStock {
     code: string;
     name: string;
     market: string;
     latest_price: number;
     price_change: number;
     price_change_percent: number;
     market_cap: number;     // 時価総額
     volume: number;         // 出来高
   }
   ```

5. **データ取得フロー**
   - get_listed_companies で指定業種の企業一覧を取得
   - 各企業の get_stock_price で最新株価を取得
   - 市場統計情報を計算
   - sort_by, order でソート

6. **バリデーション**
   - sector が有効な業種コードか
   - sort_by が有効な値（price, market_cap, volume）か
   - order が有効な値（asc, desc）か

#### TDD テスト要件

**Red フェーズ**:
- 業種別銘柄取得 → FAIL
- ソート機能 → FAIL
- 市場統計計算 → FAIL

**Green フェーズ**:
- 実装によってすべてのテストをPASS

**Refactor フェーズ**:
- ソートロジック最適化
- 統計計算の効率化

#### テストケース詳細

```typescript
// test/tools/get-sector-stocks.test.ts

1. 業種指定（自動車・同部品）
   - params: { sector: '0050' }
   ✓ 業種 0050 の銘柄が返却される
   ✓ sector_name: "自動車・同部品"
   ✓ total_stocks > 0

2. market フィルタ
   - params: { sector: '0050', market: 'TSE' }
   ✓ TSE のみの銘柄が返却される

3. sort_by: price（デフォルト: 降順）
   - params: { sector: '0050', sort_by: 'price' }
   ✓ latest_price が降順でソート
   ✓ stocks[0].latest_price >= stocks[1].latest_price

4. sort_by: market_cap with order: asc
   - params: { sector: '0050', sort_by: 'market_cap', order: 'asc' }
   ✓ market_cap が昇順でソート

5. sort_by: volume
   - params: { sector: '0050', sort_by: 'volume', order: 'desc' }
   ✓ volume が降順でソート

6. 市場統計情報計算
   - 複数の銘柄データから統計計算
   ✓ average_price が正確に計算される
   ✓ highest_price が最大値
   ✓ lowest_price が最小値
   ✓ total_volume が合計

7. price_change と price_change_percent
   - 前営業日との変動を確認
   ✓ price_change_percent = (price_change / 前営業日終値) × 100

8. 不正な sector コード
   - params: { sector: 'INVALID' }
   ✓ ValidationError スロー

9. 存在しない業種
   - params: { sector: '9999' }
   ✓ エラーメッセージ返却 or total_stocks: 0

10. 不正な sort_by
    - params: { sector: '0050', sort_by: 'invalid' }
    ✓ ValidationError スロー

11. 不正な order
    - params: { sector: '0050', order: 'invalid' }
    ✓ ValidationError スロー

12. 複合フィルタ（market + sort_by）
    - params: { sector: '0050', market: 'TSE', sort_by: 'price' }
    ✓ TSE のみ、price 降順で返却される
```

#### 完了基準

- [ ] `src/tools/get-sector-stocks.ts` が実装
- [ ] 業種別銘柄取得実装
- [ ] ソート機能実装（price, market_cap, volume）
- [ ] 市場統計情報計算実装
- [ ] すべてのテストケース（PASS 条件）がパス
- [ ] レスポンス形式が仕様に準拠
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   ├── types/
│   │   └── index.ts (修正、SectorStock型追加)
│   └── tools/
│       └── get-sector-stocks.ts (新規)
└── tests/
    └── tools/
        └── get-sector-stocks.test.ts (新規)
```

---

### Day 16: TASK-0016: エラーメッセージ詳細化

**[ ] TASK-0016: エラーメッセージ詳細化**

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0016 |
| **タスク名** | エラーメッセージ詳細化（Detailed Error Messages） |
| **推定時間** | 8時間 |
| **種別** | DIRECT |
| **関連要件** | EDGE-001～EDGE-302、NFR-301 |
| **依存タスク** | TASK-0005、TASK-0012～TASK-0015 |

#### 説明

Phase 1で実装した基本的なエラーハンドリングを拡張し、EDGE-001～EDGE-302で定義された詳細なエラーメッセージをすべて実装します。日本語での分かりやすいメッセージを生成し、ユーザーの問題解決を支援します。

#### 実装内容

1. **エラーメッセージ詳細化 (src/utils/error-handler.ts 拡張)**

   300個のエラーメッセージを実装:
   - EDGE-001～EDGE-100: 入力エラー（銘柄コード、日付、パラメータ）
   - EDGE-101～EDGE-150: バリデーションエラー（範囲外、型エラー）
   - EDGE-151～EDGE-200: API通信エラー（メンテナンス、接続失敗）
   - EDGE-201～EDGE-250: データ形式エラー（JSON、フィールド欠落）
   - EDGE-251～EDGE-302: ビジネスロジックエラー（存在しない銘柄、利用不可）

2. **エラー分類**
   ```typescript
   enum ErrorCategory {
     INPUT_ERROR = 'INPUT_ERROR',           // 入力値不正
     VALIDATION_ERROR = 'VALIDATION_ERROR', // バリデーション失敗
     API_ERROR = 'API_ERROR',               // API通信エラー
     DATA_ERROR = 'DATA_ERROR',             // データ形式エラー
     BUSINESS_ERROR = 'BUSINESS_ERROR',     // ビジネスロジックエラー
   }
   ```

3. **エラーメッセージマッピング**
   ```typescript
   const detailedErrorMessages: Record<ErrorCode, ErrorMessageTemplate> = {
     EDGE_001: {
       message: '銘柄コード「{code}」が見つかりません。4桁の数字を指定してください。',
       suggestion: 'get_listed_companies で有効な銘柄コードを確認してください。',
       example: 'コード: 1234（トヨタ自動車）'
     },
     EDGE_002: {
       message: '日付「{date}」の形式が不正です。YYYY-MM-DD形式で指定してください。',
       suggestion: '例: 2025-10-29',
       example: '正しい形式: 2025-10-29'
     },
     // ... 300個のメッセージ
   };
   ```

4. **エラー文脈情報の追加**
   - エラーコード
   - エラーカテゴリー
   - ユーザー向けメッセージ
   - 開発者向けコンテキスト
   - 推奨アクション
   - 参考リンク

5. **エラーレスポンス形式**
   ```json
   {
     "error": {
       "code": "EDGE-001",
       "category": "INPUT_ERROR",
       "message": "銘柄コード「9999」が見つかりません。4桁の数字を指定してください。",
       "suggestion": "get_listed_companies で有効な銘柄コードを確認してください。",
       "example": "コード: 1234（トヨタ自動車）",
       "timestamp": "2025-10-29T15:22:30.123Z",
       "context": {
         "parameter": "code",
         "provided_value": "9999",
         "valid_values": "[0000-9999]"
       }
     }
   }
   ```

6. **エラーハンドラー関数群**
   - `formatErrorResponse(error: any): ErrorResponse` - エラーレスポンス整形
   - `getDetailedErrorMessage(errorCode: string, context: any): string` - 詳細メッセージ取得
   - `getSuggestion(errorCode: string): string` - 推奨アクション取得
   - `getErrorExample(errorCode: string): string` - 使用例取得

#### 実装対象エラー

**EDGE-001～EDGE-050: 銘柄コード関連**
- EDGE-001: 銘柄コードが見つからない
- EDGE-002: 銘柄コード形式不正（4桁でない）
- EDGE-003: 銘柄コード未指定
- EDGE-004: 銘柄コード重複指定
- EDGE-005～EDGE-050: その他の銘柄コード関連エラー

**EDGE-051～EDGE-100: 日付・期間関連**
- EDGE-051: 日付形式不正（YYYY-MM-DD でない）
- EDGE-052: 開始日が終了日より後
- EDGE-053: 日付がフリープラン対象外（12週間以内）
- EDGE-054: 日付がフリープラン対象外（2年以上前）
- EDGE-055～EDGE-100: その他の日付関連エラー

**EDGE-101～EDGE-150: パラメータ・バリデーション**
- EDGE-101: 市場区分が無効
- EDGE-102: 業種コードが無効
- EDGE-103: ソート対象が無効
- EDGE-104: limit パラメータが範囲外
- EDGE-105～EDGE-150: その他のバリデーションエラー

**EDGE-151～EDGE-200: API通信・ネットワーク**
- EDGE-151: J-Quants APIがメンテナンス中
- EDGE-152: ネットワークに接続できない
- EDGE-153: APIレスポンスがタイムアウト
- EDGE-154: レート制限に達した
- EDGE-155～EDGE-200: その他のAPI通信エラー

**EDGE-201～EDGE-250: データ形式・フィールド**
- EDGE-201: APIレスポンスがJSON として解析できない
- EDGE-202: 必須フィールドが欠けている
- EDGE-203: フィールドのデータ型が不正
- EDGE-204: 配列が空である
- EDGE-205～EDGE-250: その他のデータ形式エラー

**EDGE-251～EDGE-302: ビジネスロジック**
- EDGE-251: 指定銘柄の株価データが存在しない
- EDGE-252: 指定銘柄の財務諸表が存在しない
- EDGE-253: 指定銘柄の配当情報が存在しない
- EDGE-254: 指定日付に取引が行われていない
- EDGE-255～EDGE-302: その他のビジネスロジックエラー

#### 完了基準

- [ ] `src/utils/error-handler.ts` が 300+ のエラーメッセージを実装
- [ ] すべてのエラーメッセージが日本語で記載
- [ ] エラーレスポンス形式が統一
- [ ] 各エラーに推奨アクションが記載
- [ ] エラー例・使用例が提供
- [ ] エラーコード体系が明確

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   └── utils/
│       └── error-handler.ts (修正、詳細エラーメッセージ追加)
└── docs/
    └── error-codes.md (新規、エラーコード一覧)
```

---

### Day 17: TASK-0017: デバッグ機能強化

**[ ] TASK-0017: デバッグ機能強化**

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0017 |
| **タスク名** | デバッグ機能強化（Debug & Performance Enhancements） |
| **推定時間** | 8時間 |
| **種別** | DIRECT |
| **関連要件** | REQ-901, REQ-902, NFR-001, NFR-002 |
| **依存タスク** | TASK-0005、TASK-0011～TASK-0015 |

#### 説明

ロギング機能を拡張し、デバッグモードの実装、APIレスポンスタイム計測、リクエスト・レスポンスの詳細ログ出力を実現します。開発効率とパフォーマンス監視を向上させます。

#### 実装内容

1. **ロガー拡張 (src/utils/logger.ts 拡張)**

   主要メソッド:
   - `error(message: string, context?: any): void` - エラーログ
   - `warn(message: string, context?: any): void` - 警告ログ
   - `info(message: string, context?: any): void` - 情報ログ
   - `debug(message: string, context?: any): void` - デバッグログ
   - `setLogLevel(level: LogLevel): void` - ログレベル変更
   - `startTimer(label: string): () => number` - タイマー開始・計測

2. **ログレベル設定**
   ```typescript
   enum LogLevel {
     ERROR = 'ERROR',     // エラーのみ
     WARN = 'WARN',       // エラー・警告
     INFO = 'INFO',       // エラー・警告・情報
     DEBUG = 'DEBUG',     // すべて
   }
   ```

3. **デバッグモード実装**
   - 環境変数 `DEBUG_MODE=true` で有効化
   - APIリクエスト・レスポンスの詳細ログ出力
   - パラメータ・ヘッダー・ボディを記録

4. **レスポンスタイム計測**
   ```typescript
   // 使用例
   const timer = logger.startTimer('API_CALL');
   const response = await apiClient.fetch(...);
   const elapsed = timer(); // ms を返却
   logger.info(`API call completed in ${elapsed}ms`);
   ```

5. **詳細ログ出力**
   ```
   [2025-10-29T15:22:30.123Z] DEBUG: API Request
   Method: GET
   URL: https://api.jquants.com/v1/listed_info
   Headers: { Authorization: Bearer ***, Content-Type: application/json }
   Query Params: { code: 1234 }

   [2025-10-29T15:22:30.456Z] DEBUG: API Response
   Status: 200
   Headers: { Content-Type: application/json, ... }
   Body (first 1000 chars): { "result_set": { ... } }
   Elapsed Time: 333ms
   ```

6. **パフォーマンス計測**
   - ツール実行時間
   - API呼び出し時間
   - バリデーション時間
   - データ変換時間

7. **ログファイル**
   - `logs/error.log` - エラーログ（常時記録）
   - `logs/debug.log` - デバッグログ（DEBUG_MODE時のみ）
   - ログローテーション（ファイルサイズ 10MB 超過時）

#### ロガー出力例

**ERROR ログ**:
```
[2025-10-29T15:22:30.123Z] ERROR: API call failed
Code: 500
Message: Internal Server Error
Context: { url: 'https://api.jquants.com/v1/listed_info', attempt: 2 }
Stack: Error: Internal Server Error at ...
```

**INFO ログ**:
```
[2025-10-29T15:22:30.123Z] INFO: MCP Server started
Port: 3000
Tools registered: 8
Elapsed time: 2314ms
```

**DEBUG ログ**:
```
[2025-10-29T15:22:30.123Z] DEBUG: Processing tool call
Tool: get_stock_price
Params: { code: '1234', from_date: '2025-01-01' }

[2025-10-29T15:22:30.234Z] DEBUG: Validating parameters
Code validation: PASS
Date validation: PASS
Elapsed: 12ms

[2025-10-29T15:22:30.345Z] DEBUG: API Request
GET /daily_quotes?code=1234&from=2025-01-01
Headers: { Authorization: Bearer *** }
Elapsed: 234ms

[2025-10-29T15:22:30.579Z] DEBUG: Data processing
Filtering by date range: 234 → 200 records
Sorting descending: 200 records
Elapsed: 45ms

[2025-10-29T15:22:30.580Z] DEBUG: Tool response
Records: 200
Elapsed (total): 457ms
```

#### 完了基準

- [ ] `src/utils/logger.ts` が拡張され、4つのログレベル実装
- [ ] デバッグモード実装（DEBUG_MODE 環境変数）
- [ ] APIリクエスト・レスポンス詳細ログ実装
- [ ] パフォーマンス計測機能実装（startTimer）
- [ ] ログファイル出力実装
- [ ] ログローテーション実装

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   └── utils/
│       └── logger.ts (修正、拡張実装)
└── logs/
    ├── error.log (実行時生成)
    └── debug.log (DEBUG_MODE時のみ)
```

---

### Day 18: TASK-0018: Phase 2 統合テスト

**[ ] TASK-0018: Phase 2 統合テスト**

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0018 |
| **タスク名** | Phase 2 統合テスト（Phase 2 Integration Testing） |
| **推定時間** | 8時間 |
| **種別** | TDD |
| **関連要件** | NFR-001, NFR-002, NFR-003 |
| **依存タスク** | TASK-0011～TASK-0017 |

#### 説明

Phase 2 で実装したすべてのコンポーネント（4つの追加ツール、エラーハンドリング、デバッグ機能）の統合テストを実施し、全体的な動作確認とパフォーマンス検証を行います。

#### 実装内容

1. **統合テストスイート実装**

   テストカバレッジ:
   - 8つのMCPツール（Phase 1 の4つ + Phase 2 の4つ）
   - エラーハンドリング（300+ のエラーメッセージ）
   - デバッグ機能（ログ出力、タイマー）
   - パフォーマンス（レスポンス時間、メモリ使用量）

2. **ツール機能テスト**
   ```typescript
   describe('Phase 2 Integration Tests', () => {
     // Tool tests (8つのツール)
     describe('get_listed_companies', () => { ... })
     describe('get_stock_price', () => { ... })
     describe('get_financial_statements', () => { ... })
     describe('get_company_info', () => { ... })
     describe('get_dividend_info', () => { ... })
     describe('get_trading_calendar', () => { ... })
     describe('search_companies', () => { ... })
     describe('get_sector_stocks', () => { ... })

     // Error handling tests
     describe('Error Handling', () => { ... })

     // Performance tests
     describe('Performance', () => { ... })
   })
   ```

3. **テストケース**

   **ツール機能テスト** (各ツール 5～10 ケース):
   - 正常系テスト（パラメータなし、パラメータあり）
   - エラー系テスト（不正パラメータ、存在しないデータ）
   - エッジケーステスト（境界値、特殊値）
   - フィルタリング・ソートテスト

   **エラーハンドリングテスト** (50+ ケース):
   - 銘柄コード関連エラー（EDGE-001～050）
   - 日付関連エラー（EDGE-051～100）
   - パラメータバリデーションエラー（EDGE-101～150）
   - API通信エラー（EDGE-151～200）
   - データ形式エラー（EDGE-201～250）
   - ビジネスロジックエラー（EDGE-251～302）

   **パフォーマンステスト** (10+ ケース):
   - 単一ツール実行時間 < 5 秒
   - 複数ツール並列実行
   - メモリ使用量 < 500MB
   - スループット（ツール/秒）

4. **テスト実施順序**

   ```
   1. ユニットテスト確認
      - TASK-0011～0015 の各ツールテストが PASS
      - TASK-0016 のエラーハンドリングテストが PASS
      - TASK-0017 のロギング機能テストが PASS

   2. 統合テスト実施
      - MCPサーバー起動テスト
      - ツール登録テスト
      - 各ツール実行テスト
      - エラーハンドリングテスト
      - パフォーマンステスト

   3. E2Eテスト（オプション）
      - Claude Desktop との実際の連携
      - ユーザーワークフローのシミュレーション
   ```

5. **テスト結果レポート**
   ```
   Phase 2 Integration Test Report
   ================================

   Test Execution Date: 2025-10-29
   Test Environment: Node.js 20 LTS, MacOS/Linux/Windows

   Overall Results:
   - Total Tests: 150+
   - Passed: 150
   - Failed: 0
   - Skipped: 0
   - Success Rate: 100%

   Tool Tests:
   - get_listed_companies: 8 tests PASS
   - get_stock_price: 10 tests PASS
   - get_financial_statements: 8 tests PASS
   - get_company_info: 6 tests PASS
   - get_dividend_info: 10 tests PASS
   - get_trading_calendar: 10 tests PASS
   - search_companies: 12 tests PASS
   - get_sector_stocks: 12 tests PASS

   Error Handling Tests: 50+ tests PASS

   Performance Tests:
   - Average response time: 500ms
   - Max response time: 3500ms
   - Memory usage: 250MB
   - No memory leaks detected

   Code Quality:
   - TypeScript strict mode: PASS
   - ESLint: 0 errors
   - Type coverage: 100%
   ```

#### テストケース詳細

```typescript
// test/integration/phase2.test.ts

describe('Phase 2 Integration Tests', () => {

  // Tool Tests
  describe('Tool Integration', () => {
    test('All 8 tools are registered', async () => {
      const tools = server.getRegisteredTools();
      expect(tools.length).toBe(8);
      expect(tools.map(t => t.name)).toContain('get_dividend_info');
      expect(tools.map(t => t.name)).toContain('get_trading_calendar');
      expect(tools.map(t => t.name)).toContain('search_companies');
      expect(tools.map(t => t.name)).toContain('get_sector_stocks');
    });

    test('get_dividend_info returns dividend data', async () => {
      const result = await server.callTool('get_dividend_info', { code: '1234' });
      expect(result).toHaveProperty('dividend_yield');
      expect(result.dividends).toBeDefined();
      expect(result.dividends.length).toBeGreaterThan(0);
    });

    test('get_trading_calendar returns trading days', async () => {
      const result = await server.callTool('get_trading_calendar', {});
      expect(result).toHaveProperty('trading_days');
      expect(result).toHaveProperty('statistics');
      expect(result.statistics.total_days).toBeGreaterThan(0);
    });

    test('search_companies finds companies', async () => {
      const result = await server.callTool('search_companies', { query: 'トヨタ' });
      expect(result.total_results).toBeGreaterThan(0);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0]).toHaveProperty('relevance_score');
    });

    test('get_sector_stocks returns sector companies', async () => {
      const result = await server.callTool('get_sector_stocks', { sector: '0050' });
      expect(result).toHaveProperty('sector_name');
      expect(result.stocks.length).toBeGreaterThan(0);
      expect(result).toHaveProperty('market_statistics');
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    test('EDGE-001: Invalid stock code', async () => {
      try {
        await server.callTool('get_dividend_info', { code: 'INVALID' });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('銘柄コード');
      }
    });

    test('EDGE-051: Invalid date format', async () => {
      try {
        await server.callTool('get_stock_price', {
          code: '1234',
          from_date: '2025/01/01'
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('YYYY-MM-DD');
      }
    });

    test('All error messages are in Japanese', async () => {
      // Test multiple error scenarios
      const errorMessages = [
        // ... collect error messages
      ];
      const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/;
      errorMessages.forEach(msg => {
        expect(msg).toMatch(japaneseRegex);
      });
    });
  });

  // Performance Tests
  describe('Performance', () => {
    test('get_listed_companies responds < 5 seconds', async () => {
      const start = performance.now();
      await server.callTool('get_listed_companies', {});
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(5000);
    });

    test('get_stock_price responds < 5 seconds', async () => {
      const start = performance.now();
      await server.callTool('get_stock_price', { code: '1234' });
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(5000);
    });

    test('Memory usage < 500MB', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Execute all tools
      await server.callTool('get_listed_companies', {});
      await server.callTool('get_stock_price', { code: '1234' });
      await server.callTool('get_financial_statements', { code: '1234' });
      await server.callTool('get_company_info', { code: '1234' });
      await server.callTool('get_dividend_info', { code: '1234' });
      await server.callTool('get_trading_calendar', {});
      await server.callTool('search_companies', { query: 'トヨタ' });
      await server.callTool('get_sector_stocks', { sector: '0050' });

      const finalMemory = process.memoryUsage().heapUsed;
      const deltaMemory = (finalMemory - initialMemory) / 1024 / 1024; // MB

      expect(deltaMemory).toBeLessThan(500);
    });

    test('No memory leaks after repeated calls', async () => {
      const measurements = [];
      for (let i = 0; i < 10; i++) {
        const memory = process.memoryUsage().heapUsed / 1024 / 1024;
        await server.callTool('get_stock_price', { code: '1234' });
        measurements.push(memory);
      }

      // Memory should not continuously increase
      const trend = measurements.slice(-3);
      const isIncreasing = trend[0] < trend[1] && trend[1] < trend[2];
      expect(isIncreasing).toBeFalsy();
    });
  });

  // Logging Tests
  describe('Logging & Debug', () => {
    test('DEBUG_MODE outputs detailed logs', async () => {
      process.env.DEBUG_MODE = 'true';
      const logSpy = jest.spyOn(logger, 'debug');

      await server.callTool('get_stock_price', { code: '1234' });

      expect(logSpy).toHaveBeenCalled();
      const calls = logSpy.mock.calls;
      expect(calls.some(call => call[0].includes('API'))).toBeTruthy();

      logSpy.mockRestore();
    });

    test('Response time is logged', async () => {
      const logSpy = jest.spyOn(logger, 'info');

      await server.callTool('get_stock_price', { code: '1234' });

      const infoCall = logSpy.mock.calls.find(call =>
        call[0].includes('elapsed') || call[0].includes('ms')
      );
      expect(infoCall).toBeDefined();

      logSpy.mockRestore();
    });
  });
});
```

#### 完了基準

- [ ] すべての ユニットテスト（TASK-0011～0017） が PASS
- [ ] 統合テスト（150+ ケース） が PASS
- [ ] エラーメッセージが日本語で統一されている
- [ ] パフォーマンスが要件を満たしている（レスポンス < 5秒）
- [ ] メモリ使用量が 500MB 以下
- [ ] ログ出力が正常に機能
- [ ] TypeScript strict mode でエラーなし

#### 作成・修正ファイル

```
servers/j-quants/
├── src/
│   └── index.ts (修正、8つのツール登録確認)
└── tests/
    └── integration/
        └── phase2.test.ts (新規、統合テスト)
```

---

## Phase 2 全体統合テスト

**実施日**: Day 18 完了後
**実施者**: 開発チーム
**テスト環境**: ローカル環境

### 統合テスト計画

#### 1. 環境セットアップ確認
- [ ] Node.js 20 LTS インストール確認
- [ ] Phase 1 で構築したプロジェクトが正常に動作
- [ ] Phase 2 での追加パッケージがインストール確認
- [ ] 環境変数（J_QUANTS_REFRESH_TOKEN、DEBUG_MODE）が正確に設定

#### 2. ツール機能テスト
- [ ] 8つのMCPツール全て実行可能
- [ ] 各ツールが正確なデータを返却
- [ ] 複合パラメータフィルタリング正常
- [ ] エラーハンドリング機能正常（300+ のエラーメッセージ）

#### 3. パフォーマンステスト
- [ ] 単一ツール実行: < 5秒
- [ ] 複数ツール並列実行: < 15秒
- [ ] メモリ使用量: < 500MB
- [ ] レスポンスタイム計測: ログに記録される

#### 4. 品質テスト
- [ ] 全テストケース PASS (Vitest)
- [ ] TypeScript strict mode エラーなし
- [ ] ESLint エラーなし
- [ ] コード可読性・保守性確認

#### 5. ドキュメント確認
- [ ] Phase 2 タスク完了書作成
- [ ] エラーコード一覧（EDGE-001～302）
- [ ] ツール使用ガイド更新
- [ ] デバッグガイド作成

### Phase 2 完了判定基準

✅ すべての以下の条件が満たされたら Phase 2 完了

1. **実装完了**
   - [ ] TASK-0011～TASK-0018 すべて完了
   - [ ] 8つのファイルが作成・実装完了
   - [ ] コード品質（strict mode, ESLint）合格

2. **テスト完了**
   - [ ] ユニットテスト: 全テストケース PASS
   - [ ] 統合テスト: 8つのツール動作確認完了
   - [ ] パフォーマンステスト: 全要件満たし確認

3. **ドキュメント完成**
   - [ ] Phase 2 タスク完了書
   - [ ] エラーコード一覧
   - [ ] パフォーマンスレポート
   - [ ] デバッグガイド

4. **要件充足**
   - [ ] 4つの追加ツール実装完了
   - [ ] 詳細なエラーメッセージ実装完了（EDGE-001～302）
   - [ ] デバッグ・ロギング機能実装完了
   - [ ] パフォーマンス要件充足確認

---

## Phase 2 ドキュメント成果物

Phase 2 完了時に作成すべきドキュメント:

1. **Phase 2 完了報告書** (`docs/tasks/j-quants-phase2-completion.md`)
   - 実装概要
   - タスク完了状況
   - テスト結果報告
   - パフォーマンス測定結果
   - 次フェーズへの引継ぎ事項

2. **エラーコード一覧** (`docs/error-codes.md`)
   - EDGE-001～EDGE-302 の全300個のエラーコード
   - エラーカテゴリー分類
   - エラーメッセージとサジェッション
   - 使用例

3. **ツール使用ガイド拡張版** (`docs/tool-usage-guide.md`)
   - 8つのツール（Phase 1 + Phase 2）の仕様詳細
   - 入出力パラメータ定義
   - レスポンス形式定義
   - 実行例

4. **パフォーマンスレポート** (`docs/performance-report.md`)
   - レスポンスタイム測定結果
   - メモリ使用量分析
   - スループット測定
   - ボトルネック分析

5. **デバッグガイド** (`docs/debug-guide.md`)
   - デバッグモード有効化方法
   - ログファイルの確認方法
   - レスポンスタイム計測方法
   - よくあるエラーと対応

---

## 次フェーズへの移行

Phase 2 完了後、以下を Phase 3 へ引き継ぎ:

1. **完成したコンポーネント**
   - 8つのMCPツール（Phase 1 の4つ + Phase 2 の4つ）
   - 詳細なエラーハンドリング
   - デバッグ・ロギング機能
   - リトライロジック

2. **既知の制約・注意事項**
   - J-Quants API フリープラン制約（12週間遅延、2年制限）
   - レート制限の詳細（詳細はドキュメント参照）
   - パフォーマンス境界（レスポンス < 5秒）

3. **Phase 3 で追加実装すべきもの**
   - 高度な分析ツール（信用取引、空売り情報等）
   - キャッシング戦略の実装
   - パフォーマンス最適化（バッチ処理等）
   - 本番環境への対応

---

**最終更新**: 2025-10-29
**作成者**: Claude Code (kairo-tasks コマンド)
**ステータス**: 完成・レビー待ち

---

## 参考資料

- [J-Quants 要件定義書](../spec/j-quants-requirements.md)
- [J-Quants アーキテクチャ設計書](../design/architecture.md)
- [J-Quants Phase 1 詳細タスク計画書](./j-quants-phase1.md)
- [J-Quants 全体タスク概要](./j-quants-overview.md)
- [技術スタック](../../../../docs/tech-stack.md)
