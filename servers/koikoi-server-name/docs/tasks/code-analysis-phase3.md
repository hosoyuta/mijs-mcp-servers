# Phase 3: オーケストレーションレイヤー - Orchestration + Cache + Tool Handlers

## フェーズ概要

### 基本情報
- **フェーズ名**: Phase 3 - オーケストレーションレイヤー (Orchestration Layer)
- **期間**: 10-15営業日
- **推定工数**: 120-180時間
- **開始予定**: 2025-11-19 (Phase 2完了後)
- **完了予定**: 2025-12-06
- **担当**: 開発チーム
- **優先度**: P0 (Critical) - MVP必須

### 目的
Phase 2で構築した解析エンジン群を統合し、MCPツールとして提供する層を実装する。キャッシュマネージャーによる高速化、モード選択による柔軟性、エラーリカバリによる堅牢性を実現する。

### 成果物
- ✅ AnalysisOrchestrator: 複数Analyzerの協調実行と統合制御
- ✅ CacheManager: LRUアルゴリズムによる3層キャッシュ管理
- ✅ ErrorRecoveryManager: 部分的成功のハンドリング
- ✅ Tool Handler 4種:
  - analyze_file: 単一ファイル解析
  - search_symbol: シンボル検索
  - analyze_project: プロジェクト全体解析
  - get_dependencies: 依存関係グラフ生成
- ✅ モード切り替え機能 (concise/detailed)
- ✅ 並行処理 (Promise.all) による高速化
- ✅ 統合テスト (カバレッジ70%以上)

### 関連文書
- **アーキテクチャ**: [architecture.md](../design/code-analysis/architecture.md) - Section 2 (Tool Handler Layer), Section 3 (Orchestration Layer)
- **キャッシュ設計**: [cache-design.md](../design/code-analysis/cache-design.md) - LRU設計、キャッシュキー設計
- **API仕様**: [api-specification.md](../design/code-analysis/api-specification.md) - 各ツールの入出力仕様
- **要件**: [requirements.md](../spec/code-analysis-requirements.md) - REQ-061〜REQ-064, REQ-101〜REQ-104, REQ-111〜REQ-113
- **タスク概要**: [code-analysis-overview.md](./code-analysis-overview.md)
- **Phase 2**: [code-analysis-phase1.md](./code-analysis-phase1.md) - 依存フェーズ

---

## 週次計画

### Week 1 (Days 36-40): Orchestration & Cache
**目標**: オーケストレーションとキャッシュ機構の完成

- **Days 36-37**: AnalysisOrchestrator実装 (Analyzer統合、モード選択)
- **Days 38-39**: CacheManager実装 (LRUアルゴリズム、mtime管理)
- **Day 40**: キャッシュ統合テストとパフォーマンス検証

**マイルストーン**: キャッシュヒット10ms以内を達成

---

### Week 2 (Days 41-45): Tool Handlers
**目標**: 4つのMCPツールハンドラーの実装完成

- **Days 41-42**: AnalyzeFileTool実装 (入力バリデーション、Orchestrator統合)
- **Day 43**: SearchSymbolTool実装 (並行検索、マッチング)
- **Day 44**: AnalyzeProjectTool実装 (バッチ処理、依存関係グラフ)
- **Day 45**: GetDependenciesTool実装 (循環依存検出、深度制限)

**マイルストーン**: 4ツール全て正常動作

---

### Week 3 (Days 46-50): Integration & Testing
**目標**: Phase 3完成とMilestone 3達成

- **Days 46-47**: Tool Handler統合テスト (正常系・異常系・境界値)
- **Day 48**: ErrorRecoveryManager実装 (部分的成功、フォールバック)
- **Day 49**: パフォーマンス最適化 (並行処理、タイムアウト)
- **Day 50**: Milestone 3検証と次フェーズ準備

**マイルストーン**: Phase 3完全完成、10ファイル並行解析2秒以内

---

## 日次タスク詳細

### Week 1: Orchestration & Cache

---

#### Days 36-37: AnalysisOrchestrator実装

##### - [ ] TASK-0301: AnalysisOrchestrator基本実装 (TDD Red)
- **タスクタイプ**: TDD
- **推定工数**: 4時間
- **要件名**: code-analysis
- **依存タスク**: Phase 2完了 (全Analyzer実装済み)
- **要件リンク**: REQ-061〜REQ-064 (モード選択), REQ-101〜REQ-104 (部分的成功)
- **信頼性レベル**: 🔵 (architecture.md Section 3.1準拠)

**実装詳細** (Red):

`tests/orchestration/AnalysisOrchestrator.test.ts`:
```typescript
import { describe, test, expect } from "bun:test";
import { AnalysisOrchestrator } from "../../src/orchestration/AnalysisOrchestrator";
import { ProgramManager } from "../../src/compiler/ProgramManager";

describe("AnalysisOrchestrator", () => {
  const workspace = process.cwd() + "/tests/fixtures/workspace";
  const programManager = new ProgramManager({
    rootPath: workspace,
    compilerOptions: {},
  });

  test("複数のAnalyzerを統合実行", async () => {
    const orchestrator = new AnalysisOrchestrator(programManager);
    const result = await orchestrator.analyzeFile({
      path: "./tests/fixtures/sample-simple.ts",
      mode: "concise",
    });

    expect(result.functions).toBeDefined();
    expect(result.types).toBeDefined();
    expect(result.dependencies).toBeDefined();
    expect(result.documentation).toBeDefined();
  });

  test("簡潔モードではシグネチャのみ", async () => {
    const orchestrator = new AnalysisOrchestrator(programManager);
    const result = await orchestrator.analyzeFile({
      path: "./tests/fixtures/sample-simple.ts",
      mode: "concise",
    });

    // 関数本体は含まない
    expect(result.functions[0].body).toBeUndefined();
    // シグネチャは含む
    expect(result.functions[0].name).toBeDefined();
    expect(result.functions[0].parameters).toBeDefined();
  });

  test("詳細モードでは関数本体の一部も含む", async () => {
    const orchestrator = new AnalysisOrchestrator(programManager);
    const result = await orchestrator.analyzeFile({
      path: "./tests/fixtures/sample-simple.ts",
      mode: "detailed",
    });

    // 関数本体の一部を含む
    expect(result.functions[0].bodyPreview).toBeDefined();
    expect(result.functions[0].bodyPreview.length).toBeGreaterThan(0);
  });

  test("includeオプションで出力を制限", async () => {
    const orchestrator = new AnalysisOrchestrator(programManager);
    const result = await orchestrator.analyzeFile({
      path: "./tests/fixtures/sample-simple.ts",
      mode: "concise",
      include: ["structure"],
    });

    // structureのみ含む
    expect(result.functions).toBeDefined();
    // typesは含まない
    expect(result.types).toBeUndefined();
  });
});
```

**完了条件**:
- [ ] テストが作成され、すべて失敗 (Red)
- [ ] モード選択のテストケース完備
- [ ] includeオプションのテストケース完備

**テスト要件**:
- 複数Analyzer統合
- concise/detailedモード切り替え
- includeオプション

---

##### - [ ] TASK-0302: AnalysisOrchestrator実装 (TDD Green)
- **タスクタイプ**: TDD
- **推定工数**: 6時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0301
- **要件リンク**: REQ-061〜REQ-064
- **信頼性レベル**: 🔵 (architecture.md Section 3.1準拠)

**実装詳細** (Green):

