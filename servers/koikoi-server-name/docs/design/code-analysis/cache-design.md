# コード解析MCP キャッシュ設計

## 概要

このドキュメントは、コード解析MCPサーバーのキャッシュ機構の詳細設計を定義します。キャッシュは**パフォーマンス目標（キャッシュヒット時10ms以内）**を達成するための重要なコンポーネントです。

---

## キャッシュ戦略

### 3層キャッシュアーキテクチャ

```
┌─────────────────────────────────────┐
│  Layer 1: 解析結果キャッシュ         │
│  - FileAnalysis オブジェクト         │
│  - LRU方式、メモリ内                 │
│  - TTL: ファイル更新まで無期限       │
└─────────────────────────────────────┘
            ↓ Cache Miss
┌─────────────────────────────────────┐
│  Layer 2: SourceFile キャッシュ      │
│  - TypeScript Compiler内部           │
│  - ts.Program が自動管理             │
└─────────────────────────────────────┘
            ↓ Cache Miss
┌─────────────────────────────────────┐
│  Layer 3: ファイルシステム           │
│  - 実ファイル読み込み                │
│  - Bun.file() 使用                   │
└─────────────────────────────────────┘
```

---

## Layer 1: 解析結果キャッシュ

### キャッシュキーの設計

**キー生成ロジック**:
```typescript
function generateCacheKey(
  path: string,
  mtime: number,
  mode: AnalysisMode,
  include?: string[]
): string {
  const includeStr = include?.sort().join(",") || "all";
  return `${path}:${mtime}:${mode}:${includeStr}`;
}
```

**キーの例**:
```
src/index.ts:1730188800000:concise:all
src/utils/helper.ts:1730188900000:detailed:structure,types
```

**キーの構成要素**:
1. `path`: ファイルパス（絶対パス）
2. `mtime`: ファイルの更新日時（Unix timestamp）
3. `mode`: 解析モード（concise or detailed）
4. `include`: 含める情報（オプション）

**ポイント**:
- `mtime` が変わると自動的にキャッシュが無効化される
- 同じファイルでも mode が違えば別のキャッシュエントリ

---

### データ構造

**キャッシュエントリ**:
```typescript
interface CacheEntry<T> {
  key: string;                    // キャッシュキー
  data: T;                        // キャッシュされたデータ
  meta: FileMeta;                 // ファイルメタデータ
  createdAt: number;              // 作成日時（Unix timestamp）
  lastAccessedAt: number;         // 最終アクセス日時
  accessCount: number;            // アクセス回数
  size: number;                   // データサイズ（bytes）
}
```

**キャッシュストレージ**:
```typescript
class CacheStore {
  private cache: Map<string, CacheEntry<FileAnalysis>>;
  private totalSize: number;       // 現在の総サイズ
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.totalSize = 0;
    this.config = config;
  }
}
```

---

### LRU (Least Recently Used) アルゴリズム

**実装方針**:
- JavaScript の `Map` は挿入順を保持するため、アクセス時に再挿入で LRU を実現
- アクセス時に `lastAccessedAt` と `accessCount` を更新

**LRUの実装**:
```typescript
get(key: string): CacheEntry<FileAnalysis> | undefined {
  const entry = this.cache.get(key);
  if (!entry) return undefined;

  // アクセス情報を更新
  entry.lastAccessedAt = Date.now();
  entry.accessCount++;

  // LRU: Mapから削除して再挿入（最新にする）
  this.cache.delete(key);
  this.cache.set(key, entry);

  return entry;
}
```

**エビクション（削除）ロジック**:
```typescript
private evictIfNeeded(): void {
  // サイズ制限を超えている場合、最も古いエントリを削除
  while (
    this.cache.size > this.config.maxEntries ||
    this.totalSize > this.config.maxMemory
  ) {
    // Map の最初のエントリ = 最も古いエントリ
    const firstKey = this.cache.keys().next().value;
    const entry = this.cache.get(firstKey);

    if (entry) {
      this.totalSize -= entry.size;
      this.cache.delete(firstKey);
    }
  }
}
```

---

### キャッシュの設定

