# J-Quants MCP Server データフロー図

## 概要 🔵

このドキュメントは、J-Quants MCP Serverのデータフローを可視化します。システム内でのデータの流れ、各コンポーネント間のやり取り、エラーハンドリングのフローを詳細に記述します。

**要件根拠**: 要件定義書全体（REQ-001～REQ-1202）、architecture.md

---

## システム全体のデータフロー 🔵

### 概要図

```mermaid
flowchart LR
    User[ユーザー] -->|対話| Claude[Claude Desktop]
    Claude -->|MCP Protocol| MCP[MCPサーバー]
    MCP -->|ツール呼び出し| Tools[MCPツール群]
    Tools -->|API呼び出し| Client[JQuantsClient]
    Client -->|HTTPS| API[J-Quants API]
    Client -->|トークン読み書き| Token[(token.json)]
    Client -->|ログ記録| Logs[(logs/)]

    style User fill:#e1f5ff
    style Claude fill:#fff3e0
    style MCP fill:#f3e5f5
    style Tools fill:#e8f5e9
    style Client fill:#fff9c4
    style API fill:#ffebee
    style Token fill:#e0f2f1
    style Logs fill:#fce4ec
```

**要件根拠**: REQ-1001, REQ-1002, REQ-1003, REQ-602

---

## Phase 1: 起動・認証フロー 🔵

### 1.1 システム起動時の認証

```mermaid
sequenceDiagram
    autonumber
    participant User as ユーザー
    participant Claude as Claude Desktop
    participant MCP as MCPサーバー<br/>index.ts
    participant TM as TokenManager<br/>token-manager.ts
    participant FS as FileSystem<br/>data/token.json
    participant JQ as J-Quants API<br/>/token/auth_user<br/>/token/auth_refresh

    User->>Claude: Claude Desktop起動
    Claude->>MCP: MCPサーバー起動
    Note over MCP: process.env読み込み<br/>REQ-1101
    MCP->>TM: authenticate()呼び出し

    TM->>FS: token.jsonを読み込み試行

    alt トークンキャッシュが存在し有効
        FS-->>TM: キャッシュされたIDトークン
        TM->>TM: 有効期限チェック
        TM-->>MCP: IDトークン返却
        MCP-->>Claude: 起動完了
    else トークンが存在しないor無効
        TM->>JQ: POST /token/auth_user<br/>(refresh_token)
        JQ-->>TM: IDトークン返却
        TM->>FS: token.jsonに保存<br/>REQ-003
        TM-->>MCP: IDトークン返却
        MCP-->>Claude: 起動完了
    else 認証エラー
        JQ-->>TM: 401 Unauthorized
        TM->>TM: エラーメッセージ生成
        TM-->>MCP: 認証エラー
        MCP-->>Claude: エラー表示
        MCP->>User: 「環境変数 J_QUANTS_REFRESH_TOKEN を確認してください」
    end
```

**要件根拠**:
- REQ-001: 起動時にJ-Quants APIへの認証を実行
- REQ-002: リフレッシュトークンを使用してIDトークンを取得
- REQ-003: 取得したIDトークンをJSONファイルにキャッシュ
- REQ-1101: APIキー・リフレッシュトークンを環境変数から読み込み

**信頼性**: 🔵 要件定義書に基づく

---

### 1.2 トークン再取得フロー（有効期限切れ時）

```mermaid
sequenceDiagram
    autonumber
    participant Tool as MCPツール
    participant Client as JQuantsClient
    participant TM as TokenManager
    participant JQ as J-Quants API
    participant FS as FileSystem

    Tool->>Client: API呼び出し（getListedInfo等）
    Client->>JQ: HTTPリクエスト<br/>(Authorization: Bearer <token>)
    JQ-->>Client: 401 Unauthorized

    Note over Client: トークン有効期限切れを検出<br/>REQ-604

    Client->>TM: refreshToken()呼び出し
    TM->>JQ: POST /token/auth_user<br/>(refresh_token)
    JQ-->>TM: 新しいIDトークン
    TM->>FS: token.jsonを更新
    TM-->>Client: 新しいIDトークン

    Client->>JQ: HTTPリクエスト再実行<br/>(新しいtoken)
    JQ-->>Client: 200 OK + データ
    Client-->>Tool: データ返却
```

