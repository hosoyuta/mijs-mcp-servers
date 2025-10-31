# J-Quants MCP Server 要件定義書

## 1. プロジェクト概要

### 1.1 目的
J-Quants APIを活用したMCPサーバーを構築し、Claude等のAIアシスタントから日本株の株価・財務情報を取得できるようにする。

### 1.2 対象ユーザー
- MIJS 2025年秋合宿の参加者
- 個人投資家・データ分析者
- 日本株分析に興味のある開発者

### 1.3 開発期間
1-2ヶ月（プロトタイプ/MVP）

---

## 2. J-Quants APIについて

### 2.1 サービス概要
J-Quants APIは、JPX（日本取引所グループ）が提供する個人投資家向けのデータAPI配信サービス。
日本株の株価、財務情報、市場情報などをAPIで取得できる。

公式サイト: https://jpx-jquants.com/
APIドキュメント: https://jpx.gitbook.io/j-quants-ja

### 2.2 料金プラン

| プラン | 料金（月額） | データ期間 | 遅延 |
|--------|-------------|-----------|------|
| **フリープラン** | 無料 | 過去2年分 | 12週間遅延 |
| ライトプラン | 1,650円 | 過去2年分 | 12週間遅延 |
| スタンダードプラン | 3,300円 | 過去5年分 | 12週間遅延 |
| プレミアムプラン | 16,500円 | 過去10年分 | リアルタイム |

**本プロジェクトでは「フリープラン」を使用**

### 2.3 フリープランの制約
- **データ遅延**: 直近12週間（約3ヶ月）のデータは取得不可
- **データ期間**: 過去2年分のみ取得可能
- **有効期限**: 登録後1年で自動解約
- **リクエスト制限**: 詳細は公式ドキュメント参照

---

## 3. 利用可能なAPI一覧（フリープラン）

### 3.1 認証 (Authentication)
| エンドポイント | 機能 |
|--------------|------|
| `/token/auth_user` | リフレッシュトークン取得 |
| `/token/auth_refresh` | IDトークン取得 |

### 3.2 上場銘柄情報 (Listed Information)
| エンドポイント | 機能 |
|--------------|------|
| `/listed/info` | 上場銘柄一覧（銘柄コード、会社名、市場区分、業種など） |

### 3.3 株価情報 (Stock Prices)
| エンドポイント | 機能 |
|--------------|------|
| `/prices/daily_quotes` | 日次株価四本値（始値・高値・安値・終値・出来高） |

### 3.4 財務情報 (Financial Information)
| エンドポイント | 機能 |
|--------------|------|
| `/fins/statements` | 財務情報サマリー |
| `/fins/fs_details` | 財務諸表詳細（貸借対照表・損益計算書・キャッシュフロー） |
| `/fins/dividend` | 配当金情報 |
| `/fins/announcement` | 決算発表予定日 |

### 3.5 市場情報 (Market Information)
| エンドポイント | 機能 |
|--------------|------|
| `/markets/trades_spec` | 投資部門別売買状況 |
| `/markets/weekly_margin_interest` | 信用取引週末残高 |
| `/markets/short_selling` | 業種別空売り比率 |
| `/markets/short_selling_positions` | 空売り残高報告 |
| `/markets/daily_margin_interest` | 日々公表信用取引残高 |
| `/markets/breakdown` | 売買内訳データ |
| `/markets/trading_calendar` | 取引カレンダー |

### 3.6 指数情報 (Index Information)
| エンドポイント | 機能 |
|--------------|------|
| `/indices/topix` | TOPIX指数データ |

### 3.7 デリバティブ情報 (Derivatives)
| エンドポイント | 機能 |
|--------------|------|
| `/option/index_option` | 日経225オプション四本値 |
| `/derivatives/futures` | 先物四本値 |
| `/derivatives/options` | オプション四本値 |

---

## 4. MCPツール設計

### 4.1 実装優先度

#### 優先度: 高（Phase 1 - MVP）
基本的な株価・企業情報の取得機能

1. **get_listed_companies** - 上場銘柄一覧取得
2. **get_stock_price** - 株価取得（日次四本値）
3. **get_financial_statements** - 財務諸表取得
4. **get_company_info** - 企業情報取得（銘柄コードから詳細情報）

#### 優先度: 中（Phase 2 - 拡張）
投資分析に有用な情報

5. **get_dividend_info** - 配当金情報取得
6. **get_trading_calendar** - 取引カレンダー取得
7. **search_companies** - 企業名・業種での銘柄検索
8. **get_sector_stocks** - 業種別銘柄一覧取得

#### 優先度: 低（Phase 3 - 高度な分析）
より詳細な市場分析

9. **get_margin_trading** - 信用取引残高取得
10. **get_short_selling** - 空売り情報取得
11. **get_investment_breakdown** - 投資部門別売買状況
12. **get_topix_data** - TOPIX指数データ取得

---

## 5. 各MCPツールの詳細仕様

### 5.1 get_listed_companies
**機能**: 上場銘柄一覧を取得

**入力パラメータ**:
- `market` (optional): 市場区分（"プライム", "スタンダード", "グロース"）
- `sector` (optional): 業種コード

**出力**:
```json
{
  "companies": [
    {
      "code": "7203",
      "name": "トヨタ自動車",
      "market": "プライム",
      "sector": "輸送用機器",
      "sector_code": "3050"
    }
  ]
}
```

### 5.2 get_stock_price
**機能**: 指定銘柄の株価データを取得

