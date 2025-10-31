# J-Quants MCP Server 設計文書

## 概要

このディレクトリには、J-Quants MCP Serverの技術設計文書が含まれています。要件定義書（`docs/spec/`）に基づいて作成されており、実装の基盤となる設計情報を提供します。

**作成日**: 2025-10-29
**作成ツール**: kairo-design コマンド
**信頼性レベル**: 🔵 要件定義書に基づく確実な設計、🟡 妥当な推測、🔴 推測

---

## 設計文書一覧

### 1. [architecture.md](architecture.md) 🔵
**アーキテクチャ設計**

レイヤードアーキテクチャの全体構成、コンポーネント定義、ディレクトリ構造を記述。

**主な内容**:
- システム全体のアーキテクチャパターン
- 6つの主要コンポーネント定義
  1. MCPサーバー本体
  2. MCPツール実装（4ツール）
  3. J-Quants APIクライアント
  4. 認証モジュール
  5. バリデーション・エラーハンドリング
  6. ロガー
- ディレクトリ構造
- 非機能要件への対応
- Phase別実装スコープ

**要件根拠**: 要件定義書全体（REQ-001～REQ-1202）

---

### 2. [dataflow.md](dataflow.md) 🔵
**データフロー図**

システム内でのデータの流れを可視化。Mermaid記法で図示。

**主な内容**:
- システム全体のデータフロー図
- 起動・認証フロー（シーケンス図）
- MCPツール呼び出しフロー（4ツール × シーケンス図）
- エラーハンドリングフロー
  - リトライロジック
  - ログ記録フロー
  - タイムアウト処理
  - バリデーションエラー
- データ処理フロー（フィルタリング、ソート、統合）

**要件根拠**: REQ-001～REQ-605（認証・API呼び出し・エラーハンドリング）

---

### 3. [interfaces.ts](interfaces.ts) 🔵🟡
**TypeScript型定義**

全ての型定義を含む実装用の型定義ファイル。

**主な内容**:
- MCPツールの入力・出力型（8型）
- エンティティ型（7型）
- J-Quants APIレスポンス型（4型）
- 認証・トークン管理型（2型）
- エラー型（ErrorCode列挙型、JQuantsError）
- ログ型（LogLevel、LogEntry）
- HTTP型（HttpRequestOptions、HttpResponse）
- MCP Protocol型（MCPTool、MCPToolResult）
- バリデーション型
- リトライ戦略型
- パフォーマンス監視型
- 定数定義（API_ENDPOINTS、TIMEOUTS等）
- 型ガード関数（3関数）

**要件根拠**: REQ-101～REQ-402（MCPツール）、REQ-601～REQ-605（エラーハンドリング）

---

### 4. [api-integration.md](api-integration.md) 🔵🟡
**J-Quants API統合設計**

J-Quants APIとの統合方法、エンドポイント仕様、リクエスト・レスポンス形式を詳細に記述。

**主な内容**:
- J-Quants API概要（ベースURL、認証方式）
- 認証エンドポイント仕様（2エンドポイント）
- データ取得エンドポイント仕様（3エンドポイント）
  - 上場銘柄一覧
  - 株価データ
  - 財務諸表
- フィールドマッピング表
- JQuantsClient クラス設計（TypeScriptコード例）
- エラーレスポンス処理
- API利用制限（フリープランの制約）
- パフォーマンス最適化
- セキュリティ対策

**要件根拠**: REQ-001～REQ-004（認証）、REQ-101～REQ-402（API呼び出し）

---

## 設計の主要ポイント

### アーキテクチャパターン 🔵

**レイヤードアーキテクチャ**を採用：

```
MCP Protocol Layer (Claude連携)
      ↓↑
MCP Tools Layer (4ツール)
      ↓↑
Business Logic Layer (バリデーション・データ変換)
      ↓↑
API Client Layer (J-Quants API通信)
      ↓↑
Data Layer (トークンキャッシュ・ログ)
```

**選択理由**:
- 各層が独立しており、テスト・保守が容易
- MCPプロトコルとビジネスロジックを分離
- API仕様変更時の影響を最小化