**要件根拠**: REQ-604（認証トークンの有効期限が切れた場合、自動的にトークンを再取得）

**信頼性**: 🔵 要件定義書に基づく

---

## Phase 2: MCPツール呼び出しフロー 🔵

### 2.1 get_listed_companies フロー

```mermaid
sequenceDiagram
    autonumber
    participant User as ユーザー
    participant Claude as Claude Desktop
    participant MCP as MCPサーバー
    participant Tool as get_listed_companies
    participant Val as Validator
    participant Client as JQuantsClient
    participant JQ as J-Quants API<br/>/listed/info
    participant Logger as Logger

    User->>Claude: 「プライム市場の銘柄一覧を表示して」
    Claude->>MCP: get_listed_companies<br/>{ market: "プライム" }
    MCP->>Tool: ツール実行

    Tool->>Val: パラメータバリデーション
    Val->>Val: オプションパラメータなのでスキップ
    Val-->>Tool: バリデーション成功

    Tool->>Client: getListedInfo({ market: "プライム" })
    Client->>JQ: GET /listed/info<br/>Authorization: Bearer <token>
    JQ-->>Client: 200 OK + 銘柄データ

    Client-->>Tool: Company[]
    Tool->>Tool: 市場区分でフィルタリング<br/>REQ-501
    Tool-->>MCP: { companies: [...] }
    MCP-->>Claude: JSON形式で返却
    Claude-->>User: 「プライム市場の銘柄は以下です...」
```

**要件根拠**:
- REQ-101: 上場銘柄一覧を取得するMCPツール提供
- REQ-102: 銘柄コード、会社名、市場区分、業種を含む
- REQ-501: 市場区分パラメータが指定された場合、指定された市場の銘柄のみを返却

**信頼性**: 🔵 要件定義書に基づく

---

### 2.2 get_stock_price フロー（正常系）

```mermaid
sequenceDiagram
    autonumber
    participant User as ユーザー
    participant Claude as Claude Desktop
    participant MCP as MCPサーバー
    participant Tool as get_stock_price
    participant Val as Validator
    participant Client as JQuantsClient
    participant JQ as J-Quants API<br/>/prices/daily_quotes

    User->>Claude: 「トヨタ自動車（7203）の<br/>2024年1月から3月の株価を教えて」
    Claude->>MCP: get_stock_price<br/>{ code: "7203",<br/> from_date: "2024-01-01",<br/> to_date: "2024-03-31" }
    MCP->>Tool: ツール実行

    Tool->>Val: パラメータバリデーション
    Val->>Val: codeが必須パラメータ<br/>REQ-701チェック
    Val->>Val: 日付フォーマットチェック（YYYY-MM-DD）
    Val-->>Tool: バリデーション成功

    Tool->>Client: getDailyQuotes({<br/> code: "7203",<br/> from: "2024-01-01",<br/> to: "2024-03-31" })
    Client->>JQ: GET /prices/daily_quotes<br/>?code=7203&from=2024-01-01&to=2024-03-31<br/>Authorization: Bearer <token>
    JQ-->>Client: 200 OK + 株価データ

    Client-->>Tool: StockPrice[]
    Tool->>Tool: 日付降順ソート<br/>REQ-203
    Tool-->>MCP: { code: "7203", prices: [...] }
    MCP-->>Claude: JSON形式で返却
    Claude-->>User: 「トヨタ自動車の株価データです...<br/>（表形式で表示）」
```

**要件根拠**:
- REQ-201: 指定銘柄の株価データを取得するMCPツール提供
- REQ-202: 株価データに始値・高値・安値・終値・出来高を含む
- REQ-203: 株価データを日付降順で返却
- REQ-503: 取得開始日パラメータが指定された場合、指定日以降の株価データを返却
- REQ-504: 取得終了日パラメータが指定された場合、指定日以前の株価データを返却
- REQ-701: 必須パラメータが未指定の場合、エラーメッセージを返却