`src/orchestration/AnalysisOrchestrator.ts`:
```typescript
import { ProgramManager } from "../compiler/ProgramManager";
import { StructureAnalyzer } from "../analyzers/StructureAnalyzer";
import { TypeAnalyzer } from "../analyzers/TypeAnalyzer";
import { DependencyAnalyzer } from "../analyzers/DependencyAnalyzer";
import { DocumentationExtractor } from "../analyzers/DocumentationExtractor";

/**
 * 解析オプション
 */
export interface AnalysisOptions {
  path: string;
  mode?: "concise" | "detailed";
  include?: string[];
}

/**
 * 解析結果
 */
export interface AnalysisResult {
  success: boolean;
  partial: boolean;
  file: {
    path: string;
    size: number;
    lines: number;
  };
  summary?: string;
  functions?: Function[];
  classes?: Class[];
  types?: TypeDefinition[];
  enums?: EnumDefinition[];
  dependencies?: {
    imports: Import[];
    exports: Export[];
  };
  documentation?: Documentation;
  errors?: ParseError[];
}

/**
 * 解析オーケストレーター
 * 複数のAnalyzerを協調実行し、モードに応じた出力を生成
 */
export class AnalysisOrchestrator {
  private programManager: ProgramManager;
  private structureAnalyzer: StructureAnalyzer;
  private typeAnalyzer: TypeAnalyzer;
  private dependencyAnalyzer: DependencyAnalyzer;
  private documentationExtractor: DocumentationExtractor;

  constructor(programManager: ProgramManager) {
    this.programManager = programManager;
    this.structureAnalyzer = new StructureAnalyzer();
    this.typeAnalyzer = new TypeAnalyzer();
    this.dependencyAnalyzer = new DependencyAnalyzer();
    this.documentationExtractor = new DocumentationExtractor();
  }

  /**
   * ファイルを解析
   */
  async analyzeFile(options: AnalysisOptions): Promise<AnalysisResult> {
    const { path, mode = "concise", include } = options;

    try {
      // SourceFileを取得
      const sourceFile = this.programManager.getSourceFile(path);
      if (!sourceFile) {
        throw new Error(`Source file not found: ${path}`);
      }

      const typeChecker = this.programManager.getTypeChecker([path]);

      // 並行で各Analyzerを実行
      const [structure, types, dependencies, documentation] = await Promise.all([
        this.shouldInclude("structure", include)
          ? this.structureAnalyzer.analyze(sourceFile, typeChecker)
          : Promise.resolve({ functions: [], classes: [] }),

        this.shouldInclude("types", include)
          ? this.typeAnalyzer.analyze(sourceFile, typeChecker)
          : Promise.resolve({ types: [], enums: [] }),

        this.shouldInclude("dependencies", include)
          ? this.dependencyAnalyzer.analyze(sourceFile)
          : Promise.resolve({ imports: [], exports: [] }),

        this.shouldInclude("docs", include)
          ? this.documentationExtractor.extract(sourceFile)
          : Promise.resolve(null),
      ]);

      // モードに応じて出力を変換
      const result = this.transformByMode({
        success: true,
        partial: false,
        file: {
          path,
          size: sourceFile.text.length,
          lines: sourceFile.getLineAndCharacterOfPosition(sourceFile.end).line + 1,
        },
        functions: structure.functions,
        classes: structure.classes,
        types: types.types,
        enums: types.enums,
        dependencies,
        documentation,
      }, mode);

      return result;
    } catch (error) {
      // エラー時はフォールバック情報を返す
      return {
        success: false,
        partial: true,
        file: {
          path,
          size: 0,
          lines: 0,
        },
        errors: [
          {
            code: "ANALYSIS_ERROR",
            message: error.message,
            severity: "error",
          },
        ],
      };
    }
  }

  /**
   * includeオプションで指定された情報を含めるか判定
   */
  private shouldInclude(type: string, include?: string[]): boolean {
    if (!include) return true;
    return include.includes(type);
  }

  /**
   * モードに応じて出力を変換
   */
  private transformByMode(
    result: AnalysisResult,
    mode: "concise" | "detailed"
  ): AnalysisResult {
    if (mode === "concise") {
      // 簡潔モード: シグネチャのみ、本体は削除
      return {
        ...result,
        functions: result.functions?.map((f) => ({
          ...f,
          body: undefined, // 本体削除
        })),
        classes: result.classes?.map((c) => ({
          ...c,
          methods: c.methods?.map((m) => ({
            ...m,
            body: undefined, // メソッド本体削除
          })),
        })),
      };
    } else {
      // 詳細モード: 本体のプレビュー（最初の3行）を含む
      return {
        ...result,
        functions: result.functions?.map((f) => ({
          ...f,
          bodyPreview: f.body?.split("\n").slice(0, 3).join("\n"),
          body: undefined, // 完全な本体は削除
        })),
      };
    }
  }
}
```

**完了条件**:
- [ ] すべてのテストが通過 (Green)
- [ ] 複数Analyzerが並行実行される
- [ ] モード切り替えが正常動作
- [ ] includeオプションが機能

**テスト要件**:
- `bun test tests/orchestration/AnalysisOrchestrator.test.ts` が全通過

---

##### - [ ] TASK-0303: AnalysisOrchestrator Refactor + タイムアウト
- **タスクタイプ**: TDD
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0302
- **要件リンク**: NFR-002〜NFR-004 (性能要件)
- **信頼性レベル**: 🔵

**実装詳細** (Refactor):
1. タイムアウト実装
   ```typescript
   private async withTimeout<T>(
     promise: Promise<T>,
     ms: number,
     errorMsg: string
   ): Promise<T> {
     const timeout = new Promise<never>((_, reject) =>
       setTimeout(() => reject(new Error(errorMsg)), ms)
     );
     return Promise.race([promise, timeout]);
   }
   ```
2. メモリ監視
3. コード整理

**完了条件**:
- [ ] タイムアウト機能追加
- [ ] リファクタリング後もテスト通過

---

#### Days 38-39: CacheManager実装

##### - [ ] TASK-0304: CacheManager基本実装 (TDD Red)
- **タスクタイプ**: TDD
- **推定工数**: 4時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0302
- **要件リンク**: REQ-111 (キャッシュ), NFR-005 (キャッシュヒット10ms以内)
- **信頼性レベル**: 🔵 (cache-design.md準拠)

**実装詳細** (Red):

`tests/orchestration/CacheManager.test.ts`:
```typescript
import { describe, test, expect } from "bun:test";
import { CacheManager } from "../../src/orchestration/CacheManager";

describe("CacheManager", () => {
  test("キャッシュにデータを保存・取得", () => {
    const cache = new CacheManager();
    const key = "test-file.ts:1730188800000:concise:all";
    const data = { functions: [], classes: [] };

    cache.set(key, data);
    const cached = cache.get(key);

    expect(cached).toEqual(data);
  });

  test("キャッシュキーを正しく生成", () => {
    const cache = new CacheManager();
    const key = cache.generateKey({
      path: "src/index.ts",
      mtime: 1730188800000,
      mode: "concise",
      include: ["structure", "types"],
    });

    expect(key).toBe("src/index.ts:1730188800000:concise:structure,types");
  });

  test("mtime変更でキャッシュ無効化", () => {
    const cache = new CacheManager();
    const data = { functions: [] };

    // 旧mtime
    const oldKey = cache.generateKey({
      path: "src/index.ts",
      mtime: 1730188800000,
      mode: "concise",
    });
    cache.set(oldKey, data);

    // 新mtime（ファイル更新）
    const newKey = cache.generateKey({
      path: "src/index.ts",
      mtime: 1730188900000, // 100秒後
      mode: "concise",
    });

    // 新しいキーでキャッシュミス
    expect(cache.get(newKey)).toBeUndefined();
  });

  test("LRU: 最大エントリ数超過で古いエントリを削除", () => {
    const cache = new CacheManager({ maxEntries: 3 });

    cache.set("key1", { data: 1 });
    cache.set("key2", { data: 2 });
    cache.set("key3", { data: 3 });
    cache.set("key4", { data: 4 }); // 最大数超過

    // key1が削除される
    expect(cache.get("key1")).toBeUndefined();
    expect(cache.get("key4")).toBeDefined();
  });

  test("アクセスでLRU順序更新", () => {
    const cache = new CacheManager({ maxEntries: 3 });

    cache.set("key1", { data: 1 });
    cache.set("key2", { data: 2 });
    cache.set("key3", { data: 3 });

    // key1にアクセス（最新にする）
    cache.get("key1");

    // key4追加でkey2が削除される（key1は最新のため残る）
    cache.set("key4", { data: 4 });

    expect(cache.get("key1")).toBeDefined();
    expect(cache.get("key2")).toBeUndefined();
  });

  test("キャッシュヒットが10ms以内", () => {
    const cache = new CacheManager();
    const key = "perf-test.ts:1730188800000:concise:all";
    const data = { functions: new Array(100).fill({ name: "test" }) };

    // 初回保存
    cache.set(key, data);

    // キャッシュヒット時間測定
    const start = Date.now();
    const cached = cache.get(key);
    const elapsed = Date.now() - start;

    expect(cached).toBeDefined();
    expect(elapsed).toBeLessThan(10);
  });
});
```

**完了条件**:
- [ ] テストが作成され、すべて失敗 (Red)
- [ ] LRUアルゴリズムのテストケース完備
- [ ] キャッシュヒット性能テスト追加

**テスト要件**:
- キャッシュ保存・取得
- キャッシュキー生成
- mtime無効化
- LRUアルゴリズム
- 性能 (10ms以内)

---

