# J-Quants API統合設計

## 概要 🔵

このドキュメントは、J-Quants APIとの統合方法、認証フロー、エンドポイント仕様、リクエスト・レスポンス形式を詳細に記述します。

**要件根拠**: REQ-001～REQ-004（認証）、REQ-101～REQ-402（API呼び出し）
**信頼性**: 🔵 要件定義書・J-Quants API仕様に基づく

---

## J-Quants API概要

### APIベースURL 🔵
```
Production: https://api.jquants.com/v1
```

**要件根拠**: J-Quants API公式ドキュメント

### 認証方式 🔵
- **方式**: Bearer Token認証
- **トークン種別**: リフレッシュトークン → IDトークン
- **要件根拠**: REQ-001～REQ-004

---

## 認証エンドポイント 🔵

### 1. リフレッシュトークンからIDトークンを取得

**エンドポイント**: `POST /token/auth_user`

**目的**: リフレッシュトークンを使用してIDトークンを取得する

**要件根拠**: REQ-002

#### リクエスト

**ヘッダー**:
```http
Content-Type: application/json
```

**ボディ**:
```json
{
  "mailaddress": "user@example.com",  # オプション（通常不要）
  "password": "refresh_token_value"
}
```

または

```json
{
  "refreshtoken": "refresh_token_value"
}
```

#### レスポンス（成功時）

**ステータスコード**: `200 OK`