**信頼性**: 🔵 要件定義書に基づく

---

### 2.3 get_financial_statements フロー

```mermaid
sequenceDiagram
    autonumber
    participant User as ユーザー
    participant Claude as Claude Desktop
    participant MCP as MCPサーバー
    participant Tool as get_financial_statements
    participant Val as Validator
    participant Client as JQuantsClient
    participant JQ as J-Quants API<br/>/fins/statements

    User->>Claude: 「トヨタ自動車の財務諸表を見せて」
    Claude->>MCP: get_financial_statements<br/>{ code: "7203" }
    MCP->>Tool: ツール実行

    Tool->>Val: パラメータバリデーション
    Val->>Val: codeが必須パラメータ確認
    Val-->>Tool: バリデーション成功

    Tool->>Client: getFinancialStatements({ code: "7203" })
    Client->>JQ: GET /fins/statements?code=7203<br/>Authorization: Bearer <token>
    JQ-->>Client: 200 OK + 財務諸表データ

    Client-->>Tool: FinancialStatements
    Tool->>Tool: BS・PL・CFデータを整形<br/>REQ-302
    Tool-->>MCP: { code: "7203",<br/> balance_sheet: {...},<br/> profit_loss: {...},<br/> cash_flow: {...} }
    MCP-->>Claude: JSON形式で返却
    Claude-->>User: 「トヨタ自動車の財務諸表です...<br/>総資産: XX億円...」
```

**要件根拠**:
- REQ-301: 指定銘柄の財務諸表を取得するMCPツール提供
- REQ-302: 貸借対照表・損益計算書・キャッシュフロー計算書を含む

**信頼性**: 🔵 要件定義書に基づく

---

### 2.4 get_company_info フロー

```mermaid
sequenceDiagram
    autonumber
    participant User as ユーザー
    participant Claude as Claude Desktop
    participant MCP as MCPサーバー
    participant Tool as get_company_info
    participant Val as Validator
    participant Client as JQuantsClient
    participant JQ as J-Quants API

    User->>Claude: 「7203の企業情報を教えて」
    Claude->>MCP: get_company_info<br/>{ code: "7203" }
    MCP->>Tool: ツール実行

    Tool->>Val: パラメータバリデーション
    Val-->>Tool: バリデーション成功

    Tool->>Client: getListedInfo({ code: "7203" })
    Client->>JQ: GET /listed/info?code=7203
    JQ-->>Client: 銘柄情報

    Tool->>Client: getDailyQuotes({ code: "7203", limit: 1 })
    Client->>JQ: GET /prices/daily_quotes?code=7203
    JQ-->>Client: 最新株価

    Client-->>Tool: Company + LatestPrice
    Tool->>Tool: 前日比・変動率計算<br/>REQ-402
    Tool-->>MCP: { code, name, market,<br/> sector, latest_price: {...} }
    MCP-->>Claude: JSON形式で返却
    Claude-->>User: 「トヨタ自動車<br/>市場: プライム<br/>最新株価: 2,830円...」
```

**要件根拠**:
- REQ-401: 指定銘柄の企業詳細情報を取得するMCPツール提供
- REQ-402: 銘柄コード、会社名、市場区分、業種、最新株価を含む

**信頼性**: 🔵 要件定義書に基づく

---

## Phase 3: エラーハンドリングフロー 🔵

### 3.1 リトライロジック（一時的エラー）