**要件根拠**: REQ-1001（TypeScript + Node.js）、REQ-1002（@modelcontextprotocol/sdk）

---

### データフロー 🔵

**主要な4つのフロー**:

1. **起動・認証フロー**
   - リフレッシュトークン → IDトークン → キャッシュ
   - 要件根拠: REQ-001～REQ-004

2. **MCPツール呼び出しフロー**
   - Claude → MCP → Tools → API Client → J-Quants API
   - 要件根拠: REQ-101～REQ-402

3. **エラーハンドリングフロー**
   - リトライ（最大3回） → ログ記録 → エラーメッセージ
   - 要件根拠: REQ-601～REQ-605

4. **データ処理フロー**
   - フィルタリング → ソート → 型変換
   - 要件根拠: REQ-501～REQ-504

---

### 型システム 🔵🟡

**型定義の構成**:
- **MCPツール型**: 入力・出力の厳密な型定義
- **エンティティ型**: Company、StockPrice等のドメイン型
- **API型**: J-Quants APIレスポンスの型（フィールドマッピング）
- **エラー型**: ErrorCode列挙型、JQuantsError
- **型ガード**: isValidStockCode、isValidDateFormat等

**TypeScript strict mode**で型安全性を確保（NFR-201）

---

### API統合 🔵

**JQuantsClient クラス**:
- 認証処理（REQ-001～REQ-004）
- 5つのAPIエンドポイントへのアクセス
- リトライロジック（最大3回、Exponential backoff）
- タイムアウト処理（5秒）
- トークン再取得（有効期限切れ時）
- レート制限対応

**エラーハンドリング**:
- HTTPステータスコード → ErrorCode → 日本語エラーメッセージ
- ログ記録（error.log）
- ユーザーフレンドリーなメッセージ（NFR-301）

---

## 設計と要件の対応表

| 設計文書 | 主要な要件根拠 |
|---------|---------------|
| architecture.md | REQ-001～REQ-1202（全体）、NFR-001～NFR-401（非機能要件） |
| dataflow.md | REQ-001～REQ-605（認証・API呼び出し・エラーハンドリング） |
| interfaces.ts | REQ-101～REQ-402（MCPツール）、REQ-601～REQ-605（エラー） |
| api-integration.md | REQ-001～REQ-004（認証）、REQ-101～REQ-402（API） |

---

## 非機能要件への対応

### パフォーマンス 🔵
- **NFR-001**: APIリクエスト5秒以内 → タイムアウト設定
- **NFR-002**: 起動時認証10秒以内 → トークンキャッシュ
- **NFR-003**: メモリ500MB以下 → データキャッシュなし

### 可用性 🔵
- **NFR-101, NFR-102**: エラー時の安定性 → try-catch、リトライロジック

### 保守性 🔵
- **NFR-201**: TypeScript strict mode → tsconfig.json設定
- **NFR-202**: ESLintエラー0件 → ESLint設定
- **NFR-203**: コメント記載 → JSDocコメント

### ユーザビリティ 🔵
- **NFR-301**: 日本語エラーメッセージ → error-handler.ts
- **NFR-302**: 日本語ツール説明 → MCPツール定義

---

## 技術スタックの根拠

| 技術 | 選定理由 | 要件根拠 |
|------|---------|---------|
| TypeScript 5.x | 型安全性、チームスキル活用 | REQ-1001 |
| Node.js 20 LTS | 長期サポート、MCPサーバー標準 | REQ-1001 |
| @modelcontextprotocol/sdk | MCP公式実装 | REQ-1002 |
| fetch API | 標準API、追加依存なし | tech-stack.md（コスト最小化） |
| JSONファイル | シンプル、セットアップ不要 | REQ-1003 |
| dotenv | 環境変数管理の標準 | REQ-1101 |

---

## Phase別実装ガイド