**デフォルト設定**:
```typescript
const defaultCacheConfig: CacheConfig = {
  maxEntries: 100,              // 最大100ファイル
  maxMemory: 50 * 1024 * 1024,  // 最大50MB
  ttl: 0,                       // 無期限（mtimeで管理）
  useLRU: true,                 // LRU有効
};
```

**設定の調整**:
- 小規模プロジェクト: `maxEntries: 50`, `maxMemory: 25MB`
- 大規模プロジェクト: `maxEntries: 200`, `maxMemory: 100MB`

---

### キャッシュの無効化

**自動無効化**:
1. **ファイル更新時**: `mtime` が変わると、古いキャッシュキーは自動的にヒットしない
2. **メモリ不足時**: LRU方式で古いエントリを削除
3. **サーバー再起動時**: すべてのキャッシュがクリア（メモリ内のため）

**手動無効化**:
```typescript
// 特定ファイルのキャッシュをクリア
clearFile(path: string): void {
  for (const [key, entry] of this.cache.entries()) {
    if (entry.meta.path === path) {
      this.totalSize -= entry.size;
      this.cache.delete(key);
    }
  }
}

// すべてのキャッシュをクリア
clearAll(): void {
  this.cache.clear();
  this.totalSize = 0;
}
```

---

## Layer 2: SourceFile キャッシュ

### TypeScript Compiler のキャッシュ

**自動キャッシュ**:
- `ts.createProgram()` は内部で `SourceFile` をキャッシュ
- 同じファイルを再度解析する際、SourceFile の再パースを回避

**プログラムの再利用**:
```typescript
class ProgramManager {
  private program: ts.Program | null = null;
  private fileVersions: Map<string, number> = new Map();

  getProgram(files: string[]): ts.Program {
    // ファイルのバージョン（mtime）をチェック
    const needsUpdate = files.some(file => {
      const currentMtime = fs.statSync(file).mtimeMs;
      const cachedMtime = this.fileVersions.get(file);
      return currentMtime !== cachedMtime;
    });

    if (needsUpdate || !this.program) {
      // プログラムを再作成
      this.program = ts.createProgram(files, compilerOptions);

      // バージョンを更新
      files.forEach(file => {
        const mtime = fs.statSync(file).mtimeMs;
        this.fileVersions.set(file, mtime);
      });
    }

    return this.program;
  }
}
```

**メリット**:
- TypeScript Compiler が最適化されたキャッシュを提供
- AST の再パースコストを削減
- 型チェック結果もキャッシュ

---

## Layer 3: ファイルシステムキャッシュ

### OS レベルのキャッシュ

**自動的に利用される**:
- OSのファイルシステムキャッシュ（ページキャッシュ）
- 同じファイルを読み込む際、ディスクI/Oが削減される

**Bun.file() の最適化**:
```typescript
// Bun.file() は内部で最適化されている
const file = Bun.file(path);
const content = await file.text(); // 高速
```

---

## パフォーマンス目標と実測

### 目標値

| シナリオ | 目標 | 実装戦略 |
|---------|------|---------|
| キャッシュヒット | 10ms以内 | Layer 1からメモリ取得 |
| 初回解析（小規模） | 50ms以内 | Layer 2 + 3の活用 |
| 初回解析（中規模） | 200ms以内 | 並行処理 + Layer 2 |
| 初回解析（大規模） | 1秒以内 | 並行処理 + Layer 2 |

### パフォーマンス計測

**計測ポイント**:
```typescript
async function analyzeFileWithMetrics(
  path: string,
  mode: AnalysisMode
): Promise<{ result: FileAnalysis; metrics: Metrics }> {
  const startTime = performance.now();

  // キャッシュチェック
  const cacheCheckStart = performance.now();
  const cached = cache.get(generateCacheKey(path, ...));
  const cacheCheckTime = performance.now() - cacheCheckStart;

  if (cached) {
    return {
      result: cached.data,
      metrics: {
        totalTime: performance.now() - startTime,
        cacheHit: true,
        cacheCheckTime,
      },
    };
  }

  // 解析実行
  const analysisStart = performance.now();
  const result = await performAnalysis(path, mode);
  const analysisTime = performance.now() - analysisStart;

  // キャッシュに保存
  const cacheStoreStart = performance.now();
  cache.set(generateCacheKey(path, ...), result);
  const cacheStoreTime = performance.now() - cacheStoreStart;

  return {
    result,
    metrics: {
      totalTime: performance.now() - startTime,
      cacheHit: false,
      cacheCheckTime,
      analysisTime,
      cacheStoreTime,
    },
  };
}
```