```mermaid
sequenceDiagram
    autonumber
    participant Tool as MCPツール
    participant Client as JQuantsClient
    participant Retry as RetryLogic
    participant JQ as J-Quants API
    participant Logger as Logger

    Tool->>Client: API呼び出し
    Client->>Retry: retryableRequest(fn, maxRetries=3)

    loop 最大3回リトライ
        Retry->>JQ: HTTPリクエスト（試行1）
        JQ-->>Retry: 503 Service Unavailable
        Note over Retry: 一時的エラーと判定<br/>REQ-601
        Retry->>Retry: wait 1秒（Exponential backoff）

        Retry->>JQ: HTTPリクエスト（試行2）
        JQ-->>Retry: 503 Service Unavailable
        Retry->>Retry: wait 2秒

        Retry->>JQ: HTTPリクエスト（試行3）
        JQ-->>Retry: 200 OK + データ
    end

    Retry-->>Client: データ返却
    Client-->>Tool: データ返却

    Note over Logger: エラーは発生したが<br/>最終的に成功したため<br/>ログ記録は最小限
```

**要件根拠**:
- REQ-601: API呼び出しが一時的エラーで失敗した場合、最大3回まで自動的に再試行

**信頼性**: 🔵 要件定義書・ユーザーヒアリングに基づく

---

### 3.2 エラーログ記録フロー

```mermaid
sequenceDiagram
    autonumber
    participant Tool as MCPツール
    participant Client as JQuantsClient
    participant Retry as RetryLogic
    participant JQ as J-Quants API
    participant EH as ErrorHandler
    participant Logger as Logger
    participant FS as FileSystem<br/>logs/error.log

    Tool->>Client: API呼び出し
    Client->>Retry: retryableRequest(fn, maxRetries=3)

    loop 最大3回リトライ
        Retry->>JQ: HTTPリクエスト
        JQ-->>Retry: 503 Service Unavailable
    end

    Note over Retry: 3回リトライしても失敗<br/>REQ-601, REQ-602

    Retry-->>Client: エラーをthrow
    Client->>EH: handleError(error)

    EH->>Logger: logError({<br/> timestamp,<br/> endpoint,<br/> statusCode,<br/> message<br/>})
    Logger->>FS: error.logに追記<br/>REQ-602

    EH->>EH: エラーメッセージ生成<br/>「J-Quants APIがメンテナンス中です」
    EH-->>Client: エラーメッセージ（日本語）<br/>NFR-301
    Client-->>Tool: エラーメッセージ
    Tool-->>MCP: エラー返却
```

**要件根拠**:
- REQ-601: 最大3回まで自動的に再試行
- REQ-602: API呼び出しが失敗した場合、エラー内容をログファイルに記録
- NFR-301: エラーメッセージを日本語で分かりやすく表示

**信頼性**: 🔵 要件定義書・ユーザーヒアリングに基づく

---

### 3.3 タイムアウト処理フロー

```mermaid
sequenceDiagram
    autonumber
    participant Tool as MCPツール
    participant Client as JQuantsClient
    participant JQ as J-Quants API
    participant EH as ErrorHandler

    Tool->>Client: API呼び出し
    Client->>Client: タイマー設定（5秒）<br/>REQ-603
    Client->>JQ: HTTPリクエスト<br/>(AbortSignal付与)

    Note over JQ: レスポンス遅延<br/>（5秒以上）

    Client->>Client: タイムアウト検出
    Client->>Client: リクエストをAbort

    Client->>EH: handleError(TimeoutError)
    EH->>EH: エラーメッセージ生成<br/>「APIの応答がタイムアウトしました（5秒）」
    EH-->>Client: エラーメッセージ
    Client-->>Tool: タイムアウトエラー
    Tool-->>MCP: エラー返却
```

**要件根拠**:
- REQ-603: APIリクエストが5秒以内に完了しない場合、タイムアウトエラーを返却
- NFR-001: システムは1つのAPIリクエストを5秒以内に完了

**信頼性**: 🔵 要件定義書・ユーザーヒアリングに基づく

---

### 3.4 バリデーションエラーフロー