##### - [ ] TASK-0305: CacheManager実装 (TDD Green)
- **タスクタイプ**: TDD
- **推定工数**: 6時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0304
- **要件リンク**: REQ-111, NFR-005
- **信頼性レベル**: 🔵 (cache-design.md Section 2準拠)

**実装詳細** (Green):

`src/orchestration/CacheManager.ts`:
```typescript
/**
 * キャッシュキー生成オプション
 */
export interface CacheKeyOptions {
  path: string;
  mtime: number;
  mode: "concise" | "detailed";
  include?: string[];
}

/**
 * キャッシュエントリ
 */
interface CacheEntry<T> {
  key: string;
  data: T;
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
  size: number;
}

/**
 * キャッシュ設定
 */
export interface CacheConfig {
  maxEntries?: number;          // 最大エントリ数
  maxMemory?: number;            // 最大メモリ (bytes)
  ttl?: number;                  // TTL (0=無期限)
}

/**
 * キャッシュマネージャー
 * LRUアルゴリズムによる解析結果のキャッシュ管理
 */
export class CacheManager<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private totalSize: number;
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.cache = new Map();
    this.totalSize = 0;
    this.config = {
      maxEntries: config.maxEntries ?? 100,
      maxMemory: config.maxMemory ?? 50 * 1024 * 1024, // 50MB
      ttl: config.ttl ?? 0,
    };
  }

  /**
   * キャッシュキーを生成
   * 形式: ${path}:${mtime}:${mode}:${include}
   */
  generateKey(options: CacheKeyOptions): string {
    const { path, mtime, mode, include } = options;
    const includeStr = include?.sort().join(",") ?? "all";
    return `${path}:${mtime}:${mode}:${includeStr}`;
  }

  /**
   * キャッシュから取得
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // TTLチェック
    if (this.config.ttl > 0) {
      const elapsed = Date.now() - entry.createdAt;
      if (elapsed > this.config.ttl) {
        this.cache.delete(key);
        return undefined;
      }
    }

    // アクセス情報更新
    entry.lastAccessedAt = Date.now();
    entry.accessCount++;

    // LRU: Mapから削除して再挿入（最新にする）
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  /**
   * キャッシュに保存
   */
  set(key: string, data: T): void {
    const size = this.estimateSize(data);

    const entry: CacheEntry<T> = {
      key,
      data,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
      size,
    };

    // 既存エントリがあれば削除
    if (this.cache.has(key)) {
      const old = this.cache.get(key)!;
      this.totalSize -= old.size;
      this.cache.delete(key);
    }

    // 新エントリ追加
    this.cache.set(key, entry);
    this.totalSize += size;

    // エビクション（削除）
    this.evictIfNeeded();
  }

  /**
   * 特定ファイルのキャッシュをクリア
   */
  clearFile(path: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(path + ":")) {
        this.totalSize -= entry.size;
        this.cache.delete(key);
      }
    }
  }

  /**
   * すべてのキャッシュをクリア
   */
  clearAll(): void {
    this.cache.clear();
    this.totalSize = 0;
  }

  /**
   * キャッシュ統計を取得
   */
  getStats() {
    return {
      entries: this.cache.size,
      totalSize: this.totalSize,
      maxEntries: this.config.maxEntries,
      maxMemory: this.config.maxMemory,
    };
  }

  /**
   * エビクション（削除）ロジック
   */
  private evictIfNeeded(): void {
    // サイズ制限を超えている場合、最も古いエントリを削除
    while (
      this.cache.size > this.config.maxEntries ||
      this.totalSize > this.config.maxMemory
    ) {
      // Map の最初のエントリ = 最も古いエントリ (LRU)
      const firstKey = this.cache.keys().next().value;
      if (!firstKey) break;

      const entry = this.cache.get(firstKey);
      if (entry) {
        this.totalSize -= entry.size;
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * データサイズを推定
   */
  private estimateSize(data: T): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 1024; // デフォルト1KB
    }
  }
}
```

**完了条件**:
- [ ] すべてのテストが通過 (Green)
- [ ] LRUアルゴリズムが正確に動作
- [ ] キャッシュヒット時10ms以内
- [ ] mtime変更でキャッシュ無効化

**テスト要件**:
- `bun test tests/orchestration/CacheManager.test.ts` が全通過

---

##### - [ ] TASK-0306: CacheManager Refactor + 統計機能
- **タスクタイプ**: TDD
- **推定工数**: 2時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0305
- **要件リンク**: NFR-005
- **信頼性レベル**: 🔵

**実装詳細** (Refactor):
1. キャッシュヒット率計算
   ```typescript
   private hits = 0;
   private misses = 0;

   getHitRate(): number {
     const total = this.hits + this.misses;
     return total > 0 ? this.hits / total : 0;
   }
   ```
2. メモリ使用量監視
3. コード整理

**完了条件**:
- [ ] 統計機能追加
- [ ] リファクタリング後もテスト通過

---

#### Day 40: キャッシュ統合テスト

##### - [ ] TASK-0307: Orchestrator + Cache統合テスト
- **タスクタイプ**: TDD
- **推定工数**: 4時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0303, TASK-0306
- **要件リンク**: NFR-005, NFR-006
- **信頼性レベル**: 🔵

**実装詳細**:
`tests/orchestration/integration.test.ts`:
```typescript
import { describe, test, expect } from "bun:test";
import { AnalysisOrchestrator } from "../../src/orchestration/AnalysisOrchestrator";
import { CacheManager } from "../../src/orchestration/CacheManager";
import { ProgramManager } from "../../src/compiler/ProgramManager";

describe("Orchestrator + Cache統合", () => {
  test("初回解析後、キャッシュヒットで10ms以内", async () => {
    const programManager = new ProgramManager({
      rootPath: process.cwd(),
      compilerOptions: {},
    });
    const cache = new CacheManager();
    const orchestrator = new AnalysisOrchestrator(programManager, cache);

    const path = "./tests/fixtures/sample-simple.ts";

    // 初回解析（キャッシュミス）
    await orchestrator.analyzeFile({ path, mode: "concise" });

    // 2回目（キャッシュヒット）
    const start = Date.now();
    await orchestrator.analyzeFile({ path, mode: "concise" });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(10);
  });

  test("mtime変更でキャッシュ無効化される", async () => {
    const programManager = new ProgramManager({
      rootPath: process.cwd(),
      compilerOptions: {},
    });
    const cache = new CacheManager();
    const orchestrator = new AnalysisOrchestrator(programManager, cache);

    const path = "./tests/fixtures/mutable.ts";

    // 初回解析
    const result1 = await orchestrator.analyzeFile({ path, mode: "concise" });

    // ファイル更新をシミュレート（mtimeが変わる）
    // ... (テスト用にファイルを書き換え)

    // 2回目解析（キャッシュミス）
    const result2 = await orchestrator.analyzeFile({ path, mode: "concise" });

    // 異なる結果が返る
    expect(result1).not.toBe(result2);
  });

  test("モードが異なれば別キャッシュエントリ", async () => {
    const cache = new CacheManager();

    const key1 = cache.generateKey({
      path: "src/index.ts",
      mtime: 1730188800000,
      mode: "concise",
    });

    const key2 = cache.generateKey({
      path: "src/index.ts",
      mtime: 1730188800000,
      mode: "detailed",
    });

    expect(key1).not.toBe(key2);
  });
});
```

**完了条件**:
- [ ] 統合テスト全通過
- [ ] NFR-005 (キャッシュヒット10ms以内) 達成

**テスト要件**:
- キャッシュヒット性能
- mtime無効化
- モード別キャッシュ

---

##### - [ ] TASK-0308: Week 1振り返りとドキュメント
- **タスクタイプ**: DIRECT
- **推定工数**: 4時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0307
- **信頼性レベル**: 🔵

**実装詳細**:
1. Week 1の成果物レビュー
2. パフォーマンステスト実行
3. ドキュメント更新
4. Week 2準備

**完了条件**:
- [ ] AnalysisOrchestrator完成
- [ ] CacheManager完成
- [ ] キャッシュヒット10ms以内達成
- [ ] Week 2準備完了

---

### Week 2: Tool Handlers

---

#### Days 41-42: AnalyzeFileTool実装

##### - [ ] TASK-0309: AnalyzeFileTool基本実装 (TDD Red)
- **タスクタイプ**: TDD
- **推定工数**: 4時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0307
- **要件リンク**: REQ-001〜REQ-005, REQ-061〜REQ-064
- **信頼性レベル**: 🔵 (api-specification.md Section 1準拠)

