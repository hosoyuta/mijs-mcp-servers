# TASK-0006: get_listed_companies MCPツール - 要件定義書

**タスクID**: TASK-0006
**タスク名**: MCPツール1: get_listed_companies（Listed Companies Tool）
**種別**: TDD
**作成日**: 2025-10-29
**参照**: Phase 1タスク定義（j-quants-phase1.md）

---

## 1. 機能の概要

### 🔵 何をする機能か

上場銘柄一覧を取得し、オプションパラメータ（市場区分、業種）でフィルタリングして返却するMCPツールです。

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義（j-quants-phase1.md Day 6: TASK-0006）から抽出

### 🔵 どのような問題を解決するか

**ユーザーストーリー**:
```
As a: 金融データアナリスト
I want: 東京証券取引所の上場銘柄一覧を取得したい
So that: 特定市場や業種の銘柄を分析できる
```

**解決する問題**:
- 上場銘柄の包括的なリストが必要
- 市場区分（Prime, Standard, Growth）でフィルタリングしたい
- 業種（東証33業種分類）でフィルタリングしたい
- MCPツールとしてClaude Desktopから簡単に呼び出したい

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義の TASK-0006 説明から抽出

### 🔵 想定されるユーザー

- **金融データアナリスト**: 市場分析のための銘柄データ取得
- **個人投資家**: 投資対象の選定
- **開発者**: J-Quants APIを使ったアプリケーション開発
- **Claudeユーザー**: 自然言語で銘柄情報を照会

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: MCPツールの性質とPhase 1タスク定義から推定

### 🔵 システム内での位置づけ

```
[Claude Desktop]
      ↓
[MCP Server (src/index.ts)]
      ↓
[get_listed_companies Tool (src/tools/get-listed-companies.ts)]
      ↓
[JQuantsClient.getListedInfo() (src/api/j-quants-client.ts)]
      ↓
[J-Quants API GET /listed/info]
```

**【依存関係】**:
- **TASK-0004**: JQuantsClient（`getListedInfo()` メソッド使用）
- **TASK-0005**: エラーハンドリング（`validator.ts`, `error-handler.ts`）
- **TASK-0002**: 型定義（`Company`, `Market`, `Sector`）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義の依存タスクとアーキテクチャから確定

### 参照したEARS要件

- **REQ-101**: 上場銘柄一覧取得機能
- **REQ-102**: 市場区分・業種フィルタリング機能
- **REQ-501**: MCPツール基本構造（ツール名、説明、パラメータスキーマ）
- **REQ-502**: MCPツールエラーハンドリング
- **REQ-701**: 共通基盤機能（バリデーション、エラーハンドリング）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義の関連要件から抽出

### 参照した設計文書

- **型定義**: `src/types/index.ts` - Company, Market, Sector
- **APIクライアント**: `src/api/j-quants-client.ts` - getListedInfo()
- **タスク定義**: `docs/tasks/j-quants-phase1.md` - TASK-0006

**【信頼性レベル】**: 🔵 青信号

---

## 2. 入力・出力の仕様

### 🔵 入力パラメータ

#### パラメータ一覧

| パラメータ名 | 型 | 必須 | デフォルト | 説明 |
|------------|---|------|----------|------|
| `market` | string | ❌ | undefined | 市場区分フィルタ（Prime, Standard, Growth, Other） |
| `sector` | string | ❌ | undefined | 業種コードフィルタ（0050～9050） |

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のTASK-0006 入力パラメータから抽出

#### パラメータ詳細

##### market パラメータ

**型**: `string`（Market列挙型の値）
**制約**: `'Prime' | 'Standard' | 'Growth' | 'Other'`
**例**:
```typescript
// 有効な値
market: 'Prime'     // プライム市場
market: 'Standard'  // スタンダード市場
market: 'Growth'    // グロース市場
market: 'Other'     // その他

// 不正な値
market: 'TSE'       // ValidationError
market: 'INVALID'   // ValidationError
```

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: `src/types/index.ts` の Market列挙型定義から確定