```mermaid
sequenceDiagram
    autonumber
    participant User as ユーザー
    participant Claude as Claude Desktop
    participant MCP as MCPサーバー
    participant Tool as get_stock_price
    participant Val as Validator
    participant EH as ErrorHandler

    User->>Claude: 「株価を教えて」<br/>（銘柄コード指定なし）
    Claude->>MCP: get_stock_price<br/>{ }  # codeパラメータなし
    MCP->>Tool: ツール実行

    Tool->>Val: パラメータバリデーション
    Val->>Val: 必須パラメータ'code'が未指定<br/>REQ-701
    Val->>EH: ValidationError発生
    EH->>EH: エラーメッセージ生成<br/>「銘柄コード（code）は必須パラメータです」
    EH-->>Val: エラーメッセージ
    Val-->>Tool: バリデーションエラー
    Tool-->>MCP: エラー返却
    MCP-->>Claude: エラーメッセージ
    Claude-->>User: 「銘柄コード（code）は<br/>必須パラメータです。<br/>銘柄コードを指定してください」
```

**要件根拠**:
- REQ-701: 必須パラメータが未指定の場合、分かりやすいエラーメッセージを返却

**信頼性**: 🔵 要件定義書・ユーザーヒアリングに基づく

---

## Phase 4: データ処理フロー 🟡

### 4.1 銘柄データのフィルタリング

```mermaid
flowchart TD
    Start([get_listed_companies呼び出し]) --> GetAll[J-Quants APIから全銘柄取得]
    GetAll --> CheckMarket{market<br/>パラメータ<br/>指定あり?}

    CheckMarket -->|Yes| FilterMarket[市場区分でフィルタリング<br/>REQ-501]
    CheckMarket -->|No| CheckSector

    FilterMarket --> CheckSector{sector<br/>パラメータ<br/>指定あり?}

    CheckSector -->|Yes| FilterSector[業種コードでフィルタリング<br/>REQ-502]
    CheckSector -->|No| Return

    FilterSector --> Return([フィルタリング済み<br/>銘柄一覧を返却])

    style Start fill:#e1f5ff
    style Return fill:#c8e6c9
    style FilterMarket fill:#fff9c4
    style FilterSector fill:#fff9c4
```

**要件根拠**:
- REQ-501: 市場区分パラメータが指定された場合、指定された市場の銘柄のみを返却
- REQ-502: 業種コードパラメータが指定された場合、指定された業種の銘柄のみを返却

**信頼性**: 🔵 要件定義書に基づく

---

### 4.2 株価データのソート

```mermaid
flowchart TD
    Start([get_stock_price呼び出し]) --> GetPrices[J-Quants APIから株価データ取得]
    GetPrices --> Parse[JSONレスポンスをパース]
    Parse --> Sort[日付降順ソート<br/>REQ-203]
    Sort --> Format[StockPrice[]型に変換]
    Format --> Return([株価データを返却])

    style Start fill:#e1f5ff
    style Return fill:#c8e6c9
    style Sort fill:#fff9c4
```

**要件根拠**:
- REQ-203: 株価データを日付降順（新しい順）で返却

**信頼性**: 🔵 要件定義書に基づく

---

### 4.3 企業情報と最新株価の統合

```mermaid
flowchart TD
    Start([get_company_info呼び出し]) --> GetCompany[銘柄情報取得<br/>/listed/info]
    GetCompany --> GetPrice[最新株価取得<br/>/prices/daily_quotes]
    GetPrice --> Calc[前日比・変動率計算]
    Calc --> Merge[銘柄情報 + 最新株価を統合<br/>REQ-402]
    Merge --> Return([企業情報を返却])

    style Start fill:#e1f5ff
    style Return fill:#c8e6c9
    style Calc fill:#fff9c4
    style Merge fill:#fff9c4
```

**要件根拠**:
- REQ-402: 企業情報に銘柄コード、会社名、市場区分、業種、最新株価を含める

**信頼性**: 🔵 要件定義書に基づく

---

## Phase 5: ログ・モニタリングフロー 🟡

### 5.1 ログ記録フロー