**実装詳細** (Red):

`tests/tools/AnalyzeFileTool.test.ts`:
```typescript
import { describe, test, expect } from "bun:test";
import { AnalyzeFileTool } from "../../src/tools/AnalyzeFileTool";

describe("AnalyzeFileTool", () => {
  const tool = new AnalyzeFileTool({
    workspaceRoot: process.cwd() + "/tests/fixtures/workspace",
  });

  test("入力バリデーション: pathは必須", async () => {
    await expect(
      tool.execute({ mode: "concise" } as any)
    ).rejects.toThrow("path is required");
  });

  test("入力バリデーション: modeは'concise'または'detailed'", async () => {
    await expect(
      tool.execute({ path: "src/index.ts", mode: "invalid" } as any)
    ).rejects.toThrow("mode must be 'concise' or 'detailed'");
  });

  test("ワークスペース外のファイルを拒否", async () => {
    await expect(
      tool.execute({ path: "../../../etc/passwd" })
    ).rejects.toThrow("outside workspace");
  });

  test("正常系: ファイル解析成功", async () => {
    const result = await tool.execute({
      path: "src/index.ts",
      mode: "concise",
    });

    expect(result.success).toBe(true);
    expect(result.file.path).toContain("index.ts");
    expect(result.functions).toBeDefined();
  });

  test("簡潔モードでコンテキスト削減90%以上", async () => {
    const result = await tool.execute({
      path: "src/large.ts",
      mode: "concise",
    });

    const originalSize = result.file.size;
    const outputSize = JSON.stringify(result).length;

    // 90%削減 = 出力サイズが10%以下
    expect(outputSize).toBeLessThan(originalSize * 0.1);
  });

  test("JSON Schema準拠の出力", async () => {
    const result = await tool.execute({
      path: "src/index.ts",
      mode: "concise",
    });

    // 必須フィールド確認
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("file");
    expect(result).toHaveProperty("functions");
    expect(result).toHaveProperty("types");
  });
});
```

**完了条件**:
- [ ] テストが作成され、すべて失敗 (Red)
- [ ] 入力バリデーションのテストケース完備
- [ ] コンテキスト削減のテストケース追加

**テスト要件**:
- 入力バリデーション
- ワークスペース境界チェック
- JSON Schema準拠
- コンテキスト削減率

---

##### - [ ] TASK-0310: AnalyzeFileTool実装 (TDD Green)
- **タスクタイプ**: TDD
- **推定工数**: 6時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0309
- **要件リンク**: REQ-001〜REQ-005, REQ-061〜REQ-064
- **信頼性レベル**: 🔵 (api-specification.md Section 1準拠)

**実装詳細** (Green):

`src/tools/AnalyzeFileTool.ts`:
```typescript
import { PathResolver } from "../fs/PathResolver";
import { FileReader } from "../fs/FileReader";
import { AnalysisOrchestrator } from "../orchestration/AnalysisOrchestrator";
import { CacheManager } from "../orchestration/CacheManager";
import { stat } from "fs/promises";

/**
 * analyze_file ツールの入力
 */
export interface AnalyzeFileInput {
  path: string;
  mode?: "concise" | "detailed";
  include?: string[];
}

/**
 * analyze_file ツールの出力
 */
export interface AnalyzeFileOutput {
  success: boolean;
  partial: boolean;
  file: {
    path: string;
    size: number;
    lines: number;
  };
  summary?: string;
  exports?: Export[];
  imports?: Import[];
  functions?: Function[];
  classes?: Class[];
  types?: TypeDefinition[];
  enums?: EnumDefinition[];
  errors?: ParseError[];
  fallback?: {
    size: number;
    lines: number;
  };
}

/**
 * analyze_file ツール設定
 */
export interface AnalyzeFileToolConfig {
  workspaceRoot: string;
}

/**
 * analyze_file ツール
 * 単一ファイルの解析を行うMCPツール
 */
export class AnalyzeFileTool {
  private pathResolver: PathResolver;
  private fileReader: FileReader;
  private orchestrator: AnalysisOrchestrator;
  private cache: CacheManager;

  constructor(config: AnalyzeFileToolConfig) {
    this.pathResolver = new PathResolver(config.workspaceRoot);
    this.fileReader = new FileReader();
    // Orchestrator, Cacheは外部から注入することも可能
    // （テスト容易性のため）
  }

  /**
   * ツールを実行
   */
  async execute(input: AnalyzeFileInput): Promise<AnalyzeFileOutput> {
    // 1. 入力バリデーション
    this.validateInput(input);

    const { path, mode = "concise", include } = input;

    try {
      // 2. ワークスペース境界チェック
      const resolved = this.pathResolver.resolve(path);

      // 3. ファイル存在確認
      const fileStats = await stat(resolved.absolutePath);
      const mtime = fileStats.mtime.getTime();

      // 4. キャッシュチェック
      const cacheKey = this.cache.generateKey({
        path: resolved.absolutePath,
        mtime,
        mode,
        include,
      });

      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // 5. 解析実行
      const result = await this.orchestrator.analyzeFile({
        path: resolved.absolutePath,
        mode,
        include,
      });

      // 6. サマリー生成
      const summary = this.generateSummary(result);

      const output: AnalyzeFileOutput = {
        ...result,
        summary,
      };

      // 7. キャッシュに保存
      this.cache.set(cacheKey, output);

      return output;
    } catch (error) {
      // エラー時: 部分的成功またはフォールバック
      return {
        success: false,
        partial: true,
        file: {
          path,
          size: 0,
          lines: 0,
        },
        errors: [
          {
            code: "ANALYSIS_ERROR",
            message: error.message,
            severity: "error",
          },
        ],
      };
    }
  }

  /**
   * 入力バリデーション
   */
  private validateInput(input: AnalyzeFileInput): void {
    if (!input.path) {
      throw new Error("path is required");
    }

    if (input.mode && !["concise", "detailed"].includes(input.mode)) {
      throw new Error("mode must be 'concise' or 'detailed'");
    }

    if (input.include) {
      const validTypes = ["structure", "types", "docs", "dependencies"];
      for (const type of input.include) {
        if (!validTypes.includes(type)) {
          throw new Error(`Invalid include type: ${type}`);
        }
      }
    }
  }

  /**
   * サマリー生成
   */
  private generateSummary(result: any): string {
    const parts: string[] = [];

    if (result.functions?.length > 0) {
      parts.push(`${result.functions.length} functions`);
    }
    if (result.classes?.length > 0) {
      parts.push(`${result.classes.length} classes`);
    }
    if (result.types?.length > 0) {
      parts.push(`${result.types.length} type definitions`);
    }

    return parts.length > 0
      ? `File contains ${parts.join(", ")}`
      : "Empty or minimal file";
  }
}
```

**完了条件**:
- [ ] すべてのテストが通過 (Green)
- [ ] 入力バリデーション実装
- [ ] キャッシュ統合
- [ ] JSON Schema準拠の出力

**テスト要件**:
- `bun test tests/tools/AnalyzeFileTool.test.ts` が全通過

---

##### - [ ] TASK-0311: AnalyzeFileTool Refactor + エラーハンドリング
- **タスクタイプ**: TDD
- **推定工数**: 4時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0310
- **要件リンク**: REQ-101〜REQ-104 (部分的成功)
- **信頼性レベル**: 🔵

**実装詳細** (Refactor):
1. ErrorRecoveryManager統合
2. フォールバック情報生成
   ```typescript
   private async getFallbackInfo(path: string): Promise<any> {
     try {
       const stats = await stat(path);
       const content = await Bun.file(path).text();
       return {
         size: stats.size,
         lines: content.split("\n").length,
       };
     } catch {
       return { size: 0, lines: 0 };
     }
   }
   ```
3. コード整理

**完了条件**:
- [ ] エラーハンドリング強化
- [ ] フォールバック情報生成
- [ ] リファクタリング後もテスト通過

---

#### Day 43: SearchSymbolTool実装

##### - [ ] TASK-0312: SearchSymbolTool実装 (TDD Red→Green)
- **タスクタイプ**: TDD
- **推定工数**: 6時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0311
- **要件リンク**: REQ-011〜REQ-014
- **信頼性レベル**: 🔵 (api-specification.md Section 2準拠)

**実装詳細**:

**Red: テストケース**:
```typescript
import { describe, test, expect } from "bun:test";
import { SearchSymbolTool } from "../../src/tools/SearchSymbolTool";

describe("SearchSymbolTool", () => {
  const tool = new SearchSymbolTool({
    workspaceRoot: process.cwd() + "/tests/fixtures/workspace",
  });

  test("入力バリデーション: symbolは必須", async () => {
    await expect(
      tool.execute({} as any)
    ).rejects.toThrow("symbol is required");
  });

  test("シンボル検索: 完全一致", async () => {
    const result = await tool.execute({
      symbol: "getUser",
      matchType: "exact",
    });

    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches[0].name).toBe("getUser");
  });

  test("シンボル検索: 前方一致", async () => {
    const result = await tool.execute({
      symbol: "get",
      matchType: "prefix",
    });

    expect(result.matches.length).toBeGreaterThan(0);
    result.matches.forEach((m) => {
      expect(m.name.startsWith("get")).toBe(true);
    });
  });

  test("型フィルター: 関数のみ", async () => {
    const result = await tool.execute({
      symbol: "User",
      type: "function",
    });

    result.matches.forEach((m) => {
      expect(m.symbolType).toBe("function");
    });
  });

  test("並行処理で高速検索", async () => {
    const start = Date.now();

    await tool.execute({
      symbol: "User",
      matchType: "partial",
    });

    const elapsed = Date.now() - start;
    // 複数ファイル検索でも1秒以内
    expect(elapsed).toBeLessThan(1000);
  });
});
```

**Green: 実装**:
```typescript
import { PathResolver } from "../fs/PathResolver";
import { SymbolExtractor } from "../analyzers/SymbolExtractor";

/**
 * search_symbol ツールの入力
 */
export interface SearchSymbolInput {
  symbol: string;
  type?: "function" | "class" | "interface" | "type" | "enum" | "variable";
  matchType?: "exact" | "prefix" | "suffix" | "partial";
}

/**
 * search_symbol ツールの出力
 */
export interface SearchSymbolOutput {
  query: string;
  matches: SymbolMatch[];
  totalMatches: number;
}

export interface SymbolMatch {
  name: string;
  symbolType: string;
  file: string;
  location: {
    line: number;
    column: number;
  };
  signature?: string;
}

/**
 * search_symbol ツール
 * プロジェクト内のシンボル検索を行うMCPツール
 */
export class SearchSymbolTool {
  private pathResolver: PathResolver;
  private symbolExtractor: SymbolExtractor;

  constructor(config: { workspaceRoot: string }) {
    this.pathResolver = new PathResolver(config.workspaceRoot);
    this.symbolExtractor = new SymbolExtractor();
  }

  async execute(input: SearchSymbolInput): Promise<SearchSymbolOutput> {
    this.validateInput(input);

    const { symbol, type, matchType = "exact" } = input;

    // 1. ワークスペース内のTSファイルを取得
    const files = await this.pathResolver.matchFiles([
      "**/*.ts",
      "**/*.tsx",
      "**/*.js",
      "**/*.jsx",
    ]);

    // 2. 並行でシンボル検索
    const allMatches = await Promise.all(
      files.map((file) => this.searchInFile(file, symbol, matchType, type))
    );

    // 3. 結果を集約
    const matches = allMatches.flat();

    return {
      query: symbol,
      matches,
      totalMatches: matches.length,
    };
  }

  private validateInput(input: SearchSymbolInput): void {
    if (!input.symbol) {
      throw new Error("symbol is required");
    }
  }

  private async searchInFile(
    file: string,
    symbol: string,
    matchType: string,
    type?: string
  ): Promise<SymbolMatch[]> {
    try {
      const symbols = await this.symbolExtractor.extractFromFile(file);

      return symbols
        .filter((s) => this.matchSymbol(s.name, symbol, matchType))
        .filter((s) => !type || s.type === type)
        .map((s) => ({
          name: s.name,
          symbolType: s.type,
          file,
          location: s.location,
          signature: s.signature,
        }));
    } catch {
      return [];
    }
  }

  private matchSymbol(
    name: string,
    pattern: string,
    matchType: string
  ): boolean {
    switch (matchType) {
      case "exact":
        return name === pattern;
      case "prefix":
        return name.startsWith(pattern);
      case "suffix":
        return name.endsWith(pattern);
      case "partial":
        return name.includes(pattern);
      default:
        return false;
    }
  }
}
```

**完了条件**:
- [ ] テスト全通過
- [ ] 並行処理による高速検索
- [ ] マッチングタイプ実装

**テスト要件**:
- シンボル検索
- 並行処理性能
- マッチングタイプ

---

##### - [ ] TASK-0313: SearchSymbolTool Refactor
- **タスクタイプ**: TDD
- **推定工数**: 2時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0312
- **要件リンク**: NFR-006
- **信頼性レベル**: 🔵

**実装詳細** (Refactor):
1. 検索結果のソート（ファイル名順、位置順）
2. 検索結果の件数制限オプション
3. コード整理

**完了条件**:
- [ ] リファクタリング後もテスト通過
- [ ] 検索性能維持

---

#### Day 44: AnalyzeProjectTool実装

##### - [ ] TASK-0314: AnalyzeProjectTool実装 (TDD Red→Green)
- **タスクタイプ**: TDD
- **推定工数**: 8時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0313
- **要件リンク**: REQ-031〜REQ-033
- **信頼性レベル**: 🔵 (api-specification.md Section 3準拠)

**実装詳細**:

**Red: テストケース**:
```typescript
import { describe, test, expect } from "bun:test";
import { AnalyzeProjectTool } from "../../src/tools/AnalyzeProjectTool";

describe("AnalyzeProjectTool", () => {
  const tool = new AnalyzeProjectTool({
    workspaceRoot: process.cwd() + "/tests/fixtures/workspace",
  });

  test("プロジェクト全体を解析", async () => {
    const result = await tool.execute({
      rootPath: "src",
      mode: "concise",
    });

    expect(result.summary).toBeDefined();
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.totalFiles).toBeGreaterThan(0);
  });

  test("includePatterns指定", async () => {
    const result = await tool.execute({
      rootPath: "src",
      includePatterns: ["**/*.ts"],
      excludePatterns: ["**/*.test.ts"],
    });

    // .tsファイルのみ
    result.files.forEach((f) => {
      expect(f.path.endsWith(".ts")).toBe(true);
      expect(f.path.includes(".test.ts")).toBe(false);
    });
  });

  test("10ファイル並行解析が2秒以内", async () => {
    const start = Date.now();

    await tool.execute({
      rootPath: "src",
      mode: "concise",
    });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });

  test("依存関係グラフを構築", async () => {
    const result = await tool.execute({
      rootPath: "src",
      mode: "detailed",
    });

    expect(result.dependencyGraph).toBeDefined();
    expect(result.dependencyGraph.nodes.length).toBeGreaterThan(0);
  });
});
```

**Green: 実装**:
```typescript
import { PathResolver } from "../fs/PathResolver";
import { AnalysisOrchestrator } from "../orchestration/AnalysisOrchestrator";

/**
 * analyze_project ツールの入力
 */
export interface AnalyzeProjectInput {
  rootPath: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  mode?: "concise" | "detailed";
}

/**
 * analyze_project ツールの出力
 */
export interface AnalyzeProjectOutput {
  success: boolean;
  summary: string;
  files: FileAnalysisSummary[];
  totalFiles: number;
  dependencyGraph?: DependencyGraph;
  statistics: {
    totalFunctions: number;
    totalClasses: number;
    totalTypes: number;
  };
}

/**
 * analyze_project ツール
 * プロジェクト全体の解析を行うMCPツール
 */
export class AnalyzeProjectTool {
  private pathResolver: PathResolver;
  private orchestrator: AnalysisOrchestrator;

  constructor(config: { workspaceRoot: string }) {
    this.pathResolver = new PathResolver(config.workspaceRoot);
  }

  async execute(input: AnalyzeProjectInput): Promise<AnalyzeProjectOutput> {
    const {
      rootPath,
      includePatterns = ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
      excludePatterns = ["**/node_modules/**", "**/*.test.ts"],
      mode = "concise",
    } = input;

    // 1. ファイル一覧を取得
    const files = await this.pathResolver.matchFiles(includePatterns);
    const filtered = files.filter(
      (f) => !excludePatterns.some((pattern) => f.includes(pattern))
    );

    // 2. 並行で解析
    const results = await Promise.all(
      filtered.map((file) =>
        this.orchestrator.analyzeFile({ path: file, mode })
      )
    );

    // 3. 統計を集計
    const statistics = this.calculateStatistics(results);

    // 4. 依存関係グラフを構築
    const dependencyGraph = mode === "detailed"
      ? this.buildDependencyGraph(results)
      : undefined;

    return {
      success: true,
      summary: this.generateProjectSummary(results),
      files: results.map((r) => ({
        path: r.file.path,
        summary: r.summary,
      })),
      totalFiles: results.length,
      dependencyGraph,
      statistics,
    };
  }

  private calculateStatistics(results: any[]) {
    return {
      totalFunctions: results.reduce((sum, r) => sum + (r.functions?.length || 0), 0),
      totalClasses: results.reduce((sum, r) => sum + (r.classes?.length || 0), 0),
      totalTypes: results.reduce((sum, r) => sum + (r.types?.length || 0), 0),
    };
  }

  private buildDependencyGraph(results: any[]): DependencyGraph {
    const nodes = results.map((r) => r.file.path);
    const edges: { from: string; to: string }[] = [];

    results.forEach((r) => {
      r.dependencies?.imports.forEach((imp: any) => {
        if (imp.type === "internal") {
          edges.push({ from: r.file.path, to: imp.source });
        }
      });
    });

    return { nodes, edges };
  }

  private generateProjectSummary(results: any[]): string {
    const stats = this.calculateStatistics(results);
    return `Project contains ${results.length} files, ${stats.totalFunctions} functions, ${stats.totalClasses} classes, ${stats.totalTypes} type definitions`;
  }
}
```

