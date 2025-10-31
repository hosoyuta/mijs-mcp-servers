# J-Quants MCP Server 全体タスク概要

## プロジェクト概要

| 項目 | 内容 |
|------|------|
| **プロジェクト名** | J-Quants MCP Server |
| **プロジェクト目的** | J-Quants APIを活用したMCPサーバーを構築し、Claude等のAIアシスタントから日本株の株価・財務情報を取得できるようにする |
| **対象ユーザー** | MIJS 2025年秋合宿参加者、個人投資家・データ分析者、日本株分析に興味のある開発者 |
| **プロジェクト期間** | 30日（240時間）|
| **総タスク数** | 約40タスク |
| **開始タスクID** | TASK-0001 |
| **次利用可能ID** | TASK-0041 |
| **実装言語** | TypeScript 5.x + Node.js 20 LTS |
| **MCPフレームワーク** | @modelcontextprotocol/sdk |

---

## フェーズ構成表

| フェーズ | 期間 | 実施日程 | 主要成果物 | タスク数 | 見積時間 | ドキュメント |
|---------|------|---------|---------|---------|----------|-----------|
| **Phase 1: 基盤構築** | 10日 | Day 1-10 | 認証機能、MCP基本実装、4つのコアツール | 約10タスク | 80時間 | [j-quants-phase1.md](./j-quants-phase1.md) |
| **Phase 2: コアAPI実装** | 8日 | Day 11-18 | 残り4つのコアツール、エラーハンドリング強化、バリデーション | 約8タスク | 64時間 | [j-quants-phase2.md](./j-quants-phase2.md) |
| **Phase 3: MCPツール実装** | 8日 | Day 19-26 | 高度な分析ツール、検索機能、インデックス対応 | 約8タスク | 64時間 | [j-quants-phase3.md](./j-quants-phase3.md) |
| **Phase 4: テスト・統合** | 4日 | Day 27-30 | テスト実装、統合テスト、ドキュメント最終化、リリース準備 | 約4タスク | 32時間 | [j-quants-phase4.md](./j-quants-phase4.md) |
| **合計** | **30日** | | | **40タスク** | **240時間** | |

---

## タスク番号管理

### 使用済みタスクID

- **TASK-0001 ～ TASK-0010**: Phase 1 タスク
- **TASK-0011 ～ TASK-0018**: Phase 2 タスク
- **TASK-0019 ～ TASK-0026**: Phase 3 タスク
- **TASK-0027 ～ TASK-0030**: Phase 4 タスク
- **TASK-0031 ～ TASK-0040**: 追加実装タスク（オプション機能、ドキュメント）

### 次利用可能ID

- **TASK-0041**: 次のプロジェクトまたは追加タスク向け

---

## 全体プログレス

### フェーズ完了チェックボックス

- [ ] **Phase 1: 基盤構築** - 認証機能とコアツール実装完了
  - [ ] TASK-0001: TypeScript + Node.js環境構築
  - [ ] TASK-0002: MCP SDK統合
  - [ ] TASK-0003: J-Quants API認証フロー実装
  - [ ] TASK-0004: トークンキャッシュ機構実装
  - [ ] TASK-0005: get_listed_companies ツール実装
  - [ ] TASK-0006: get_stock_price ツール実装
  - [ ] TASK-0007: get_financial_statements ツール実装
  - [ ] TASK-0008: get_company_info ツール実装
  - [ ] TASK-0009: Phase 1 統合テスト
  - [ ] TASK-0010: Phase 1 ドキュメント完成

- [ ] **Phase 2: コアAPI実装** - 追加ツールとエラーハンドリング完了
  - [ ] TASK-0011: get_dividend_info ツール実装
  - [ ] TASK-0012: get_trading_calendar ツール実装
  - [ ] TASK-0013: search_companies ツール実装
  - [ ] TASK-0014: get_sector_stocks ツール実装
  - [ ] TASK-0015: エラーハンドリング強化
  - [ ] TASK-0016: パラメータバリデーション実装
  - [ ] TASK-0017: Phase 2 統合テスト
  - [ ] TASK-0018: Phase 2 ドキュメント完成