```mermaid
flowchart TD
    Start([イベント発生]) --> Type{イベント種別}

    Type -->|エラー| LogError[error.logに記録<br/>REQ-602]
    Type -->|デバッグ| CheckDebug{デバッグモード<br/>有効?}
    Type -->|情報| LogInfo[info.logに記録]

    CheckDebug -->|Yes| LogDebug[debug.logに記録<br/>REQ-901]
    CheckDebug -->|No| Skip[スキップ]

    LogError --> Format[タイムスタンプ + メッセージ]
    LogDebug --> Format
    LogInfo --> Format

    Format --> Write[ファイルに追記]
    Write --> End([完了])
    Skip --> End

    style Start fill:#e1f5ff
    style End fill:#c8e6c9
    style LogError fill:#ffcdd2
    style LogDebug fill:#fff9c4
```

**要件根拠**:
- REQ-602: API呼び出しが失敗した場合、エラー内容をログファイルに記録
- REQ-901: デバッグモードでAPIリクエスト・レスポンスの詳細をログ出力してもよい

**信頼性**: 🔵🟡 要件定義書に基づく（デバッグモードは🟡推測）

---

## Phase 6: パフォーマンス最適化フロー 🟡

### 6.1 レート制限対応フロー

```mermaid
sequenceDiagram
    autonumber
    participant Client as JQuantsClient
    participant RateLimit as RateLimiter
    participant JQ as J-Quants API
    participant Logger as Logger

    Client->>RateLimit: checkRateLimit()
    RateLimit->>RateLimit: 直近のリクエスト数確認

    alt レート制限内
        RateLimit-->>Client: OK
        Client->>JQ: HTTPリクエスト
        JQ-->>Client: 200 OK
    else レート制限超過
        JQ-->>Client: 429 Too Many Requests
        Client->>RateLimit: handleRateLimitError()
        RateLimit->>Logger: ログ記録
        RateLimit->>RateLimit: 待機時間計算
        RateLimit->>Client: wait(適切な時間)
        Client->>JQ: HTTPリクエスト再実行<br/>REQ-605
        JQ-->>Client: 200 OK
    end
```

**要件根拠**:
- REQ-605: レート制限エラーが発生した場合、適切な待機時間後に再試行

**信頼性**: 🔵 要件定義書に基づく

---

## データ構造の変換フロー 🟡

### 7.1 J-Quants API → MCPツール 型変換

```mermaid
flowchart LR
    JQ[J-Quants API<br/>Response] --> Parse[JSONパース]
    Parse --> Map[フィールドマッピング]
    Map --> Validate[型バリデーション]
    Validate --> Transform[TypeScript型に変換]
    Transform --> MCP[MCPツール<br/>Response]

    style JQ fill:#ffebee
    style MCP fill:#c8e6c9
    style Transform fill:#fff9c4
```

**例**:
```
J-Quants API: { Code: "7203", CompanyName: "トヨタ自動車(株)" }
        ↓
変換処理: フィールド名を小文字に、株式会社を除去
        ↓
MCP Response: { code: "7203", name: "トヨタ自動車" }
```

**信頼性**: 🟡 実装詳細から推測

---

## まとめ 🔵

### 主要なデータフロー

1. **起動・認証**: リフレッシュトークン → IDトークン → キャッシュ
2. **MCPツール呼び出し**: Claude → MCP → Tools → API Client → J-Quants API
3. **エラーハンドリング**: リトライ → ログ記録 → エラーメッセージ
4. **データ処理**: フィルタリング → ソート → 型変換

### パフォーマンスへの配慮

- トークンキャッシュによる認証回数削減
- タイムアウト設定（5秒）
- Exponential backoffによるリトライ
- レート制限への対応

### 可読性・保守性への配慮

- レイヤードアーキテクチャによる関心の分離
- エラーハンドリングの一元管理
- 日本語エラーメッセージ
- 詳細なログ記録

---

## 参考資料

- アーキテクチャ設計: `architecture.md`
- 要件定義書: `../spec/j-quants-requirements.md`
- J-Quants API: https://jpx.gitbook.io/j-quants-ja
- MCP仕様: https://modelcontextprotocol.io/

---

## 更新履歴

- 2025-10-29: 初版作成（kairo-design コマンドにより作成）
  - 7つの主要データフローを可視化（Mermaid）
  - 各フローに要件根拠を明記
  - 信頼性レベル（🔵🟡🔴）の明記