**入力パラメータ**:
- `code` (required): 銘柄コード（例: "7203"）
- `from_date` (optional): 取得開始日（YYYY-MM-DD）
- `to_date` (optional): 取得終了日（YYYY-MM-DD）

**出力**:
```json
{
  "code": "7203",
  "prices": [
    {
      "date": "2024-10-01",
      "open": 2800.0,
      "high": 2850.0,
      "low": 2790.0,
      "close": 2830.0,
      "volume": 15000000
    }
  ]
}
```

### 5.3 get_financial_statements
**機能**: 財務諸表データを取得

**入力パラメータ**:
- `code` (required): 銘柄コード
- `statement_type` (optional): "BS", "PL", "CF", "ALL"（デフォルト: "ALL"）

**出力**:
```json
{
  "code": "7203",
  "fiscal_year": "2024",
  "balance_sheet": {
    "total_assets": 50000000000,
    "total_liabilities": 30000000000,
    "net_assets": 20000000000
  },
  "profit_loss": {
    "revenue": 30000000000,
    "operating_income": 2000000000,
    "net_income": 1500000000
  },
  "cash_flow": {
    "operating_cf": 2500000000,
    "investing_cf": -1000000000,
    "financing_cf": -500000000
  }
}
```

### 5.4 get_company_info
**機能**: 企業の詳細情報を取得（銘柄情報 + 最新株価）

**入力パラメータ**:
- `code` (required): 銘柄コード

**出力**:
```json
{
  "code": "7203",
  "name": "トヨタ自動車",
  "market": "プライム",
  "sector": "輸送用機器",
  "latest_price": {
    "date": "2024-10-01",
    "close": 2830.0,
    "change": "+20.0",
    "change_percent": "+0.71%"
  }
}
```

### 5.5 get_dividend_info
**機能**: 配当金情報を取得

**入力パラメータ**:
- `code` (required): 銘柄コード

**出力**:
```json
{
  "code": "7203",
  "dividends": [
    {
      "record_date": "2024-03-31",
      "dividend_per_share": 80.0,
      "dividend_yield": 2.8
    }
  ]
}
```

### 5.6 get_trading_calendar
**機能**: 取引カレンダー（営業日・休場日）を取得

**入力パラメータ**:
- `from_date` (optional): 取得開始日
- `to_date` (optional): 取得終了日

**出力**:
```json
{
  "calendar": [
    {
      "date": "2024-10-01",
      "is_trading_day": true,
      "holiday_name": null
    },
    {
      "date": "2024-10-14",
      "is_trading_day": false,
      "holiday_name": "体育の日"
    }
  ]
}
```

### 5.7 search_companies
**機能**: 企業名や業種で銘柄を検索

**入力パラメータ**:
- `keyword` (optional): 企業名のキーワード
- `sector` (optional): 業種名

**出力**:
```json
{
  "results": [
    {
      "code": "7203",
      "name": "トヨタ自動車",
      "sector": "輸送用機器"
    }
  ]
}
```

---

## 6. 技術仕様

### 6.1 開発技術スタック
- **言語**: TypeScript 5.x
- **ランタイム**: Node.js 20 LTS
- **MCPフレームワーク**: @modelcontextprotocol/sdk
- **HTTPクライアント**: axios または fetch
- **データストレージ**: JSONファイル（トークンキャッシュ用）

### 6.2 認証フロー
1. リフレッシュトークンで認証 (`/token/auth_user`)
2. IDトークンを取得 (`/token/auth_refresh`)
3. IDトークンをヘッダーに付与してAPI呼び出し
4. トークンは有効期限を考慮してキャッシュ

### 6.3 エラーハンドリング
- API呼び出し失敗時の再試行ロジック
- レート制限超過時の待機処理
- 認証エラー時のトークン再取得

### 6.4 データキャッシュ
- 認証トークンのローカルキャッシュ（JSONファイル）
- 銘柄一覧のキャッシュ（日次更新）

---

## 7. 開発フェーズ

### Phase 1: MVP（1週間）
- 認証機能の実装
- 基本的な4つのツール実装
  - get_listed_companies
  - get_stock_price
  - get_financial_statements
  - get_company_info

### Phase 2: 拡張機能（1週間）
- 検索機能の追加
- 配当情報、取引カレンダー
- エラーハンドリング強化

### Phase 3: 高度な分析（オプション）
- 市場情報ツール
- デリバティブ情報
- パフォーマンス最適化

---

## 8. 制約事項・注意事項

### 8.1 データ制約
- **12週間の遅延**: 最新3ヶ月のデータは取得不可
- **過去2年分**: それ以前のデータは取得不可
- フリープランのため、リアルタイムデータには非対応

### 8.2 技術的制約
- 教育目的のため、認証は最低限の実装
- 個人情報は扱わない
- APIキーは環境変数で管理（`.env`）
- `.gitignore`でAPIキーを除外

### 8.3 使用上の注意
- J-Quants APIの利用規約を遵守
- APIリクエスト数の制限に注意
- 商用利用の場合は有償プランへの移行が必要

---

## 9. 参考資料

- J-Quants API公式サイト: https://jpx-jquants.com/
- J-Quants API日本語ドキュメント: https://jpx.gitbook.io/j-quants-ja
- MCP公式ドキュメント: https://modelcontextprotocol.io/
- TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk

---

## 10. 更新履歴

- 2025-10-29: 初版作成