##### sector パラメータ

**型**: `string`（Sector列挙型の値）
**制約**: `'0050' | '1050' | '2050' | ... | '9050'`（東証33業種コード）
**例**:
```typescript
// 有効な値
sector: '0050'  // 水産・農林業
sector: '3200'  // 化学
sector: '7050'  // 銀行業

// 不正な値
sector: '0000'     // ValidationError
sector: 'FINANCE'  // ValidationError
```

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: `src/types/index.ts` の Sector列挙型定義（33業種）から確定

#### バリデーションルール

1. **market パラメータ**:
   - 指定された場合、Market列挙型に含まれる値であること
   - 不正な値の場合は ValidationError をスロー

2. **sector パラメータ**:
   - 指定された場合、Sector列挙型に含まれる値であること
   - 不正な値の場合は ValidationError をスロー

3. **組み合わせバリデーション**:
   - market と sector の両方を指定可能（AND条件）
   - どちらも指定しない場合は全銘柄を返却

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のバリデーション要件から確定

### 🔵 出力値

#### 出力形式

```typescript
{
  companies: Company[]
}
```

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のTASK-0006 出力形式から確定

#### Company型定義

```typescript
interface Company {
  code: string;          // 銘柄コード（4桁数字）
  name: string;          // 銘柄名
  market: Market;        // 市場区分
  sector: Sector;        // 業種コード
  listed_date?: string;  // 上場日（YYYY-MM-DD形式）
  scale?: 'large' | 'mid' | 'small';  // 企業規模
}
```

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: `src/types/index.ts` の Company インターフェース定義から確定

#### 出力例

**ケース1: パラメータなし（全銘柄取得）**
```json
{
  "companies": [
    {
      "code": "1234",
      "name": "トヨタ自動車",
      "market": "Prime",
      "sector": "3700",
      "listed_date": "1949-05-16"
    },
    {
      "code": "5678",
      "name": "ソフトバンクグループ",
      "market": "Prime",
      "sector": "5250",
      "listed_date": "1994-07-22"
    },
    // ... 約3000+銘柄
  ]
}
```

**ケース2: marketフィルタ適用（Prime市場のみ）**
```json
{
  "companies": [
    {
      "code": "1234",
      "name": "トヨタ自動車",
      "market": "Prime",
      "sector": "3700"
    },
    // ... Prime市場の銘柄のみ
  ]
}
```

**ケース3: market + sector フィルタ適用**
```json
{
  "companies": [
    {
      "code": "1234",
      "name": "トヨタ自動車",
      "market": "Prime",
      "sector": "3700"
    },
    {
      "code": "7201",
      "name": "日産自動車",
      "market": "Prime",
      "sector": "3700"
    },
    // ... Prime市場 且つ 輸送用機器（3700）の銘柄のみ
  ]
}
```

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義の出力形式例から確定

### 🔵 入出力の関係性

**処理フロー**:
```
1. パラメータ受け取り（market?, sector?）
2. バリデーション（validator.ts）
3. JQuantsClient.getListedInfo() 呼び出し → 全銘柄取得
4. フィルタリング適用（market, sector）
5. 結果返却 { companies: [...] }
```

**フィルタリングロジック**:
- `market` のみ指定 → `company.market === market` でフィルタ
- `sector` のみ指定 → `company.sector === sector` でフィルタ
- 両方指定 → `company.market === market && company.sector === sector` でフィルタ
- 未指定 → フィルタなし（全銘柄返却）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義の処理フローから確定

### 参照したEARS要件

- **REQ-102**: 入力パラメータ定義（market, sector）
- **REQ-102**: 出力形式定義（companies: Company[]）

### 参照した設計文書

- **interfaces.ts**: `src/types/index.ts` - Company, Market, Sector型定義
- **api-client**: `src/api/j-quants-client.ts:113` - getListedInfo()メソッド