**完了条件**:
- [ ] テスト全通過
- [ ] 並行処理実装
- [ ] 依存関係グラフ構築

**テスト要件**:
- プロジェクト全体解析
- 並行処理性能 (2秒以内)
- 依存関係グラフ

---

#### Day 45: GetDependenciesTool実装

##### - [ ] TASK-0315: GetDependenciesTool実装 (TDD Red→Green)
- **タスクタイプ**: TDD
- **推定工数**: 8時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0314
- **要件リンク**: REQ-021〜REQ-024
- **信頼性レベル**: 🔵 (api-specification.md Section 4準拠)

**実装詳細**:

**Red: テストケース**:
```typescript
import { describe, test, expect } from "bun:test";
import { GetDependenciesTool } from "../../src/tools/GetDependenciesTool";

describe("GetDependenciesTool", () => {
  const tool = new GetDependenciesTool({
    workspaceRoot: process.cwd() + "/tests/fixtures/workspace",
  });

  test("依存関係を取得", async () => {
    const result = await tool.execute({
      path: "src/index.ts",
    });

    expect(result.file).toBeDefined();
    expect(result.dependencies.internal).toBeDefined();
    expect(result.dependencies.external).toBeDefined();
  });

  test("再帰的に依存ファイルを追跡", async () => {
    const result = await tool.execute({
      path: "src/index.ts",
      depth: 2,
    });

    // depth=2なので、2段階まで依存を追跡
    expect(result.dependencyTree).toBeDefined();
  });

  test("循環依存を検出", async () => {
    const result = await tool.execute({
      path: "src/circular-a.ts",
    });

    expect(result.circularDependencies).toBeDefined();
    expect(result.circularDependencies.length).toBeGreaterThan(0);
  });

  test("内部/外部依存を区別", async () => {
    const result = await tool.execute({
      path: "src/index.ts",
    });

    result.dependencies.internal.forEach((dep) => {
      expect(dep.source.startsWith(".")).toBe(true);
    });

    result.dependencies.external.forEach((dep) => {
      expect(dep.source.startsWith(".")).toBe(false);
    });
  });
});
```

**Green: 実装**:
```typescript
import { DependencyAnalyzer } from "../analyzers/DependencyAnalyzer";
import { ProgramManager } from "../compiler/ProgramManager";

/**
 * get_dependencies ツールの入力
 */
export interface GetDependenciesInput {
  path: string;
  depth?: number;
}

/**
 * get_dependencies ツールの出力
 */
export interface GetDependenciesOutput {
  file: string;
  dependencies: {
    internal: Import[];
    external: Import[];
  };
  dependencyTree?: DependencyNode;
  circularDependencies?: string[][];
}

export interface DependencyNode {
  file: string;
  dependencies: DependencyNode[];
}

/**
 * get_dependencies ツール
 * ファイルの依存関係を解析するMCPツール
 */
export class GetDependenciesTool {
  private programManager: ProgramManager;
  private dependencyAnalyzer: DependencyAnalyzer;

  constructor(config: { workspaceRoot: string }) {
    this.programManager = new ProgramManager({
      rootPath: config.workspaceRoot,
      compilerOptions: {},
    });
    this.dependencyAnalyzer = new DependencyAnalyzer();
  }

  async execute(input: GetDependenciesInput): Promise<GetDependenciesOutput> {
    const { path, depth = 1 } = input;

    // 1. SourceFileを取得
    const sourceFile = this.programManager.getSourceFile(path);
    if (!sourceFile) {
      throw new Error(`File not found: ${path}`);
    }

    // 2. 依存関係を解析
    const dependencies = await this.dependencyAnalyzer.analyze(sourceFile);

    // 3. 内部/外部を分類
    const internal = dependencies.imports.filter((imp) => imp.type === "internal");
    const external = dependencies.imports.filter((imp) => imp.type === "external");

    // 4. 再帰的に依存ツリーを構築
    const dependencyTree = depth > 1
      ? await this.buildDependencyTree(path, depth, new Set())
      : undefined;

    // 5. 循環依存を検出
    const circularDependencies = this.detectCircularDependencies(path);

    return {
      file: path,
      dependencies: { internal, external },
      dependencyTree,
      circularDependencies,
    };
  }

  private async buildDependencyTree(
    file: string,
    depth: number,
    visited: Set<string>
  ): Promise<DependencyNode> {
    if (depth === 0 || visited.has(file)) {
      return { file, dependencies: [] };
    }

    visited.add(file);

    const sourceFile = this.programManager.getSourceFile(file);
    if (!sourceFile) {
      return { file, dependencies: [] };
    }

    const deps = await this.dependencyAnalyzer.analyze(sourceFile);
    const internalDeps = deps.imports.filter((imp) => imp.type === "internal");

    const children = await Promise.all(
      internalDeps.map((dep) =>
        this.buildDependencyTree(dep.source, depth - 1, visited)
      )
    );

    return { file, dependencies: children };
  }

  private detectCircularDependencies(file: string): string[][] {
    // 循環依存検出アルゴリズム (DFS)
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const stack: string[] = [];

    const dfs = (current: string) => {
      if (stack.includes(current)) {
        // 循環検出
        const cycleStart = stack.indexOf(current);
        cycles.push(stack.slice(cycleStart));
        return;
      }

      if (visited.has(current)) return;

      visited.add(current);
      stack.push(current);

      const sourceFile = this.programManager.getSourceFile(current);
      if (sourceFile) {
        const deps = this.dependencyAnalyzer.analyzeSync(sourceFile);
        deps.imports
          .filter((imp) => imp.type === "internal")
          .forEach((imp) => dfs(imp.source));
      }

      stack.pop();
    };

    dfs(file);
    return cycles;
  }
}
```

**完了条件**:
- [ ] テスト全通過
- [ ] 循環依存検出実装
- [ ] 再帰的依存追跡実装

**テスト要件**:
- 依存関係取得
- 循環依存検出
- 再帰的追跡

---

### Week 3: Integration & Testing

---

#### Days 46-47: Tool Handler統合テスト

##### - [ ] TASK-0316: Tool Handler統合テスト
- **タスクタイプ**: TDD
- **推定工数**: 8時間 (2日間)
- **要件名**: code-analysis
- **依存タスク**: TASK-0315
- **要件リンク**: NFR-203 (統合テスト)
- **信頼性レベル**: 🔵