**ボディ**:
```json
{
  "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### レスポンス（エラー時）

**ステータスコード**: `401 Unauthorized`

**ボディ**:
```json
{
  "message": "Authentication failed"
}
```

**エラーハンドリング**: EDGE-003（APIキー未設定）に対応

---

### 2. IDトークンの更新

**エンドポイント**: `POST /token/auth_refresh`

**目的**: 有効期限切れのIDトークンを再取得する

**要件根拠**: REQ-604

#### リクエスト

**ヘッダー**:
```http
Authorization: Bearer <id_token>
```

#### レスポンス

レスポンス形式は `/token/auth_user` と同様

**要件根拠**: REQ-604（認証トークンの有効期限が切れた場合、自動的にトークンを再取得）

---

## データ取得エンドポイント 🔵

### 3. 上場銘柄一覧の取得

**エンドポイント**: `GET /listed/info`

**MCPツール**: `get_listed_companies`

**要件根拠**: REQ-101, REQ-102

#### リクエスト

**ヘッダー**:
```http
Authorization: Bearer <id_token>
```

**クエリパラメータ**: なし（全銘柄取得）

#### レスポンス（成功時）

**ステータスコード**: `200 OK`

**ボディ**:
```json
{
  "info": [
    {
      "Code": "7203",
      "CompanyName": "トヨタ自動車(株)",
      "CompanyNameEnglish": "Toyota Motor Corporation",
      "Sector17Code": "3050",
      "Sector17CodeName": "輸送用機器",
      "MarketCode": "0111",
      "MarketCodeName": "プライム"
    }
  ]
}
```

#### フィールドマッピング

| J-Quants APIフィールド | 内部型フィールド | 備考 |
|------------------------|-----------------|------|
| Code | code | 銘柄コード（4桁） |
| CompanyName | name | 会社名 |
| Sector17CodeName | sector | 業種名 |
| Sector17Code | sector_code | 業種コード |
| MarketCodeName | market | 市場区分 |

**フィルタリング**: REQ-501, REQ-502に基づき、内部でフィルタリングを実施

---

### 4. 株価データの取得

**エンドポイント**: `GET /prices/daily_quotes`

**MCPツール**: `get_stock_price`, `get_company_info`（最新株価）

**要件根拠**: REQ-201, REQ-202, REQ-203

#### リクエスト

**ヘッダー**:
```http
Authorization: Bearer <id_token>
```

**クエリパラメータ**:
| パラメータ | 型 | 必須 | 説明 | 要件根拠 |
|-----------|---|------|------|---------|
| code | string | Yes | 銘柄コード（例: 7203） | REQ-201 |
| from | string | No | 取得開始日（YYYY-MM-DD） | REQ-503 |
| to | string | No | 取得終了日（YYYY-MM-DD） | REQ-504 |

**例**:
```
GET /prices/daily_quotes?code=7203&from=2024-01-01&to=2024-03-31
```

#### レスポンス（成功時）

**ステータスコード**: `200 OK`

**ボディ**:
```json
{
  "daily_quotes": [
    {
      "Code": "7203",
      "Date": "2024-03-31",
      "Open": 2800.0,
      "High": 2850.0,
      "Low": 2790.0,
      "Close": 2830.0,
      "Volume": 15000000,
      "TurnoverValue": 42450000000,
      "AdjustmentFactor": 1.0,
      "AdjustmentOpen": 2800.0,
      "AdjustmentHigh": 2850.0,
      "AdjustmentLow": 2790.0,
      "AdjustmentClose": 2830.0,
      "AdjustmentVolume": 15000000
    }
  ]
}
```

#### フィールドマッピング

| J-Quants APIフィールド | 内部型フィールド | 備考 |
|------------------------|-----------------|------|
| Date | date | 日付（YYYY-MM-DD） |
| Open | open | 始値 |
| High | high | 高値 |
| Low | low | 安値 |
| Close | close | 終値 |
| Volume | volume | 出来高 |

**ソート**: REQ-203に基づき、日付降順（新しい順）でソート

---

### 5. 財務諸表の取得

**エンドポイント**: `GET /fins/statements`

**MCPツール**: `get_financial_statements`

**要件根拠**: REQ-301, REQ-302

#### リクエスト

**ヘッダー**:
```http
Authorization: Bearer <id_token>
```

**クエリパラメータ**:
| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| code | string | Yes | 銘柄コード |

**例**:
```
GET /fins/statements?code=7203
```

#### レスポンス（成功時）

**ステータスコード**: `200 OK`

**ボディ**:
```json
{
  "statements": [
    {
      "DisclosedDate": "2024-05-15",
      "DisclosedTime": "15:00:00",
      "LocalCode": "7203",
      "TypeOfDocument": "Annual",
      "TypeOfCurrentPeriod": "FY",
      "CurrentPeriodEndDate": "2024-03-31",
      "CurrentFiscalYearEndDate": "2024-03-31",
      "NextFiscalYearEndDate": "2025-03-31",
      "NetSales": 37154213000000,
      "OperatingIncome": 5352212000000,
      "OrdinaryIncome": 5884483000000,
      "Profit": 4944000000000,
      "TotalAssets": 75065000000000,
      "Equity": 32802000000000,
      "CashFlowsFromOperatingActivities": 6500000000000,
      "CashFlowsFromInvestingActivities": -7500000000000,
      "CashFlowsFromFinancingActivities": 500000000000
    }
  ]
}
```

#### フィールドマッピング

**貸借対照表（Balance Sheet）**:
| J-Quants APIフィールド | 内部型フィールド |
|------------------------|-----------------|
| TotalAssets | balance_sheet.total_assets |
| (TotalAssets - Equity) | balance_sheet.total_liabilities |
| Equity | balance_sheet.net_assets |

**損益計算書（Profit and Loss）**:
| J-Quants APIフィールド | 内部型フィールド |
|------------------------|-----------------|
| NetSales | profit_loss.revenue |
| OperatingIncome | profit_loss.operating_income |
| Profit | profit_loss.net_income |

**キャッシュフロー計算書（Cash Flow）**:
| J-Quants APIフィールド | 内部型フィールド |
|------------------------|-----------------|
| CashFlowsFromOperatingActivities | cash_flow.operating_cf |
| CashFlowsFromInvestingActivities | cash_flow.investing_cf |
| CashFlowsFromFinancingActivities | cash_flow.financing_cf |

---

## HTTPクライアント実装設計 🔵

### JQuantsClient クラス設計

```typescript
class JQuantsClient {
  private baseUrl: string;
  private tokenManager: TokenManager;
  private logger: Logger;
  private retryConfig: RetryConfig;

  constructor(config: JQuantsClientConfig) {
    this.baseUrl = config.baseUrl || 'https://api.jquants.com/v1';
    this.tokenManager = new TokenManager();
    this.logger = new Logger();
    this.retryConfig = DEFAULT_RETRY_CONFIG;
  }

  /**
   * 認証を実行してIDトークンを取得
   * 要件根拠: REQ-001, REQ-002
   */
  async authenticate(): Promise<string> {
    const refreshToken = process.env.J_QUANTS_REFRESH_TOKEN;
    if (!refreshToken) {
      throw new Error(ErrorCode.MISSING_API_KEY);
    }

    try {
      const response = await this.post<JQuantsAuthResponse>(
        API_ENDPOINTS.AUTH_USER,
        { refreshtoken: refreshToken },
        { skipAuth: true }
      );

      const idToken = response.data.idToken;
      await this.tokenManager.cacheToken(idToken); // REQ-003
      return idToken;
    } catch (error) {
      this.logger.error('認証に失敗しました', error);
      throw error;
    }
  }