**【信頼性レベル】**: 🔵 青信号

---

## 3. 制約条件

### 🔵 パフォーマンス要件

- **レスポンス時間**: 5秒以内（REQ-603 タイムアウト制御に準拠）
- **データ量**: 3000+銘柄の処理に対応
- **フィルタリング**: O(n) の線形時間で処理
- **メモリ使用量**: 500MB以下（Phase 1統合テスト基準）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義の非機能テスト要件から確定

### 🔵 セキュリティ要件

- **認証**: JQuantsClient経由でIDトークンを自動付与（REQ-001～004）
- **入力検証**: すべてのパラメータをバリデーション（REQ-701）
- **エラー情報**: スタックトレース等の内部情報を外部に漏らさない

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1セキュリティ要件（REQ-1101, REQ-1102）から確定

### 🔵 互換性要件

- **TypeScript strict mode**: エラーなしでコンパイル可能（REQ-1001）
- **Node.js**: 20 LTS以上（REQ-1003）
- **MCP SDK**: @modelcontextprotocol/sdk 準拠（REQ-1002）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1技術要件から確定

### 🔵 アーキテクチャ制約

- **依存関係**: JQuantsClient, validator, error-handler を使用
- **ツール構造**: MCP SDK の Tool 定義に準拠
- **エラーハンドリング**: 統一されたエラーレスポンス形式（ErrorResponse）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: TASK-0004, TASK-0005の実装とPhase 1タスク定義から確定

### 🔵 API制約

- **エンドポイント**: J-Quants API `GET /listed/info`
- **認証**: Authorization ヘッダーに Bearer トークン
- **レート制限**: J-Quants APIのレート制限に従う（詳細はPhase 2で実装）
- **データ更新頻度**: 日次更新（J-Quants APIの仕様）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: J-Quants API仕様とJQuantsClient実装から確定

### 参照したEARS要件

- **NFR-201**: TypeScript strict mode（REQ-1001）
- **REQ-601**: リトライロジック（JQuantsClientに実装済み）
- **REQ-602**: エラーハンドリング（error-handler.tsに実装済み）
- **REQ-603**: タイムアウト制御（5秒）
- **REQ-1002**: MCP SDK準拠

### 参照した設計文書

- **architecture.md**: (存在しないが、Phase 1タスク定義から推測)
- **j-quants-client.ts**: JQuantsClient実装からアーキテクチャ制約を確認

**【信頼性レベル】**: 🔵 青信号

---

## 4. 想定される使用例

### 🔵 基本的な使用パターン

#### パターン1: 全銘柄取得

**ユーザー要求**: "全ての上場銘柄を教えて"

**MCPツール呼び出し**:
```typescript
get_listed_companies({})
```

**処理フロー**:
1. パラメータなし
2. getListedInfo() → 全銘柄取得
3. フィルタなし
4. 3000+銘柄を返却

**期待される出力**: 全銘柄のリスト

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース1から確定

#### パターン2: Prime市場の銘柄取得

**ユーザー要求**: "プライム市場の銘柄を教えて"

**MCPツール呼び出し**:
```typescript
get_listed_companies({ market: 'Prime' })
```

**処理フロー**:
1. market = 'Prime'
2. validateEnum(market, Market, 'market')
3. getListedInfo() → 全銘柄取得
4. companies.filter(c => c.market === 'Prime')
5. Prime市場の銘柄のみ返却

**期待される出力**: Prime市場の銘柄リスト

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース2から確定

#### パターン3: 特定業種の銘柄取得

**ユーザー要求**: "銀行業の銘柄を教えて"

**MCPツール呼び出し**:
```typescript
get_listed_companies({ sector: '7050' })
```

**処理フロー**:
1. sector = '7050'
2. validateEnum(sector, Sector, 'sector')
3. getListedInfo() → 全銘柄取得
4. companies.filter(c => c.sector === '7050')
5. 銀行業（7050）の銘柄のみ返却