**実装詳細**:
`tests/tools/integration.test.ts`:
```typescript
import { describe, test, expect } from "bun:test";
import { AnalyzeFileTool } from "../../src/tools/AnalyzeFileTool";
import { SearchSymbolTool } from "../../src/tools/SearchSymbolTool";
import { AnalyzeProjectTool } from "../../src/tools/AnalyzeProjectTool";
import { GetDependenciesTool } from "../../src/tools/GetDependenciesTool";

describe("Tool Handler統合テスト", () => {
  const workspace = process.cwd() + "/tests/fixtures/workspace";

  test("4つのツールが正常動作", async () => {
    const analyzeFileTool = new AnalyzeFileTool({ workspaceRoot: workspace });
    const searchSymbolTool = new SearchSymbolTool({ workspaceRoot: workspace });
    const analyzeProjectTool = new AnalyzeProjectTool({ workspaceRoot: workspace });
    const getDependenciesTool = new GetDependenciesTool({ workspaceRoot: workspace });

    // 各ツール実行
    const fileResult = await analyzeFileTool.execute({
      path: "src/index.ts",
      mode: "concise",
    });

    const symbolResult = await searchSymbolTool.execute({
      symbol: "User",
      matchType: "partial",
    });

    const projectResult = await analyzeProjectTool.execute({
      rootPath: "src",
      mode: "concise",
    });

    const depsResult = await getDependenciesTool.execute({
      path: "src/index.ts",
      depth: 2,
    });

    // すべて成功
    expect(fileResult.success).toBe(true);
    expect(symbolResult.matches.length).toBeGreaterThan(0);
    expect(projectResult.success).toBe(true);
    expect(depsResult.dependencies).toBeDefined();
  });

  test("エラーハンドリング: 構文エラーファイル", async () => {
    const analyzeFileTool = new AnalyzeFileTool({ workspaceRoot: workspace });

    const result = await analyzeFileTool.execute({
      path: "src/syntax-error.ts",
      mode: "concise",
    });

    // 部分的成功
    expect(result.success).toBe(false);
    expect(result.partial).toBe(true);
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("パフォーマンス: 全ツール実行が5秒以内", async () => {
    const start = Date.now();

    // 4ツール並行実行
    await Promise.all([
      new AnalyzeFileTool({ workspaceRoot: workspace }).execute({
        path: "src/index.ts",
      }),
      new SearchSymbolTool({ workspaceRoot: workspace }).execute({
        symbol: "User",
      }),
      new AnalyzeProjectTool({ workspaceRoot: workspace }).execute({
        rootPath: "src",
      }),
      new GetDependenciesTool({ workspaceRoot: workspace }).execute({
        path: "src/index.ts",
      }),
    ]);

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });
});
```

**完了条件**:
- [ ] 統合テスト全通過
- [ ] 4ツール全て正常動作
- [ ] エラーハンドリング確認

**テスト要件**:
- 4ツール統合
- エラーハンドリング
- パフォーマンス

---

##### - [ ] TASK-0317: エッジケーステスト
- **タスクタイプ**: TDD
- **推定工数**: 4時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0316
- **要件リンク**: EDGE-001, EDGE-101, EDGE-102
- **信頼性レベル**: 🔵

**実装詳細**:
`tests/tools/edge-cases.test.ts`:
```typescript
import { describe, test, expect } from "bun:test";
import { AnalyzeFileTool } from "../../src/tools/AnalyzeFileTool";

describe("エッジケーステスト", () => {
  const workspace = process.cwd() + "/tests/fixtures/workspace";
  const tool = new AnalyzeFileTool({ workspaceRoot: workspace });

  test("空のファイル (0バイト)", async () => {
    const result = await tool.execute({
      path: "src/empty.ts",
    });

    expect(result.file.size).toBe(0);
    expect(result.file.lines).toBe(0);
  });

  test("非常に大きなファイル (10,000行)", async () => {
    const result = await tool.execute({
      path: "src/huge.ts",
      mode: "concise",
    });

    expect(result.file.lines).toBeGreaterThan(10000);
    // メモリエラーが発生しないこと
  });

  test("コメントのみのファイル", async () => {
    const result = await tool.execute({
      path: "src/comments-only.ts",
    });

    expect(result.functions.length).toBe(0);
    expect(result.documentation).toBeDefined();
  });

  test("循環依存の検出", async () => {
    const getDependenciesTool = new GetDependenciesTool({ workspaceRoot: workspace });

    const result = await getDependenciesTool.execute({
      path: "src/circular-a.ts",
    });

    expect(result.circularDependencies.length).toBeGreaterThan(0);
  });
});
```

**完了条件**:
- [ ] エッジケーステスト全通過
- [ ] 境界値テストカバー

**テスト要件**:
- 空ファイル
- 大きなファイル
- コメントのみ
- 循環依存

---

#### Day 48: ErrorRecoveryManager実装

##### - [ ] TASK-0318: ErrorRecoveryManager実装
- **タスクタイプ**: TDD
- **推定工数**: 6時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0317
- **要件リンク**: REQ-101〜REQ-104 (部分的成功)
- **信頼性レベル**: 🔵 (architecture.md Section 3.3準拠)

**実装詳細**:

`src/orchestration/ErrorRecoveryManager.ts`:
```typescript
/**
 * エラーリカバリーマネージャー
 * 構文エラー時の部分解析、フォールバック情報の生成
 */
export class ErrorRecoveryManager {
  /**
   * 部分的成功のハンドリング
   */
  async handlePartialSuccess(
    error: Error,
    file: string
  ): Promise<PartialResult> {
    try {
      // 解析可能な部分を試行
      const partial = await this.attemptPartialAnalysis(file);

      return {
        success: false,
        partial: true,
        data: partial,
        errors: [
          {
            code: "PARTIAL_ANALYSIS",
            message: error.message,
            severity: "warning",
          },
        ],
        fallback: await this.getFallbackInfo(file),
      };
    } catch (fallbackError) {
      // 完全失敗
      return {
        success: false,
        partial: false,
        errors: [
          {
            code: "ANALYSIS_FAILED",
            message: fallbackError.message,
            severity: "error",
          },
        ],
        fallback: await this.getFallbackInfo(file),
      };
    }
  }

  /**
   * 部分解析を試行
   * import文、型定義など構文エラーの影響を受けにくい部分
   */
  private async attemptPartialAnalysis(file: string): Promise<any> {
    const sourceFile = this.createSourceFileWithErrors(file);

    // 構文エラーがあっても解析可能な部分
    const imports = this.extractImports(sourceFile);
    const types = this.extractTypes(sourceFile);

    return { imports, types };
  }

  /**
   * フォールバック情報を取得
   */
  private async getFallbackInfo(file: string): Promise<FallbackInfo> {
    try {
      const stats = await stat(file);
      const content = await Bun.file(file).text();

      return {
        size: stats.size,
        lines: content.split("\n").length,
        lastModified: stats.mtime,
      };
    } catch {
      return { size: 0, lines: 0 };
    }
  }
}
```

**完了条件**:
- [ ] ErrorRecoveryManager実装完了
- [ ] 部分的成功のハンドリング実装
- [ ] フォールバック情報生成実装

**テスト要件**:
- 部分的成功
- フォールバック情報
- 構文エラー時の挙動

---

##### - [ ] TASK-0319: エラーリカバリー統合
- **タスクタイプ**: TDD
- **推定工数**: 2時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0318
- **要件リンク**: REQ-101〜REQ-104
- **信頼性レベル**: 🔵

**実装詳細**:
1. 全ツールにErrorRecoveryManager統合
2. エラーハンドリングテスト
3. 部分的成功のテスト

**完了条件**:
- [ ] ErrorRecoveryManager統合完了
- [ ] エラーハンドリングテスト通過

---

#### Day 49: パフォーマンス最適化

##### - [ ] TASK-0320: パフォーマンス最適化
- **タスクタイプ**: DIRECT
- **推定工数**: 6時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0319
- **要件リンク**: NFR-002〜NFR-006
- **信頼性レベル**: 🔵

**実装詳細**:
1. Worker Pool実装 (並行数制限)
   ```typescript
   class WorkerPool {
     private maxWorkers = 10;
     private activeWorkers = 0;
     private queue: Array<() => Promise<any>> = [];

     async execute<T>(task: () => Promise<T>): Promise<T> {
       if (this.activeWorkers < this.maxWorkers) {
         return this.runTask(task);
       } else {
         return new Promise((resolve, reject) => {
           this.queue.push(() => task().then(resolve).catch(reject));
         });
       }
     }

     private async runTask<T>(task: () => Promise<T>): Promise<T> {
       this.activeWorkers++;
       try {
         return await task();
       } finally {
         this.activeWorkers--;
         this.processQueue();
       }
     }

     private processQueue() {
       if (this.queue.length > 0 && this.activeWorkers < this.maxWorkers) {
         const next = this.queue.shift();
         if (next) this.runTask(next);
       }
     }
   }
   ```
2. タイムアウト設定
3. メモリ監視

**完了条件**:
- [ ] Worker Pool実装
- [ ] タイムアウト設定
- [ ] NFR-002〜NFR-006達成

---

##### - [ ] TASK-0321: パフォーマンステスト
- **タスクタイプ**: TDD
- **推定工数**: 2時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0320
- **要件リンク**: NFR-002〜NFR-006
- **信頼性レベル**: 🔵