  /**
   * 上場銘柄一覧を取得
   * 要件根拠: REQ-101
   */
  async getListedInfo(): Promise<Company[]> {
    const response = await this.get<JQuantsListedInfoResponse>(
      API_ENDPOINTS.LISTED_INFO
    );

    return response.data.info.map(item => ({
      code: item.Code,
      name: item.CompanyName.replace(/\(株\)|\(株式会社\)/g, ''),
      market: item.MarketCodeName,
      sector: item.Sector17CodeName,
      sector_code: item.Sector17Code,
    }));
  }

  /**
   * 株価データを取得
   * 要件根拠: REQ-201
   */
  async getDailyQuotes(params: {
    code: string;
    from?: string;
    to?: string;
  }): Promise<StockPrice[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('code', params.code);
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);

    const response = await this.get<JQuantsDailyQuotesResponse>(
      `${API_ENDPOINTS.DAILY_QUOTES}?${queryParams.toString()}`
    );

    const prices = response.data.daily_quotes.map(item => ({
      date: item.Date,
      open: item.Open,
      high: item.High,
      low: item.Low,
      close: item.Close,
      volume: item.Volume,
    }));

    // REQ-203: 日付降順でソート
    return prices.sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * 財務諸表を取得
   * 要件根拠: REQ-301
   */
  async getFinancialStatements(code: string): Promise<FinancialStatements> {
    const response = await this.get<JQuantsFinancialStatementsResponse>(
      `${API_ENDPOINTS.FINANCIAL_STATEMENTS}?code=${code}`
    );

    const statement = response.data.statements[0];
    if (!statement) {
      throw new Error(ErrorCode.MISSING_DATA);
    }

    return {
      code: statement.LocalCode,
      fiscal_year: statement.CurrentFiscalYearEndDate,
      balance_sheet: {
        total_assets: statement.TotalAssets,
        total_liabilities: statement.TotalAssets - statement.Equity,
        net_assets: statement.Equity,
      },
      profit_loss: {
        revenue: statement.NetSales,
        operating_income: statement.OperatingIncome,
        net_income: statement.Profit,
      },
      cash_flow: {
        operating_cf: statement.CashFlowsFromOperatingActivities,
        investing_cf: statement.CashFlowsFromInvestingActivities,
        financing_cf: statement.CashFlowsFromFinancingActivities,
      },
    };
  }