---

## キャッシュの実装例

### CacheManager クラス

```typescript
export class CacheManager {
  private store: Map<string, CacheEntry<FileAnalysis>>;
  private totalSize: number;
  private config: CacheConfig;

  constructor(config: CacheConfig = defaultCacheConfig) {
    this.store = new Map();
    this.totalSize = 0;
    this.config = config;
  }

  /**
   * キャッシュからデータを取得
   */
  get(key: string): FileAnalysis | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    // TTLチェック（設定されている場合）
    if (this.config.ttl > 0) {
      const age = Date.now() - entry.createdAt;
      if (age > this.config.ttl) {
        this.delete(key);
        return null;
      }
    }

    // LRU: アクセス情報を更新
    entry.lastAccessedAt = Date.now();
    entry.accessCount++;

    // 最新にする
    this.store.delete(key);
    this.store.set(key, entry);

    return entry.data;
  }

  /**
   * キャッシュにデータを保存
   */
  set(key: string, data: FileAnalysis, meta: FileMeta): void {
    // データサイズを推定
    const size = this.estimateSize(data);

    // エビクションが必要かチェック
    this.evictIfNeeded(size);

    const entry: CacheEntry<FileAnalysis> = {
      key,
      data,
      meta,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 1,
      size,
    };

    this.store.set(key, entry);
    this.totalSize += size;
  }

  /**
   * キャッシュから削除
   */
  delete(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    this.totalSize -= entry.size;
    return this.store.delete(key);
  }

  /**
   * ファイルパスに関連するキャッシュをクリア
   */
  clearFile(path: string): void {
    for (const [key, entry] of this.store.entries()) {
      if (entry.meta.path === path) {
        this.totalSize -= entry.size;
        this.store.delete(key);
      }
    }
  }

  /**
   * すべてのキャッシュをクリア
   */
  clearAll(): void {
    this.store.clear();
    this.totalSize = 0;
  }

  /**
   * キャッシュ統計を取得
   */
  getStats(): CacheStats {
    let totalAccesses = 0;
    let oldestEntry = Date.now();

    for (const entry of this.store.values()) {
      totalAccesses += entry.accessCount;
      oldestEntry = Math.min(oldestEntry, entry.createdAt);
    }

    return {
      entries: this.store.size,
      totalSize: this.totalSize,
      maxEntries: this.config.maxEntries,
      maxMemory: this.config.maxMemory,
      utilizationPercent: (this.store.size / this.config.maxEntries) * 100,
      memoryUtilizationPercent: (this.totalSize / this.config.maxMemory) * 100,
      totalAccesses,
      oldestEntryAge: Date.now() - oldestEntry,
    };
  }

  /**
   * データサイズを推定
   */
  private estimateSize(data: FileAnalysis): number {
    // JSON文字列化してサイズを推定
    return JSON.stringify(data).length;
  }

  /**
   * 必要に応じてエビクション
   */
  private evictIfNeeded(newEntrySize: number): void {
    while (
      this.store.size >= this.config.maxEntries ||
      this.totalSize + newEntrySize > this.config.maxMemory
    ) {
      // 最初のエントリ（最も古い）を削除
      const firstKey = this.store.keys().next().value;
      if (!firstKey) break;

      const entry = this.store.get(firstKey);
      if (entry) {
        this.totalSize -= entry.size;
        this.store.delete(firstKey);
      }
    }
  }
}
```

---

## キャッシュの監視とデバッグ

### キャッシュ統計API

```typescript
interface CacheStats {
  entries: number;                      // 現在のエントリ数
  totalSize: number;                    // 現在の総サイズ
  maxEntries: number;                   // 最大エントリ数
  maxMemory: number;                    // 最大メモリ
  utilizationPercent: number;           // 使用率（エントリ）
  memoryUtilizationPercent: number;     // 使用率（メモリ）
  totalAccesses: number;                // 総アクセス数
  oldestEntryAge: number;               // 最古エントリの年齢（ms）
}
```