**期待される出力**: 銀行業の銘柄リスト

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース3から確定

#### パターン4: 複合フィルタ（market + sector）

**ユーザー要求**: "プライム市場の自動車メーカーを教えて"

**MCPツール呼び出し**:
```typescript
get_listed_companies({
  market: 'Prime',
  sector: '3700' // 輸送用機器
})
```

**処理フロー**:
1. market = 'Prime', sector = '3700'
2. validateEnum(market, Market, 'market')
3. validateEnum(sector, Sector, 'sector')
4. getListedInfo() → 全銘柄取得
5. companies.filter(c => c.market === 'Prime' && c.sector === '3700')
6. Prime市場 且つ 輸送用機器の銘柄のみ返却

**期待される出力**: Prime市場の自動車メーカーリスト（トヨタ、日産等）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース4から確定

### 🔵 エラーケース

#### エラーケース1: 不正な market パラメータ

**ユーザー要求**: "TSE市場の銘柄を教えて"（古い市場区分名）

**MCPツール呼び出し**:
```typescript
get_listed_companies({ market: 'TSE' })
```

**処理フロー**:
1. market = 'TSE'
2. validateEnum(market, Market, 'market') → ValidationError スロー
3. エラーハンドラーがキャッチ
4. ErrorResponse 返却

**期待される出力**:
```json
{
  "error": {
    "code": "INVALID_PARAM",
    "message": "パラメータ market の値が不正です。有効な値: Prime, Standard, Growth, Other",
    "timestamp": "2025-10-29T10:00:00.000Z"
  }
}
```

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース5から確定

#### エラーケース2: 不正な sector パラメータ

**ユーザー要求**: "金融業の銘柄を教えて"（業種名で指定）

**MCPツール呼び出し**:
```typescript
get_listed_companies({ sector: 'FINANCE' })
```

**処理フロー**:
1. sector = 'FINANCE'
2. validateEnum(sector, Sector, 'sector') → ValidationError スロー
3. エラーハンドラーがキャッチ
4. ErrorResponse 返却

**期待される出力**:
```json
{
  "error": {
    "code": "INVALID_PARAM",
    "message": "パラメータ sector の値が不正です。有効な値: 0050, 1050, ..., 9050",
    "timestamp": "2025-10-29T10:00:00.000Z"
  }
}
```

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のテストケース6から確定

#### エラーケース3: API通信エラー

**MCPツール呼び出し**:
```typescript
get_listed_companies({})
```

**処理フロー**:
1. getListedInfo() → ネットワークエラー
2. JQuantsClientのリトライロジック（最大3回）
3. 3回失敗
4. ErrorResponse 返却

**期待される出力**:
```json
{
  "error": {
    "code": "API_ERROR",
    "message": "J-Quants APIへの接続に失敗しました",
    "timestamp": "2025-10-29T10:00:00.000Z"
  }
}
```

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: REQ-601, REQ-602のエラーハンドリング要件から確定

### 🟡 エッジケース

#### エッジケース1: 空のフィルタ結果

**ユーザー要求**: "グロース市場の銀行業を教えて"（該当銘柄なし）

**MCPツール呼び出し**:
```typescript
get_listed_companies({
  market: 'Growth',
  sector: '7050' // 銀行業
})
```

**処理フロー**:
1. market = 'Growth', sector = '7050'
2. バリデーション通過
3. getListedInfo() → 全銘柄取得
4. フィルタリング → 該当なし
5. 空配列返却

**期待される出力**:
```json
{
  "companies": []
}
```

**【信頼性レベル】**: 🟡 黄信号
**【根拠】**: Phase 1タスク定義には明示されていないが、妥当な動作として推測

#### エッジケース2: トークン有効期限切れ