- [ ] **Phase 3: MCPツール実装** - 高度な分析機能完了
  - [ ] TASK-0019: get_margin_trading ツール実装
  - [ ] TASK-0020: get_short_selling ツール実装
  - [ ] TASK-0021: get_investment_breakdown ツール実装
  - [ ] TASK-0022: get_topix_data ツール実装
  - [ ] TASK-0023: パフォーマンス最適化
  - [ ] TASK-0024: キャッシング戦略実装
  - [ ] TASK-0025: Phase 3 統合テスト
  - [ ] TASK-0026: Phase 3 ドキュメント完成

- [ ] **Phase 4: テスト・統合** - テスト完了・リリース準備完了
  - [ ] TASK-0027: 単体テスト実装
  - [ ] TASK-0028: 統合テスト実装
  - [ ] TASK-0029: ドキュメント最終化・API仕様書完成
  - [ ] TASK-0030: リリース準備完了

---

## マイルストーン

| マイルストーン | 期日 | 達成条件 | 進捗 |
|---------------|------|--------|------|
| **M1: 基盤構築完了** | Day 10 | Phase 1 全タスク完了、4つのコアツール動作確認 | ⚪ |
| **M2: API実装完了** | Day 18 | Phase 2 全タスク完了、8つのツール動作確認 | ⚪ |
| **M3: MCPツール実装完了** | Day 26 | Phase 3 全タスク完了、12個のツール動作確認 | ⚪ |
| **M4: テスト完了・リリース** | Day 30 | Phase 4 完了、全テスト合格、ドキュメント完成 | ⚪ |

---

## Phase 1: 基盤構築（10日、80時間）

### 概要

J-Quants MCP Serverの基盤を構築し、TypeScript/Node.js環境の設定、MCP SDK統合、J-Quants API認証機能を実装します。さらに、基本的な4つのMCPツール（get_listed_companies、get_stock_price、get_financial_statements、get_company_info）を実装し、動作確認を行います。

### 関連要件

- **認証要件**: REQ-001, REQ-002, REQ-003, REQ-004
- **技術要件**: REQ-1001, REQ-1002, REQ-1003, REQ-1004
- **セキュリティ要件**: REQ-1101, REQ-1102
- **コアツール要件**: REQ-101, REQ-102, REQ-201, REQ-202, REQ-301, REQ-302, REQ-401, REQ-402

### 成果物

1. TypeScript + Node.js プロジェクトセットアップ完了
2. MCP SDK統合完了
3. 認証トークン取得・キャッシュ機構完成
4. get_listed_companies ツール実装完成
5. get_stock_price ツール実装完成
6. get_financial_statements ツール実装完成
7. get_company_info ツール実装完成
8. 統合テスト実施（4つのツール動作確認）
9. Phase 1 ドキュメント完成

詳細は [j-quants-phase1.md](./j-quants-phase1.md) を参照してください。

---

## Phase 2: コアAPI実装（8日、64時間）

### 概要

Phase 1で構築した基盤の上に、追加の4つのMCPツール（get_dividend_info、get_trading_calendar、search_companies、get_sector_stocks）を実装します。また、包括的なエラーハンドリング、パラメータバリデーション、Edge ケース対応を強化します。

### 関連要件

- **追加ツール要件**: REQ-101, REQ-501, REQ-502, REQ-503, REQ-504
- **エラーハンドリング**: REQ-601, REQ-602, REQ-603, REQ-604, REQ-605
- **バリデーション**: REQ-701, EDGE-001 ～ EDGE-302
- **パフォーマンス**: NFR-001, NFR-002, NFR-003

### 成果物

1. get_dividend_info ツール実装完成
2. get_trading_calendar ツール実装完成
3. search_companies ツール実装完成
4. get_sector_stocks ツール実装完成
5. エラーハンドリング機構強化
6. パラメータバリデーション実装
7. Edge ケース対応（EDGE-001 ～ EDGE-302）
8. 統合テスト実施（8つのツール動作確認）
9. Phase 2 ドキュメント完成

詳細は [j-quants-phase2.md](./j-quants-phase2.md) を参照してください。

---