### デバッグログ

```typescript
// キャッシュヒット/ミスのログ
if (cached) {
  console.debug(`[Cache HIT] ${key} (access count: ${cached.accessCount})`);
} else {
  console.debug(`[Cache MISS] ${key}`);
}

// キャッシュエビクションのログ
console.debug(`[Cache EVICT] ${key} (size: ${entry.size} bytes, age: ${age}ms)`);

// キャッシュ統計の定期ログ
setInterval(() => {
  const stats = cacheManager.getStats();
  console.info(`[Cache Stats] Entries: ${stats.entries}/${stats.maxEntries}, ` +
               `Memory: ${formatBytes(stats.totalSize)}/${formatBytes(stats.maxMemory)}, ` +
               `Utilization: ${stats.utilizationPercent.toFixed(1)}%`);
}, 60000); // 1分ごと
```

---

## 増分解析の将来実装 (Phase 2)

### 概要

**目的**: ファイルの一部が変更された場合、全体を再解析せず変更部分のみを解析

**実装方針**:
1. ファイルのdiff を取得
2. 変更された関数/クラスを特定
3. 変更部分のみ再解析
4. 未変更部分はキャッシュから取得
5. 結果をマージ

### 設計

```typescript
interface IncrementalCache {
  // 関数/クラス単位でキャッシュ
  functions: Map<string, Function>;
  classes: Map<string, Class>;
  types: Map<string, TypeDefinition>;
}

async function analyzeFileIncremental(
  path: string,
  oldContent: string,
  newContent: string
): Promise<FileAnalysis> {
  // diffを計算
  const changes = computeDiff(oldContent, newContent);

  // 変更された範囲を特定
  const changedRanges = changes.map(c => ({ start: c.start, end: c.end }));

  // 古いキャッシュを取得
  const oldCache = getIncrementalCache(path);

  // 変更された関数/クラスを特定
  const changedSymbols = identifyChangedSymbols(oldCache, changedRanges);

  // 変更部分のみ再解析
  const newSymbols = await analyzeSymbols(changedSymbols, newContent);

  // 未変更部分とマージ
  return mergeAnalysisResults(oldCache, newSymbols);
}
```

---

## テスト戦略

### 単体テスト

```typescript
describe("CacheManager", () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager({
      maxEntries: 5,
      maxMemory: 1024 * 1024, // 1MB
      ttl: 0,
      useLRU: true,
    });
  });

  test("should store and retrieve data", () => {
    const data = createMockFileAnalysis();
    const meta = createMockFileMeta();
    const key = "test:key";

    cache.set(key, data, meta);
    const retrieved = cache.get(key);

    expect(retrieved).toEqual(data);
  });

  test("should evict oldest entry when maxEntries exceeded", () => {
    // 6つのエントリを追加（maxEntriesは5）
    for (let i = 0; i < 6; i++) {
      cache.set(`key${i}`, createMockFileAnalysis(), createMockFileMeta());
    }

    // 最初のエントリが削除されているはず
    expect(cache.get("key0")).toBeNull();
    expect(cache.get("key5")).not.toBeNull();
  });

  test("should update access count on get", () => {
    const key = "test:key";
    cache.set(key, createMockFileAnalysis(), createMockFileMeta());

    cache.get(key);
    cache.get(key);

    const stats = cache.getStats();
    expect(stats.totalAccesses).toBe(3); // set時に1, get時に2
  });
});
```

---

## まとめ

本キャッシュ設計により、以下が実現されます:

1. **高速なレスポンス**: キャッシュヒット時10ms以内
2. **効率的なメモリ管理**: LRU方式で自動削除
3. **自動無効化**: ファイル更新時に自動的にキャッシュ無効化
4. **3層キャッシュ**: 各層が最適化され、総合的なパフォーマンス向上

**次のステップ**:
- 実装とベンチマーク
- キャッシュ統計の監視
- 増分解析の実装 (Phase 2)

---

**作成日**: 2025-10-29
**対応要件**: REQ-111, REQ-112, NFR-005
**関連文書**: [architecture](./architecture.md), [dataflow](./dataflow.md)