**実装詳細**:
`tests/performance/performance.test.ts`:
```typescript
import { describe, test, expect } from "bun:test";

describe("パフォーマンステスト", () => {
  test("小規模ファイル (100行) が50ms以内", async () => {
    // NFR-002
  });

  test("中規模ファイル (1000行) が200ms以内", async () => {
    // NFR-003
  });

  test("大規模ファイル (5000行) が1秒以内", async () => {
    // NFR-004
  });

  test("キャッシュヒットが10ms以内", async () => {
    // NFR-005
  });

  test("10ファイル並行解析が2秒以内", async () => {
    // NFR-006
  });
});
```

**完了条件**:
- [ ] パフォーマンステスト全通過
- [ ] NFR-002〜NFR-006達成

**テスト要件**:
- 小規模ファイル: 50ms以内
- 中規模ファイル: 200ms以内
- 大規模ファイル: 1秒以内
- キャッシュヒット: 10ms以内
- 10ファイル並行: 2秒以内

---

#### Day 50: Milestone 3検証

##### - [ ] TASK-0322: Milestone 3完全検証
- **タスクタイプ**: DIRECT
- **推定工数**: 6時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0321
- **信頼性レベル**: 🔵

**実装詳細**:
1. Milestone 3達成条件チェック
   - [ ] 4つのMCPツールが全て実装完了
   - [ ] キャッシュが正常に動作 (ヒット時10ms以内)
   - [ ] 簡潔モード/詳細モードが機能
   - [ ] エラーハンドリングが適切に動作
   - [ ] 統合テストが通過
2. 検証コマンド実行
   ```bash
   bun test tests/tools/
   bun test tests/orchestration/
   bun test tests/performance/
   bun test --coverage
   ```
3. パフォーマンス検証
4. メモリ使用量測定

**完了条件**:
- [ ] Milestone 3完全達成
- [ ] 全テスト通過
- [ ] NFR達成確認
- [ ] Phase 4準備完了

---

##### - [ ] TASK-0323: Phase 3レポート作成と次フェーズ準備
- **タスクタイプ**: DIRECT
- **推定工数**: 2時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0322
- **信頼性レベル**: 🔵

**実装詳細**:
1. Phase 3完了レポート作成
   - 達成項目
   - 技術的課題
   - パフォーマンス結果
   - 学び・改善点
2. Phase 4タスクファイル確認
3. Phase 4キックオフ準備

**完了条件**:
- [ ] Phase 3完了レポート完成
- [ ] Phase 4準備完了
- [ ] タスク管理ファイル更新

---

## Phase 3完了チェックリスト

### 成果物チェック
- [ ] AnalysisOrchestrator実装完了 (Analyzer統合、モード選択)
- [ ] CacheManager実装完了 (LRUアルゴリズム、mtime管理)
- [ ] ErrorRecoveryManager実装完了 (部分的成功、フォールバック)
- [ ] AnalyzeFileTool実装完了
- [ ] SearchSymbolTool実装完了
- [ ] AnalyzeProjectTool実装完了
- [ ] GetDependenciesTool実装完了
- [ ] モード切り替え機能 (concise/detailed)
- [ ] 並行処理 (Promise.all) による高速化

### テストチェック
- [ ] Orchestration層単体テスト全通過
- [ ] Cache層単体テスト全通過
- [ ] Tool Handler層単体テスト全通過
- [ ] 統合テスト全通過
- [ ] エッジケーステスト全通過
- [ ] パフォーマンステスト全通過
- [ ] テストカバレッジ70%以上

### 非機能要件チェック
- [ ] NFR-002: 小規模ファイル解析50ms以内
- [ ] NFR-003: 中規模ファイル解析200ms以内
- [ ] NFR-004: 大規模ファイル解析1秒以内
- [ ] NFR-005: キャッシュヒット10ms以内
- [ ] NFR-006: 10ファイル並行解析2秒以内
- [ ] NFR-101: 簡潔モード出力サイズ10%以下
- [ ] NFR-102: 詳細モード出力サイズ30%以下

### ドキュメントチェック
- [ ] API仕様書更新 (4ツール)
- [ ] アーキテクチャ図更新
- [ ] キャッシュ設計書確認
- [ ] JSDoc完備
- [ ] Phase 3完了レポート

---

## リスク管理

### 高リスク課題

#### 大規模プロジェクトのメモリ消費
**リスク**: 数千ファイルのプロジェクトで数GBのメモリ消費
**対策**:
- オンデマンド解析 (必要なファイルのみ) ✅
- LRUキャッシュによる自動削除 (TASK-0305) ✅
- Worker Pool による並行数制限 (TASK-0320) ✅
**状態**: 対策実装予定

#### キャッシュ整合性
**リスク**: ファイル更新時にキャッシュが古くなる
**対策**:
- mtimeベースのキャッシュ無効化 (TASK-0305) ✅
- キャッシュキーに `mtime` を含める ✅
**状態**: 対策実装予定

### 中リスク課題

#### 並行処理のデッドロック
**リスク**: 複数ファイルの並行解析時にリソース競合
**対策**:
- Worker Pool による並行数制限 (TASK-0320) ✅
- タイムアウト設定 (TASK-0303) ✅
- メモリ監視、閾値超過時は直列実行 ✅
**状態**: 対策実装予定

#### 構文エラーのあるファイル
**リスク**: 構文エラーで解析が完全失敗
**対策**:
- ErrorRecoveryManager実装 (TASK-0318) ✅
- 部分的成功の実装 ✅
- フォールバック情報の提供 ✅
**状態**: 対策実装予定

---

## パフォーマンス目標

| 指標 | 目標値 | 検証方法 | 状態 |
|-----|-------|---------|------|
| 小規模ファイル (100行) | 50ms以内 | TASK-0321 パフォーマンステスト | ⬜ |
| 中規模ファイル (1000行) | 200ms以内 | TASK-0321 パフォーマンステスト | ⬜ |
| 大規模ファイル (5000行) | 1秒以内 | TASK-0321 パフォーマンステスト | ⬜ |
| キャッシュヒット | 10ms以内 | TASK-0307 統合テスト | ⬜ |
| 10ファイル並行解析 | 2秒以内 | TASK-0321 パフォーマンステスト | ⬜ |
| コンテキスト削減 (簡潔) | 90%以上 | TASK-0309 AnalyzeFileTool | ⬜ |
| コンテキスト削減 (詳細) | 70%以上 | TASK-0309 AnalyzeFileTool | ⬜ |

---

## 依存関係マトリックス

### タスク依存関係
```
Phase 2完了
    ↓
TASK-0301 (Orchestrator Red) → TASK-0302 (Green) → TASK-0303 (Refactor)
    ↓
TASK-0304 (Cache Red) → TASK-0305 (Green) → TASK-0306 (Refactor)
    ↓
TASK-0307 (Orchestrator + Cache統合) → TASK-0308 (Week 1振り返り)
    ↓
TASK-0309 (AnalyzeFile Red) → TASK-0310 (Green) → TASK-0311 (Refactor)
    ↓
TASK-0312 (SearchSymbol Red→Green) → TASK-0313 (Refactor)
    ↓
TASK-0314 (AnalyzeProject Red→Green)
    ↓
TASK-0315 (GetDependencies Red→Green)
    ↓
TASK-0316 (Tool統合テスト) → TASK-0317 (エッジケース)
    ↓
TASK-0318 (ErrorRecoveryManager) → TASK-0319 (統合)
    ↓
TASK-0320 (パフォーマンス最適化) → TASK-0321 (パフォーマンステスト)
    ↓
TASK-0322 (Milestone 3検証) → TASK-0323 (Phase 3完了)
```

---

## 更新履歴

- **2025-10-31**: Phase 3タスクファイル作成
  - 総タスク数: 23タスク (TASK-0301 〜 TASK-0323)
  - 推定工数: 120-180時間
  - 期間: 15営業日
  - Week 1: Orchestration & Cache (5日)
  - Week 2: Tool Handlers (5日)
  - Week 3: Integration & Testing (5日)

---

**次のステップ**: Phase 2完了後、TASK-0301 (AnalysisOrchestrator基本実装) から開始

**関連文書**:
- アーキテクチャ: [architecture.md](../design/code-analysis/architecture.md)
- キャッシュ設計: [cache-design.md](../design/code-analysis/cache-design.md)
- API仕様: [api-specification.md](../design/code-analysis/api-specification.md)
- 要件: [requirements.md](../spec/code-analysis-requirements.md)
- タスク概要: [code-analysis-overview.md](./code-analysis-overview.md)