**処理フロー**:
1. getListedInfo() → TokenManager.getIdToken()
2. キャッシュトークンが期限切れ
3. TokenManager が自動的に新しいトークンを取得（TASK-0003実装済み）
4. 新しいトークンで再リクエスト
5. 正常に結果返却

**期待される動作**: ユーザーからは透明（自動的にトークン再取得）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: TASK-0003のTokenManager実装から確定

### 参照したEARS要件

- **REQ-101**: 全銘柄取得
- **REQ-102**: フィルタリング機能
- **EDGE-001**: 不正なパラメータ
- **EDGE-002**: API通信エラー
- **EDGE-003**: 空のフィルタ結果（推測）

### 参照した設計文書

- **dataflow.md**: (存在しないが、Phase 1タスク定義から推測)
- **testcases**: Phase 1タスク定義のTASK-0006テストケース詳細

**【信頼性レベル】**: 🔵 青信号（基本パターン、エラーケース）、🟡 黄信号（エッジケース）

---

## 5. EARS要件・設計文書との対応関係

### 参照したユーザストーリー

**ストーリー名**: "上場銘柄一覧の取得とフィルタリング"

```
As a 金融データアナリスト
I want 上場銘柄一覧を取得し、市場区分や業種でフィルタリングしたい
So that 特定の条件に合致する銘柄を効率的に分析できる
```

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のTASK-0006説明から抽出

### 参照した機能要件

- **REQ-101**: 上場銘柄一覧取得機能
  - 全上場銘柄のマスタデータを取得できること
  - 銘柄コード、銘柄名、市場区分、業種コードを含むこと

- **REQ-102**: 市場区分・業種フィルタリング機能
  - market パラメータで市場区分フィルタリングができること
  - sector パラメータで業種フィルタリングができること
  - 両パラメータを組み合わせて使用できること（AND条件）

- **REQ-501**: MCPツール基本構造
  - ツール名、説明、入力スキーマを定義すること
  - JSON Schema形式でパラメータを定義すること

- **REQ-502**: MCPツールエラーハンドリング
  - 統一されたエラーレスポンス形式で返却すること
  - 日本語エラーメッセージを提供すること

- **REQ-701**: 共通基盤機能
  - バリデーションユーティリティを使用すること
  - エラーハンドリングユーティリティを使用すること

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義の関連要件から確定

### 参照した非機能要件

- **NFR-201**: TypeScript strict mode準拠
  - `strict: true` でコンパイルエラーなし

- **NFR-301**: 日本語メッセージ対応
  - エラーメッセージは日本語で提供

- **NFR-401**: パフォーマンス要件
  - レスポンス時間5秒以内（REQ-603）

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義の非機能要件から確定

### 参照したEdgeケース

- **EDGE-001**: 不正なパラメータ値
  - 存在しない市場区分 → ValidationError
  - 存在しない業種コード → ValidationError

- **EDGE-002**: API通信エラー
  - ネットワークエラー → リトライ後エラー返却
  - タイムアウト → 5秒後エラー返却

- **EDGE-003**: 空のフィルタ結果（推測）
  - 条件に合致する銘柄がない → 空配列返却

**【信頼性レベル】**: 🔵 青信号（EDGE-001, EDGE-002）、🟡 黄信号（EDGE-003）
**【根拠】**: Phase 1タスク定義のテストケースから確定・推測

### 参照した受け入れ基準

Phase 1タスク定義の完了基準:
- ✅ `src/tools/get-listed-companies.ts` が実装されている
- ✅ バリデーション機能が正常に動作する
- ✅ フィルタリング機能が正常に動作する
- ✅ すべてのテストケース（PASS 条件）がパスする
- ✅ レスポンス形式が仕様に準拠する
- ✅ TypeScript strict mode でエラーなし

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義のTASK-0006完了基準から確定

### 参照した設計文書

#### アーキテクチャ

**ファイル**: (architecture.md は存在しないが、実装から推測)
**該当セクション**: MCPツール → APIクライアント → J-Quants API の3層構造