  /**
   * GETリクエストを実行（リトライロジック付き）
   * 要件根拠: REQ-601, REQ-603, REQ-604
   */
  private async get<T>(
    endpoint: string,
    options?: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      method: 'GET',
      endpoint,
      ...options,
    });
  }

  /**
   * POSTリクエストを実行
   * 要件根拠: REQ-601, REQ-603
   */
  private async post<T>(
    endpoint: string,
    body: object,
    options?: HttpRequestOptions & { skipAuth?: boolean }
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      method: 'POST',
      endpoint,
      body,
      ...options,
    });
  }

  /**
   * HTTPリクエストを実行（共通処理）
   * 要件根拠: REQ-004, REQ-601～REQ-605
   */
  private async request<T>(options: {
    method: string;
    endpoint: string;
    body?: object;
    skipAuth?: boolean;
  }): Promise<HttpResponse<T>> {
    const url = `${this.baseUrl}${options.endpoint}`;

    // REQ-004: IDトークンをAuthorizationヘッダーに付与
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!options.skipAuth) {
      const token = await this.tokenManager.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    // REQ-603: タイムアウト設定（5秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.API_REQUEST);

    try {
      // REQ-601: リトライロジック（最大3回）
      return await this.retryableRequest(async () => {
        const response = await fetch(url, {
          method: options.method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        // REQ-604: 認証エラー時はトークン再取得
        if (response.status === 401 && !options.skipAuth) {
          await this.tokenManager.refreshToken();
          return this.request<T>(options); // 再帰呼び出し
        }

        // REQ-605: レート制限エラー時は待機後リトライ
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
          await this.sleep(delay);
          throw new Error(ErrorCode.API_RATE_LIMIT);
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          data,
        };
      });
    } catch (error) {
      // REQ-602: エラーログ記録
      this.logger.error('API呼び出しエラー', {
        endpoint: options.endpoint,
        error,
      });
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * リトライ可能なリクエスト実行
   * 要件根拠: REQ-601
   */
  private async retryableRequest<T>(
    fn: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retryCount >= this.retryConfig.maxRetries - 1) {
        throw error;
      }

      if (this.isRetryableError(error)) {
        const delay = this.retryConfig.initialDelay * Math.pow(
          this.retryConfig.backoffMultiplier,
          retryCount
        );
        await this.sleep(Math.min(delay, this.retryConfig.maxDelay));
        return this.retryableRequest(fn, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * リトライ可能なエラーかどうかを判定
   */
  private isRetryableError(error: unknown): boolean {
    // 一時的なネットワークエラー、503 Service Unavailable等
    return true; // 簡略化
  }

  /**
   * 指定時間待機
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## エラーレスポンス処理 🔵

### エラーコードマッピング

| HTTPステータス | エラーコード | エラーメッセージ（日本語） | 要件根拠 |
|---------------|-------------|--------------------------|---------|
| 400 Bad Request | INVALID_CODE | 指定された銘柄コード（{code}）は存在しません | EDGE-001 |
| 401 Unauthorized | AUTHENTICATION_FAILED | 認証に失敗しました。APIキーを確認してください | REQ-001 |
| 401 Unauthorized | TOKEN_EXPIRED | トークンの有効期限が切れました | REQ-604 |
| 404 Not Found | MISSING_DATA | データが見つかりません | EDGE-302 |
| 429 Too Many Requests | API_RATE_LIMIT | APIのレート制限に達しました。しばらく待ってから再試行してください | REQ-605 |
| 503 Service Unavailable | API_MAINTENANCE | J-Quants APIがメンテナンス中です。しばらく時間をおいてから再試行してください | EDGE-201 |
| Timeout | API_TIMEOUT | APIの応答がタイムアウトしました（5秒） | REQ-603 |
| Network Error | NETWORK_ERROR | ネットワークに接続できません。インターネット接続を確認してください | EDGE-202 |

**要件根拠**: NFR-301（日本語エラーメッセージ）

---

## API利用制限 🔵

### フリープランの制約

1. **データ遅延**: 直近12週間（約3ヶ月）のデータは取得不可
   - **要件根拠**: REQ-1201

2. **データ期間**: 過去2年分のみ取得可能
   - **要件根拠**: REQ-1202

3. **レート制限**: 詳細はJ-Quants API公式ドキュメント参照
   - **要件根拠**: REQ-605

### 制約チェックロジック 🟡

```typescript
/**
 * 日付がフリープランの範囲内かチェック
 * 要件根拠: REQ-801, REQ-802
 */
function validateDateRange(date: string): void {
  const targetDate = new Date(date);
  const today = new Date();
  const twelveWeeksAgo = new Date(today.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
  const twoYearsAgo = new Date(today.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);

  // REQ-801: 直近12週間チェック
  if (targetDate > twelveWeeksAgo) {
    throw new Error(
      ErrorCode.DATA_OUT_OF_RANGE,
      'フリープランでは直近12週間のデータは取得できません'
    );
  }

  // REQ-802: 過去2年チェック
  if (targetDate < twoYearsAgo) {
    throw new Error(
      ErrorCode.DATA_OUT_OF_RANGE,
      'フリープランでは過去2年以前のデータは取得できません'
    );
  }
}
```

---

## パフォーマンス最適化 🟡

### 1. トークンキャッシュ 🔵
- **実装**: `data/token.json` にIDトークンをキャッシュ
- **効果**: 認証回数を削減
- **要件根拠**: REQ-003

### 2. HTTP/2の活用 🟡
- **実装**: fetch APIはHTTP/2を自動的にサポート
- **効果**: レイテンシ削減

### 3. タイムアウト設定 🔵
- **実装**: 5秒のタイムアウト
- **効果**: ハングアップ防止
- **要件根拠**: REQ-603, NFR-001

---

## セキュリティ対策 🔵

### 1. APIキーの管理 🔵
- **実装**: 環境変数（`.env`）からロード
- **要件根拠**: REQ-1101

### 2. HTTPS通信 🔵
- **実装**: fetch APIは自動的にHTTPSをサポート
- **要件根拠**: J-Quants API仕様

### 3. トークンの安全な保存 🔵
- **実装**: JSONファイルに保存、`.gitignore`で除外
- **要件根拠**: REQ-1102

---

## テスト戦略 🟡

### 単体テスト
- **対象**: JQuantsClient の各メソッド
- **方法**: モックAPIレスポンスを使用

### 統合テスト
- **対象**: 実際のJ-Quants APIとの通信
- **方法**: テスト用の銘柄コード使用

### E2Eテスト
- **対象**: MCP Protocol ↔ JQuantsClient ↔ J-Quants API
- **方法**: Claude Desktop経由での動作確認

---

## 参考資料

- J-Quants API公式ドキュメント: https://jpx.gitbook.io/j-quants-ja/api-reference
- アーキテクチャ設計: `architecture.md`
- TypeScript型定義: `interfaces.ts`
- 要件定義書: `../spec/j-quants-requirements.md`

---

## 更新履歴

- 2025-10-29: 初版作成（kairo-design コマンドにより作成）
  - 5つのAPIエンドポイント詳細仕様
  - JQuantsClient クラス設計
  - エラーハンドリング戦略
  - 信頼性レベル（🔵🟡🔴）の明記