### Phase 1: MVP（1週間） 🔵
**実装対象**:
1. 認証機能（`src/auth/token-manager.ts`）
2. J-Quants APIクライアント（`src/api/j-quants-client.ts`）
3. 4つのMCPツール（`src/tools/*.ts`）
4. 基本的なエラーハンドリング（`src/utils/error-handler.ts`）
5. バリデーション（`src/utils/validator.ts`）

**要件根拠**: REQ-001～REQ-004、REQ-101～REQ-402、REQ-601～REQ-603、REQ-701

**成果物**:
- 動作するMCPサーバー
- Claude Desktopから4ツール呼び出し可能
- 基本的なエラーハンドリング

---

### Phase 2: 拡張機能（1週間） 🟡
**実装対象**:
1. 検索機能（search_companies）
2. 配当情報（get_dividend_info）
3. 取引カレンダー（get_trading_calendar）
4. 詳細なエラーメッセージ（EDGE-001～EDGE-302）

---

### Phase 3: 高度な分析（オプション） 🟡
**実装対象**:
1. 市場情報ツール（信用取引、空売り等）
2. デリバティブ情報
3. パフォーマンス最適化

---

## 実装時の注意事項

### 1. 型定義の活用 🔵
- `interfaces.ts` を実装ファイルからインポート
- TypeScript strict modeを有効化
- anyに型の使用を最小限に

### 2. エラーハンドリング 🔵
- 全てのAPI呼び出しをtry-catchで囲む
- ErrorCodeを使用して統一的なエラー管理
- 日本語エラーメッセージを提供

### 3. ログ記録 🔵
- エラーは必ず `error.log` に記録
- デバッグモードでは詳細ログを `debug.log` に記録
- 個人情報をログに含めない

### 4. テスト 🟡
- 単体テスト: Vitestで各関数をテスト
- 統合テスト: 実際のJ-Quants APIとの通信テスト
- E2Eテスト: Claude Desktop経由での動作確認

### 5. セキュリティ 🔵
- APIキーを`.env`で管理
- `.env`を`.gitignore`に追加
- トークンキャッシュ（`data/token.json`）も`.gitignore`に追加

---

## 関連文書

### 要件定義
- [要件定義書](../spec/j-quants-requirements.md)
- [ユーザーストーリー](../spec/j-quants-user-stories.md)
- [受け入れ基準](../spec/j-quants-acceptance-criteria.md)

### 元要件
- [元要件定義](../../REQUIREMENTS.md)

### 技術スタック
- [プロジェクト技術スタック](../../../../docs/tech-stack.md)

### 外部リソース
- [J-Quants API ドキュメント](https://jpx.gitbook.io/j-quants-ja)
- [MCP公式ドキュメント](https://modelcontextprotocol.io/)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

---

## 設計のレビューポイント

### 整合性チェック ✅
- [x] 要件定義書との整合性: 問題なし
- [x] 技術スタックとの整合性: 問題なし
- [x] 非機能要件への対応: 問題なし

### カバレッジ ✅
- [x] 全34件の機能要件をカバー
- [x] 全11件の非機能要件に対応
- [x] 全9件のEdgeケースに対応

### 実装可能性 ✅
- [x] 技術スタックが確定
- [x] API仕様が明確
- [x] データフローが可視化
- [x] 型定義が完備

---

## 更新履歴

- 2025-10-29: 初版作成（kairo-design コマンドにより作成）
  - 4つの設計文書を作成
  - レイヤードアーキテクチャ採用
  - TypeScript型定義完備
  - J-Quants API統合設計完了
  - 信頼性レベル（🔵🟡🔴）の明記

---

## 次のステップ

設計が完了しましたので、次は以下のいずれかに進むことができます：

1. **タスク分割**: `/tsumiki:kairo-tasks` で実装タスクを1日単位で分割
2. **実装開始**: Phase 1の実装を開始
3. **設計レビュー**: 設計内容をチームでレビュー

実装開始前に、以下を確認してください：
- [ ] 要件定義書の承認
- [ ] 設計文書のレビュー
- [ ] 開発環境のセットアップ（Node.js 20 LTS、npm）
- [ ] J-Quants APIフリープランへの登録
- [ ] リフレッシュトークンの取得