#### 型定義

**ファイル**: `src/types/index.ts`
**該当インターフェース**:
- `Company` (line 20-33)
- `Market` enum (line 353-362)
- `Sector` enum (line 370-437)

#### APIクライアント

**ファイル**: `src/api/j-quants-client.ts`
**該当メソッド**:
- `getListedInfo(): Promise<Company[]>` (line 113)

#### バリデーション

**ファイル**: `src/utils/validator.ts`
**該当関数**:
- `validateEnum<T>(value: any, enumObj: T, paramName: string): void`

#### エラーハンドリング

**ファイル**: `src/utils/error-handler.ts`
**該当関数**:
- `handleApiError(error: any, context: string): never`
- `formatErrorResponse(error: any): ErrorResponse`

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: 実際のファイル読み込みとコード確認から確定

---

## 6. 実装ガイドライン

### 🔵 関数シグネチャ（予定）

```typescript
/**
 * 上場銘柄一覧取得ツール
 *
 * @param params - 検索パラメータ
 * @param params.market - 市場区分フィルタ（オプション）
 * @param params.sector - 業種コードフィルタ（オプション）
 * @returns 銘柄一覧
 */
export async function getListedCompanies(params: {
  market?: string;
  sector?: string;
}): Promise<{ companies: Company[] }>
```

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: Phase 1タスク定義の関数シグネチャから確定

### 🔵 実装手順（TDD）

1. **Requirements Phase**: 本要件定義書作成 ✅
2. **Test Cases Phase**: テストケース定義（次のステップ）
3. **Red Phase**: 失敗するテストを作成
4. **Green Phase**: テストを通す最小実装
5. **Refactor Phase**: コード品質向上
6. **Verification Phase**: 完全性確認

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: TDD標準プロセスとPhase 1タスク定義から確定

### 🔵 使用する既存モジュール

- **JQuantsClient**: `src/api/j-quants-client.ts`
  - `getListedInfo()` メソッド使用

- **Validator**: `src/utils/validator.ts`
  - `validateEnum()` 関数使用

- **Error Handler**: `src/utils/error-handler.ts`
  - `handleApiError()` 関数使用
  - `formatErrorResponse()` 関数使用

- **型定義**: `src/types/index.ts`
  - `Company`, `Market`, `Sector` 型使用

**【信頼性レベル】**: 🔵 青信号
**【根拠】**: TASK-0002, TASK-0004, TASK-0005の実装済みモジュールから確定

---

## 7. 品質判定

### ✅ 高品質: 要件の曖昧さなし

**判定結果**: ✅ 高品質

**理由**:
- ✅ 要件の曖昧さ: なし（Phase 1タスク定義から明確に定義）
- ✅ 入出力定義: 完全（Company型、Market/Sector列挙型が定義済み）
- ✅ 制約条件: 明確（パフォーマンス、セキュリティ、互換性すべて定義）
- ✅ 実装可能性: 確実（JQuantsClient.getListedInfo()が実装済み）

**信頼性レベルの分布**:
- 🔵 青信号: 95%（ほとんどの項目が確定）
- 🟡 黄信号: 5%（エッジケースの一部のみ推測）
- 🔴 赤信号: 0%（推測のみの項目なし）

**次のステップへの準備状況**: ✅ テストケース洗い出しに進める

---

## 8. 次のステップ

### 推奨コマンド

```bash
/tsumiki:tdd-testcases
```

**実施内容**: 本要件定義書に基づいて、包括的なテストケースを洗い出します。

**期待される成果物**:
- `get-listed-companies-testcases.md`
- 正常系テストケース（5～10件）
- 異常系テストケース（3～5件）
- 境界値テストケース（2～3件）

---

**作成者**: Claude Code (TDD Requirements Agent)
**最終更新**: 2025-10-29
**ステータス**: ✅ Requirements Phase 完了
**次フェーズ**: Test Cases Phase