## Phase 3: MCPツール実装（8日、64時間）

### 概要

より高度な市場分析機能を提供するMCPツール4つ（get_margin_trading、get_short_selling、get_investment_breakdown、get_topix_data）を実装します。合わせて、パフォーマンス最適化、キャッシング戦略、レート制限対応を強化します。

### 関連要件

- **高度な分析ツール**: 市場情報API（/markets/*, /indices/*）の統合
- **パフォーマンス**: NFR-001, NFR-002, NFR-003
- **キャッシング**: データキャッシュ戦略（銘柄一覧、市場データ）
- **保守性**: NFR-201, NFR-202, NFR-203

### 成果物

1. get_margin_trading ツール実装完成
2. get_short_selling ツール実装完成
3. get_investment_breakdown ツール実装完成
4. get_topix_data ツール実装完成
5. パフォーマンス最適化実施
6. キャッシング戦略実装
7. レート制限対応実装
8. 統合テスト実施（12個全ツール動作確認）
9. Phase 3 ドキュメント完成

詳細は [j-quants-phase3.md](./j-quants-phase3.md) を参照してください。

---

## Phase 4: テスト・統合（4日、32時間）

### 概要

全体的なテスト実装、統合テスト実施、ドキュメント最終化を行い、プロジェクトをリリース準備完了状態にします。TypeScript strict mode の確認、ESLint チェック、テストカバレッジの確保を行います。

### 関連要件

- **テスト容易性**: NFR-401
- **保守性**: NFR-201, NFR-202, NFR-203
- **ユーザビリティ**: NFR-301, NFR-302
- **可用性**: NFR-101, NFR-102

### 成果物

1. 単体テスト実装完成（全MCP ツール）
2. 統合テスト実施（エンドツーエンド）
3. TypeScript strict mode 検証完了
4. ESLint チェック合格（エラー0件）
5. テストカバレッジ確保
6. ドキュメント最終化
7. API 仕様書完成
8. リリース準備完了

詳細は [j-quants-phase4.md](./j-quants-phase4.md) を参照してください。

---

## 実装ツール一覧

### Phase 1（基本ツール）

1. **get_listed_companies** - 上場銘柄一覧取得
   - 機能: 上場銘柄の一覧を取得
   - パラメータ: market（オプション）、sector（オプション）
   - 関連要件: REQ-101, REQ-102, REQ-501, REQ-502

2. **get_stock_price** - 株価情報取得
   - 機能: 指定銘柄の日次株価データを取得
   - パラメータ: code（必須）、from_date（オプション）、to_date（オプション）
   - 関連要件: REQ-201, REQ-202, REQ-203, REQ-503, REQ-504

3. **get_financial_statements** - 財務諸表取得
   - 機能: 指定銘柄の財務情報（BS・PL・CF）を取得
   - パラメータ: code（必須）、statement_type（オプション）
   - 関連要件: REQ-301, REQ-302

4. **get_company_info** - 企業情報取得
   - 機能: 企業の詳細情報と最新株価を取得
   - パラメータ: code（必須）
   - 関連要件: REQ-401, REQ-402

### Phase 2（追加ツール）

5. **get_dividend_info** - 配当金情報取得
   - 機能: 指定銘柄の配当情報を取得
   - パラメータ: code（必須）
   - 関連要件: フェーズ2における拡張機能

6. **get_trading_calendar** - 取引カレンダー取得
   - 機能: 営業日・休場日情報を取得
   - パラメータ: from_date（オプション）、to_date（オプション）
   - 関連要件: フェーズ2における拡張機能

7. **search_companies** - 企業名・業種での検索
   - 機能: キーワード・業種で企業を検索
   - パラメータ: keyword（オプション）、sector（オプション）
   - 関連要件: フェーズ2における拡張機能

8. **get_sector_stocks** - 業種別銘柄一覧取得
   - 機能: 業種内の銘柄一覧を取得
   - パラメータ: sector（必須）、market（オプション）
   - 関連要件: フェーズ2における拡張機能

### Phase 3（高度な分析ツール）

9. **get_margin_trading** - 信用取引情報取得
   - 機能: 信用取引の残高・利息情報を取得
   - パラメータ: code（オプション）、date_range（オプション）
   - 関連要件: フェーズ3における高度な分析機能

10. **get_short_selling** - 空売り情報取得
    - 機能: 空売り残高・比率情報を取得
    - パラメータ: sector（オプション）、date_range（オプション）
    - 関連要件: フェーズ3における高度な分析機能

11. **get_investment_breakdown** - 投資部門別売買状況取得
    - 機能: 投資部門別の売買内訳を取得
    - パラメータ: code（オプション）、date_range（オプション）
    - 関連要件: フェーズ3における高度な分析機能

12. **get_topix_data** - TOPIX指数データ取得
    - 機能: 日経225・TOPIX等の指数データを取得
    - パラメータ: index_type（オプション）、from_date（オプション）、to_date（オプション）
    - 関連要件: フェーズ3における高度な分析機能

---

## 主要な実装要件マッピング

### 認証・接続関連

| 要件ID | 説明 | タスク | フェーズ |
|--------|------|--------|---------|
| REQ-001 | J-Quants API認証 | TASK-0003 | Phase 1 |
| REQ-002 | リフレッシュトークン処理 | TASK-0003 | Phase 1 |
| REQ-003 | トークンキャッシュ | TASK-0004 | Phase 1 |
| REQ-004 | Authorization ヘッダー付与 | TASK-0003 | Phase 1 |

### ツール実装関連

| ツール | 関連要件 | タスク | フェーズ |
|--------|---------|--------|---------|
| get_listed_companies | REQ-101, REQ-102 | TASK-0005 | Phase 1 |
| get_stock_price | REQ-201, REQ-202, REQ-203 | TASK-0006 | Phase 1 |
| get_financial_statements | REQ-301, REQ-302 | TASK-0007 | Phase 1 |
| get_company_info | REQ-401, REQ-402 | TASK-0008 | Phase 1 |
| get_dividend_info | - | TASK-0011 | Phase 2 |
| get_trading_calendar | - | TASK-0012 | Phase 2 |
| search_companies | - | TASK-0013 | Phase 2 |
| get_sector_stocks | - | TASK-0014 | Phase 2 |
| get_margin_trading | - | TASK-0019 | Phase 3 |
| get_short_selling | - | TASK-0020 | Phase 3 |
| get_investment_breakdown | - | TASK-0021 | Phase 3 |
| get_topix_data | - | TASK-0022 | Phase 3 |

### エラーハンドリング・バリデーション関連

| 要件ID | 説明 | タスク | フェーズ |
|--------|------|--------|---------|
| REQ-601 | API再試行（最大3回） | TASK-0015 | Phase 2 |
| REQ-602 | エラーログ記録 | TASK-0015 | Phase 2 |
| REQ-603 | タイムアウト処理（5秒以内） | TASK-0015 | Phase 2 |
| REQ-604 | トークン自動再取得 | TASK-0015 | Phase 2 |
| REQ-605 | レート制限対応 | TASK-0023 | Phase 3 |
| REQ-701 | パラメータバリデーション | TASK-0016 | Phase 2 |

### テスト・品質関連

| 要件ID | 説明 | タスク | フェーズ |
|--------|------|--------|---------|
| NFR-201 | TypeScript strict mode | TASK-0027, TASK-0028 | Phase 4 |
| NFR-202 | ESLint エラー0件 | TASK-0027, TASK-0028 | Phase 4 |
| NFR-203 | コメント記載 | 全タスク | 全フェーズ |
| NFR-401 | テスト実装 | TASK-0027, TASK-0028 | Phase 4 |

---

## 技術スタック確認事項

### コア技術

- [x] TypeScript 5.x
- [x] Node.js 20 LTS
- [x] @modelcontextprotocol/sdk
- [x] axios または fetch API
- [x] JSONファイルベースストレージ

### 開発ツール

- [ ] ESLint（TypeScript対応）
- [ ] Prettier（コードフォーマッタ）
- [ ] Jest または Vitest（テストフレームワーク）
- [ ] TypeScript strict mode
- [ ] .env ファイル管理（dotenv）

### セキュリティ

- [x] 環境変数から認証情報を読み込み
- [x] .gitignore に .env を追加
- [x] APIキー・トークンの適切な管理

---

## リスク・注意事項

### ビジネスリスク

1. **J-Quants API 仕様変更**: API仕様変更時の対応（定期確認必須）
2. **フリープラン制約**: 12週間遅延、過去2年分制限の周知
3. **リクエスト制限**: API リクエスト数制限への対応（レート制限）

### 技術リスク

1. **認証トークン有効期限**: トークン有効期限管理（自動再取得）
2. **ネットワークエラー**: 一時的エラーの再試行ロジック
3. **パフォーマンス**: 大量データ取得時の最適化（キャッシング）

### 開発リスク

1. **スケジュール遅延**: 予期しない API 仕様確認に時間がかかる可能性
2. **テスト環境**: 本番 API への依存（テスト環境の確保）
3. **ドキュメント遅延**: 実装に追われてドキュメント遅延の可能性

---

## 成功基準

### Phase 1 完了基準

- ✅ TypeScript + Node.js 環境構築完了
- ✅ MCP SDK 統合完了
- ✅ 認証トークン取得・キャッシュ動作確認
- ✅ 4つのコアツール実装・動作確認完了
- ✅ 統合テスト実施（全ツール正常動作）
- ✅ Phase 1 ドキュメント完成

### Phase 2 完了基準

- ✅ 4つの追加ツール実装・動作確認完了
- ✅ エラーハンドリング強化（再試行・ログ・タイムアウト）
- ✅ パラメータバリデーション実装完了
- ✅ Edge ケース対応（エラーメッセージ日本語化等）
- ✅ 統合テスト実施（8つ全ツール正常動作）
- ✅ Phase 2 ドキュメント完成

### Phase 3 完了基準

- ✅ 4つの高度な分析ツール実装・動作確認完了
- ✅ パフォーマンス最適化実施（応答時間5秒以内）
- ✅ キャッシング戦略実装・動作確認
- ✅ レート制限対応実装完了
- ✅ 統合テスト実施（12個全ツール正常動作）
- ✅ Phase 3 ドキュメント完成

### Phase 4 完了基準

- ✅ 単体テスト実装完了（全ツール）
- ✅ 統合テスト実施完了（エンドツーエンド）
- ✅ TypeScript strict mode 検証合格
- ✅ ESLint チェック合格（エラー0件）
- ✅ テストカバレッジ確保
- ✅ ドキュメント最終化・API 仕様書完成
- ✅ リリース準備完了

---

## 関連ドキュメント

### 要件・仕様

- [J-Quants 要件定義書](../spec/j-quants-requirements.md)
- [J-Quants ユーザーストーリー](../spec/j-quants-user-stories.md)
- [J-Quants 受け入れ基準](../spec/j-quants-acceptance-criteria.md)

### 設計ドキュメント

- [アーキテクチャ設計書](../design/architecture.md)
- [データフロー設計書](../design/dataflow.md)
- [API統合設計書](../design/api-integration.md)

### フェーズ別詳細

- [Phase 1: 基盤構築](./j-quants-phase1.md)
- [Phase 2: コアAPI実装](./j-quants-phase2.md)
- [Phase 3: MCPツール実装](./j-quants-phase3.md)
- [Phase 4: テスト・統合](./j-quants-phase4.md)

### 外部リソース

- [J-Quants API 公式サイト](https://jpx-jquants.com/)
- [J-Quants API 日本語ドキュメント](https://jpx.gitbook.io/j-quants-ja)
- [MCP 公式ドキュメント](https://modelcontextprotocol.io/)
- [TypeScript SDK GitHub](https://github.com/modelcontextprotocol/typescript-sdk)

---

## 更新履歴

| 日付 | 更新内容 | 更新者 |
|------|---------|--------|
| 2025-10-29 | 初版作成（全体概要）| Claude Code |
| | | |

---

**最後更新**: 2025-10-29

**プロジェクトステータス**: 🟡 計画段階

**次ステップ**: Phase 1 詳細タスク定義（j-quants-phase1.md の作成）
