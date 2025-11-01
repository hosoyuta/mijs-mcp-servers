# Phase 1: 基盤レイヤー - File System + TypeScript Compiler API

## フェーズ概要

### 基本情報
- **フェーズ名**: Phase 1 - 基盤レイヤー (Foundation Layer)
- **期間**: 12-15営業日
- **推定工数**: 120-150時間
- **開始予定**: 2025-11-01
- **完了予定**: 2025-11-18
- **担当**: 開発チーム
- **優先度**: P0 (Critical) - MVP必須

### 目的
TypeScript Compiler APIとファイルシステムの抽象化層を構築し、後続フェーズの解析エンジンの基盤を確立する。Bun.file()を活用した高速ファイル操作と、TypeScript Compilerの効率的な管理を実現する。

### 成果物
- ✅ FileReader: Bun.file()を使用した高速ファイル読み込み
- ✅ PathResolver: パス解決とワークスペース境界チェック
- ✅ CompilerHost: TypeScript Compiler APIの初期化と管理
- ✅ ProgramManager: TypeScript Programインスタンスの再利用
- ✅ 基本的なエラーハンドリング機構
- ✅ 単体テスト (カバレッジ70%以上)

### 関連文書
- **アーキテクチャ**: [architecture.md](../design/code-analysis/architecture.md) - Section 6 (File System Layer), Section 5 (TS Compiler API Layer)
- **要件**: [requirements.md](../spec/code-analysis-requirements.md) - REQ-401〜REQ-405 (制約要件)
- **技術スタック**: [tech-stack.md](../tech-stack.md) - Bun, TypeScript Compiler API
- **タスク概要**: [code-analysis-overview.md](./code-analysis-overview.md)

---

## 週次計画

### Week 1 (Days 1-5): File System Layer
**目標**: ファイルシステム抽象化層の完成

- **Day 1**: プロジェクトセットアップと初期構造
- **Day 2**: FileReader実装 (Bun.file活用)
- **Day 3**: PathResolver実装 (ワークスペース境界チェック)
- **Day 4**: ワークスペース検証機能
- **Day 5**: File System層の単体テスト

**マイルストーン**: ファイルの読み込みと検証が正常動作

---

### Week 2 (Days 6-10): TypeScript Compiler API Layer
**目標**: TypeScript Compiler API統合の完成

- **Day 6**: CompilerHost実装 (ts.createProgram)
- **Day 7**: ProgramManager実装 (インスタンス再利用)
- **Day 8**: SourceFileキャッシング機構
- **Day 9**: Compiler API統合テスト
- **Day 10**: バッファ日 (課題解決、リファクタリング)

**マイルストーン**: TypeScript ASTの取得が高速動作

---

### Week 3 (Days 11-15): 統合とテスト
**目標**: Phase 1完成とMilestone 1達成

- **Days 11-12**: 統合テスト (File System + Compiler統合)
- **Days 13-14**: ドキュメント整備、コードレビュー
- **Day 15**: Milestone 1検証と次フェーズ準備

**マイルストーン**: Phase 1完全完成、単体テスト全通過

---

## 日次タスク詳細

### Week 1: File System Layer

---

#### Day 1: プロジェクトセットアップと初期構造

##### - [x] TASK-0101: プロジェクト初期化とディレクトリ構造作成
- **タスクタイプ**: DIRECT
- **推定工数**: 2時間
- **要件名**: code-analysis
- **依存タスク**: なし
- **要件リンク**: REQ-401, REQ-402, REQ-403
- **信頼性レベル**: 🔵 (tech-stack.md完全準拠)

**実装詳細**:
1. Bunプロジェクト初期化確認
   ```bash
   bun --version  # 1.3.1確認
   ```
2. ディレクトリ構造作成
   ```
   src/
   ├── fs/              # File System Layer
   │   ├── FileReader.ts
   │   ├── PathResolver.ts
   │   └── index.ts
   ├── compiler/        # TypeScript Compiler API Layer
   │   ├── CompilerHost.ts
   │   ├── ProgramManager.ts
   │   └── index.ts
   ├── types/           # 型定義
   │   ├── fs.ts
   │   ├── compiler.ts
   │   └── index.ts
   └── utils/           # ユーティリティ
       ├── errors.ts
       └── index.ts
   tests/
   ├── fs/
   ├── compiler/
   └── fixtures/        # テスト用サンプルファイル
   ```
3. package.json スクリプト設定
   ```json
   {
     "scripts": {
       "dev": "bun run src/index.ts",
       "build": "bun build src/index.ts --outdir ./dist --target node",
       "test": "bun test",
       "test:watch": "bun test --watch"
     }
   }
   ```
4. tsconfig.json 最適設定
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "target": "ES2022",
       "module": "ESNext",
       "moduleResolution": "bundler",
       "esModuleInterop": true,
       "skipLibCheck": true,
       "resolveJsonModule": true,
       "isolatedModules": true,
       "outDir": "./dist",
       "rootDir": "./src",
       "types": ["bun-types"]
     }
   }
   ```

**完了条件**:
- [x] ディレクトリ構造が作成済み
- [x] tsconfig.json が正しく設定
- [x] `bun run dev` が正常実行 (空実装でOK)
- [x] TypeScript strict モードでエラーなし

---

##### - [x] TASK-0102: 基本型定義の作成
- **タスクタイプ**: DIRECT
- **推定工数**: 2時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0101
- **要件リンク**: REQ-401, NFR-303
- **信頼性レベル**: 🔵 (architecture.md Section 6準拠)

**実装詳細**:
1. `src/types/fs.ts` - ファイルシステム型定義
   ```typescript
   /**
    * ファイルメタデータ
    */
   export interface FileMetadata {
     path: string;           // 絶対パス
     size: number;           // バイトサイズ
     mtime: Date;            // 最終更新日時
     lines: number;          // 行数
     encoding: string;       // エンコーディング
   }

   /**
    * ファイル読み込み結果
    */
   export interface FileReadResult {
     content: string;
     metadata: FileMetadata;
   }

   /**
    * ワークスペース情報
    */
   export interface WorkspaceInfo {
     rootPath: string;       // ワークスペースルート
     excludePatterns?: string[]; // 除外パターン
   }

   /**
    * パス解決結果
    */
   export interface ResolvedPath {
     absolutePath: string;
     relativePath: string;
     isWithinWorkspace: boolean;
   }
   ```

2. `src/types/compiler.ts` - Compiler型定義
   ```typescript
   import * as ts from "typescript";

   /**
    * Compiler設定
    */
   export interface CompilerConfig {
     compilerOptions: ts.CompilerOptions;
     rootPath: string;
   }

   /**
    * TypeScript Program情報
    */
   export interface ProgramInfo {
     program: ts.Program;
     typeChecker: ts.TypeChecker;
     sourceFiles: Map<string, ts.SourceFile>;
   }
   ```

3. `src/utils/errors.ts` - エラークラス定義
   ```typescript
   /**
    * ファイルシステムエラー
    */
   export class FileSystemError extends Error {
     constructor(
       message: string,
       public readonly path: string,
       public readonly code?: string
     ) {
       super(message);
       this.name = "FileSystemError";
     }
   }

   /**
    * ワークスペース境界エラー
    */
   export class WorkspaceBoundaryError extends FileSystemError {
     constructor(path: string, workspace: string) {
       super(
         `Path '${path}' is outside workspace '${workspace}'`,
         path,
         "WORKSPACE_BOUNDARY"
       );
       this.name = "WorkspaceBoundaryError";
     }
   }

   /**
    * Compilerエラー
    */
   export class CompilerError extends Error {
     constructor(
       message: string,
       public readonly diagnostics?: ts.Diagnostic[]
     ) {
       super(message);
       this.name = "CompilerError";
     }
   }
   ```

**完了条件**:
- [x] すべての型定義ファイルが作成済み
- [x] TypeScript strict モードでエラーなし
- [x] JSDocコメントが完備
- [x] index.ts でエクスポート整理

**テスト要件**:
- 型定義のコンパイル確認 (`tsc --noEmit`)

---

##### - [x] TASK-0103: テストフィクスチャの準備
- **タスクタイプ**: DIRECT
- **推定工数**: 1時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0101
- **要件リンク**: NFR-201, NFR-203
- **信頼性レベル**: 🔵 (テスト基盤準備)

**実装詳細**:
1. `tests/fixtures/` ディレクトリ作成
2. サンプルTypeScriptファイル作成
   - `sample-simple.ts`: シンプルな関数定義
   - `sample-class.ts`: クラス定義
   - `sample-types.ts`: interface, type, enum
   - `sample-error.ts`: 構文エラーファイル
   - `sample-large.ts`: 1000行以上のファイル
3. `tests/fixtures/workspace/` - ワークスペーステスト用
   - 階層構造のあるプロジェクト

**サンプルファイル例**:
```typescript
// tests/fixtures/sample-simple.ts
/**
 * ユーザーを取得する
 * @param id ユーザーID
 * @returns ユーザー情報
 */
export function getUser(id: string): User {
  return { id, name: "Test User" };
}

interface User {
  id: string;
  name: string;
}
```

**完了条件**:
- [x] 5種類以上のテストフィクスチャが準備済み
- [x] 正常系・異常系・境界値をカバー
- [x] ワークスペース境界テスト用ファイル配置

---

##### - [x] TASK-0104: Day 1振り返りと調整
- **タスクタイプ**: DIRECT
- **推定工数**: 1時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0101, TASK-0102, TASK-0103
- **信頼性レベル**: 🔵

**実装詳細**:
1. Day 1の成果物レビュー
2. 次の日のタスク準備確認
3. 技術的課題の洗い出し
4. ドキュメント更新

**完了条件**:
- [x] すべてのDay 1タスクが完了
- [x] TypeScript strict モードでエラーなし
- [x] ディレクトリ構造が確定
- [x] Day 2の準備完了

---

#### Day 2: FileReader実装

##### - [x] TASK-0105: FileReader基本実装 (TDD Red) ✅ **完了**
- **タスクタイプ**: TDD
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0102, TASK-0103
- **要件リンク**: REQ-001〜REQ-005 (ファイル読み込み基盤)
- **信頼性レベル**: 🔵 (architecture.md Section 6.1準拠)

**実装詳細** (Red → Green → Refactor):

**1. Red: テストケース作成** (`tests/fs/FileReader.test.ts`):
```typescript
import { describe, test, expect } from "bun:test";
import { FileReader } from "../../src/fs/FileReader";

describe("FileReader", () => {
  test("正常にファイルを読み込める", async () => {
    const reader = new FileReader();
    const result = await reader.readFile("./tests/fixtures/sample-simple.ts");

    expect(result.content).toBeDefined();
    expect(result.metadata.path).toContain("sample-simple.ts");
    expect(result.metadata.size).toBeGreaterThan(0);
    expect(result.metadata.lines).toBeGreaterThan(0);
  });

  test("存在しないファイルはエラー", async () => {
    const reader = new FileReader();
    await expect(reader.readFile("./nonexistent.ts")).rejects.toThrow();
  });

  test("ファイルメタデータが正確", async () => {
    const reader = new FileReader();
    const result = await reader.readFile("./tests/fixtures/sample-simple.ts");

    expect(result.metadata.mtime).toBeInstanceOf(Date);
    expect(result.metadata.encoding).toBe("utf-8");
    expect(result.metadata.lines).toBeGreaterThan(0);
  });

  test("大きなファイルも読み込める", async () => {
    const reader = new FileReader();
    const result = await reader.readFile("./tests/fixtures/sample-large.ts");

    expect(result.metadata.lines).toBeGreaterThan(1000);
  });
});
```

**完了条件**:
- [x] テストが作成され、すべて失敗 (Red)
- [x] テストケースが正常系・異常系をカバー

**テスト要件**:
- 正常系: ファイル読み込み成功
- 異常系: 存在しないファイル
- 境界値: 大きなファイル (1000行以上)
- メタデータ: サイズ、行数、mtime取得

---

##### - [x] TASK-0106: FileReader実装 (TDD Green) ✅ **完了**
- **タスクタイプ**: TDD
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0105
- **要件リンク**: REQ-001〜REQ-005
- **信頼性レベル**: 🔵 (Bun.file使用)

**実装詳細** (Green):

`src/fs/FileReader.ts`:
```typescript
import { stat } from "fs/promises";
import { FileReadResult, FileMetadata } from "../types/fs";
import { FileSystemError } from "../utils/errors";

/**
 * ファイル読み込みクラス
 * Bun.file() を使用した高速ファイル読み込み
 */
export class FileReader {
  /**
   * ファイルを読み込む
   * @param filePath ファイルパス
   * @returns ファイル内容とメタデータ
   */
  async readFile(filePath: string): Promise<FileReadResult> {
    try {
      // Bun.file() で高速読み込み
      const file = Bun.file(filePath);

      // 存在チェック
      if (!(await file.exists())) {
        throw new FileSystemError(
          `File not found: ${filePath}`,
          filePath,
          "ENOENT"
        );
      }

      // ファイル内容取得
      const content = await file.text();

      // メタデータ取得
      const metadata = await this.getMetadata(filePath, content);

      return { content, metadata };
    } catch (error) {
      if (error instanceof FileSystemError) {
        throw error;
      }
      throw new FileSystemError(
        `Failed to read file: ${error.message}`,
        filePath
      );
    }
  }

  /**
   * ファイルメタデータを取得
   */
  private async getMetadata(
    filePath: string,
    content: string
  ): Promise<FileMetadata> {
    const stats = await stat(filePath);
    const lines = this.countLines(content);

    return {
      path: filePath,
      size: stats.size,
      mtime: stats.mtime,
      lines,
      encoding: "utf-8", // Bunはデフォルトでutf-8
    };
  }

  /**
   * 行数をカウント
   */
  private countLines(content: string): number {
    if (content.length === 0) return 0;
    return content.split("\n").length;
  }
}
```

**完了条件**:
- [x] すべてのテストが通過 (Green)
- [x] Bun.file() を正しく使用
- [x] エラーハンドリングが適切
- [x] JSDocコメント完備

**テスト要件**:
- `bun test tests/fs/FileReader.test.ts` が全通過

---

##### - [x] TASK-0107: FileReader Refactor ✅ **完了** (TDD開発完了 - 4テストケース全通過)
- **タスクタイプ**: TDD
- **推定工数**: 2時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0106
- **要件リンク**: NFR-001 (性能要件)
- **信頼性レベル**: 🔵

**実装詳細** (Refactor):
1. ストリーム読み込み対応 (大きなファイル用) - 将来対応として残存
   ```typescript
   async readFileStream(filePath: string): Promise<ReadableStream> {
     const file = Bun.file(filePath);
     return file.stream();
   }
   ```
2. エンコーディング自動検出 (将来対応) - 将来対応として残存
3. パフォーマンス最適化 - ✅ 完了（Bun.file重複呼び出し削減）
4. コード整理、関数分割 - ✅ 完了（validatePath, countLines分離）

**完了条件**:
- [x] リファクタリング後もテスト全通過
- [x] コード品質向上 (重複削減、可読性向上)
- [x] 型安全性の強化

**実装結果**:
- セキュリティ強化: validatePath(), MAX_FILE_SIZE導入
- パフォーマンス最適化: API呼び出し最適化（2回→1回）
- コード品質: 定数抽出、ヘルパー関数分離
- テスト結果: 4 pass, 0 fail (100%)

---

#### Day 3: PathResolver実装

##### - [x] TASK-0108: PathResolver基本実装 (TDD Red) ✅ **完了**
- **タスクタイプ**: TDD
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0102, TASK-0103
- **要件リンク**: REQ-121, REQ-122 (ワークスペース制限)
- **信頼性レベル**: 🔵 (architecture.md Section 6.2準拠)

**実装詳細** (Red):

`tests/fs/PathResolver.test.ts`:
```typescript
import { describe, test, expect } from "bun:test";
import { PathResolver } from "../../src/fs/PathResolver";

describe("PathResolver", () => {
  const workspacePath = process.cwd() + "/tests/fixtures/workspace";

  test("相対パスを絶対パスに解決", () => {
    const resolver = new PathResolver(workspacePath);
    const resolved = resolver.resolve("./src/index.ts");

    expect(resolved.absolutePath).toContain("index.ts");
    expect(resolved.relativePath).toBe("src/index.ts");
  });

  test("ワークスペース内のパスを許可", () => {
    const resolver = new PathResolver(workspacePath);
    const resolved = resolver.resolve("./src/index.ts");

    expect(resolved.isWithinWorkspace).toBe(true);
  });

  test("ワークスペース外のパスを拒否", () => {
    const resolver = new PathResolver(workspacePath);

    expect(() => {
      resolver.resolve("../../outside.ts");
    }).toThrow("outside workspace");
  });

  test("絶対パスも正しく処理", () => {
    const resolver = new PathResolver(workspacePath);
    const absolutePath = workspacePath + "/src/index.ts";
    const resolved = resolver.resolve(absolutePath);

    expect(resolved.isWithinWorkspace).toBe(true);
  });
});
```

**完了条件**:
- [x] テストが作成され、すべて失敗 (Red)
- [x] ワークスペース境界チェックのテストカバー

**テスト要件**:
- 相対パス解決
- 絶対パス解決
- ワークスペース内チェック
- ワークスペース外エラー

---

##### - [x] TASK-0109: PathResolver実装 (TDD Green) ✅ **完了** (4テストケース全通過)
- **タスクタイプ**: TDD
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0108
- **要件リンク**: REQ-121, REQ-122
- **信頼性レベル**: 🔵

**実装詳細** (Green):

`src/fs/PathResolver.ts`:
```typescript
import { resolve, relative, normalize } from "path";
import { ResolvedPath } from "../types/fs";
import { WorkspaceBoundaryError } from "../utils/errors";

/**
 * パス解決とワークスペース境界チェック
 */
export class PathResolver {
  private readonly workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = normalize(resolve(workspaceRoot));
  }

  /**
   * パスを解決し、ワークスペース境界をチェック
   * @param filePath 解決するパス
   * @returns 解決されたパス情報
   * @throws WorkspaceBoundaryError ワークスペース外の場合
   */
  resolve(filePath: string): ResolvedPath {
    // 絶対パスに解決
    const absolutePath = normalize(resolve(this.workspaceRoot, filePath));

    // 相対パス計算
    const relativePath = relative(this.workspaceRoot, absolutePath);

    // ワークスペース境界チェック
    const isWithinWorkspace = this.isWithinWorkspace(absolutePath);

    if (!isWithinWorkspace) {
      throw new WorkspaceBoundaryError(absolutePath, this.workspaceRoot);
    }

    return {
      absolutePath,
      relativePath,
      isWithinWorkspace,
    };
  }

  /**
   * パスがワークスペース内かチェック
   */
  private isWithinWorkspace(absolutePath: string): boolean {
    const normalizedPath = normalize(absolutePath);
    const normalizedWorkspace = normalize(this.workspaceRoot);

    return normalizedPath.startsWith(normalizedWorkspace);
  }

  /**
   * ワークスペースルートパスを取得
   */
  getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }
}
```

**完了条件**:
- [x] すべてのテストが通過 (Green)
- [x] ワークスペース境界チェックが正確
- [x] Windows/Linux/Mac対応のパス処理

**テスト要件**:
- `bun test tests/fs/PathResolver.test.ts` が全通過

---

##### - [x] TASK-0110: PathResolver Refactor + パターンマッチング ✅ **完了** (15テストケース全通過、Glob機能追加)
- **タスクタイプ**: TDD
- **推定工数**: 2時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0109
- **要件リンク**: REQ-031〜REQ-033 (プロジェクト構造解析)
- **信頼性レベル**: 🟡 (将来のanalyze_project用)

**実装詳細** (Refactor + 拡張):
1. Glob パターンマッチング追加
   ```typescript
   import { glob } from "glob";

   /**
    * パターンに一致するファイルを取得
    */
   async matchFiles(patterns: string[]): Promise<string[]> {
     const files: string[] = [];
     for (const pattern of patterns) {
       const matched = await glob(pattern, { cwd: this.workspaceRoot });
       files.push(...matched);
     }
     return files;
   }
   ```
2. 除外パターン対応
3. コード整理

**完了条件**:
- [x] リファクタリング後もテスト全通過
- [x] パターンマッチング機能追加 (Phase 3で使用)

---

#### Day 4: ワークスペース検証機能

##### - [x] TASK-0111: WorkspaceValidator実装 (TDD Red→Green) ✅ **完了**
- **タスクタイプ**: TDD
- **推定工数**: 4時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0109
- **要件リンク**: REQ-121, REQ-122
- **信頼性レベル**: 🔵

**実装詳細**:

**Red: テストケース**:
```typescript
import { describe, test, expect } from "bun:test";
import { WorkspaceValidator } from "../../src/fs/WorkspaceValidator";

describe("WorkspaceValidator", () => {
  test("有効なワークスペースを検証", async () => {
    const validator = new WorkspaceValidator();
    const isValid = await validator.validateWorkspace("./tests/fixtures/workspace");
    expect(isValid).toBe(true);
  });

  test("存在しないワークスペースは無効", async () => {
    const validator = new WorkspaceValidator();
    const isValid = await validator.validateWorkspace("./nonexistent");
    expect(isValid).toBe(false);
  });

  test("ファイルの存在確認", async () => {
    const validator = new WorkspaceValidator();
    const exists = await validator.fileExists("./tests/fixtures/sample-simple.ts");
    expect(exists).toBe(true);
  });
});
```

**Green: 実装**:
```typescript
import { stat } from "fs/promises";

export class WorkspaceValidator {
  async validateWorkspace(path: string): Promise<boolean> {
    try {
      const stats = await stat(path);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch {
      return false;
    }
  }
}
```

**完了条件**:
- [x] テスト全通過
- [x] ワークスペース検証が正確

---

##### - [x] TASK-0112: File System層統合テスト ✅ **完了**
- **タスクタイプ**: TDD
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0107, TASK-0110, TASK-0111
- **要件リンク**: NFR-203 (統合テスト)
- **信頼性レベル**: 🔵

**実装詳細**:
`tests/fs/integration.test.ts`:
```typescript
import { describe, test, expect } from "bun:test";
import { FileReader } from "../../src/fs/FileReader";
import { PathResolver } from "../../src/fs/PathResolver";
import { WorkspaceValidator } from "../../src/fs/WorkspaceValidator";

describe("File System統合テスト", () => {
  test("FileReader + PathResolver統合", async () => {
    const workspace = process.cwd() + "/tests/fixtures/workspace";
    const resolver = new PathResolver(workspace);
    const reader = new FileReader();

    const resolved = resolver.resolve("./src/index.ts");
    const result = await reader.readFile(resolved.absolutePath);

    expect(result.content).toBeDefined();
    expect(result.metadata.lines).toBeGreaterThan(0);
  });

  test("ワークスペース外ファイルの拒否", async () => {
    const workspace = process.cwd() + "/tests/fixtures/workspace";
    const resolver = new PathResolver(workspace);

    expect(() => {
      resolver.resolve("../../../etc/passwd");
    }).toThrow("outside workspace");
  });

  test("大きなファイルの処理", async () => {
    const reader = new FileReader();
    const result = await reader.readFile("./tests/fixtures/sample-large.ts");

    expect(result.metadata.lines).toBeGreaterThan(1000);
    expect(result.content.length).toBeGreaterThan(10000);
  });
});
```

**完了条件**:
- [x] 統合テストが全通過
- [x] 正常系・異常系・境界値をカバー

**テスト要件**:
- FileReader + PathResolver統合
- エラーハンドリング確認
- パフォーマンス確認 (大きなファイル)

---

##### - [x] TASK-0113: Day 4振り返りとリファクタリング ✅ **完了**
- **タスクタイプ**: DIRECT
- **推定工数**: 1時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0112
- **信頼性レベル**: 🔵

**実装詳細**:
1. コードレビュー ✅
2. 重複コード削減 ✅
3. 型定義の整理 ✅
4. ドキュメント更新 ✅

**完了条件**:
- [x] File System層のコード品質向上
- [x] すべてのテストが通過維持

**実施内容**:
1. **コードレビュー結果**:
   - FileReader.ts: 過剰なコメントを整理、JSDocを標準形式に変更
   - PathResolver.ts: JSDocを完全に英語化、例を追加
   - WorkspaceValidator.ts: JSDoc追加、重複コード削減（pathExists導入）
   - エラークラス: JSDoc完備、使用例追加

2. **リファクタリング実施**:
   - FileReader.ts: コメントを70%削減、コードの可読性向上
   - WorkspaceValidator.ts: 重複コード削減（pathExists抽出）
   - 全ファイル: JSDocを統一フォーマットに変更

3. **型定義整理**:
   - deprecated型は保持（互換性のため）
   - すべての型が適切にエクスポート済み
   - TypeScript strict モード完全対応

4. **テスト結果**:
   - File System層: 30 pass, 0 fail (100%成功)
   - TypeScript型チェック: エラーなし
   - カバレッジ: 想定以上

5. **ドキュメント作成**:
   - `src/fs/README.md` 作成（包括的な使用方法とAPI仕様）
   - セキュリティ機能の文書化
   - パフォーマンス最適化の説明

---

#### Day 5: File System層の単体テスト完成

##### - [x] TASK-0114: エッジケーステスト追加 ✅ **完了** (36テストケース全通過)
- **タスクタイプ**: TDD
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0112
- **要件リンク**: EDGE-001, EDGE-101, EDGE-102
- **信頼性レベル**: 🔵

**実装詳細**:
`tests/fs/edge-cases.test.ts`:
```typescript
import { describe, test, expect } from "bun:test";
import { FileReader } from "../../src/fs/FileReader";

describe("エッジケーステスト", () => {
  test("空のファイル (0バイト)", async () => {
    const reader = new FileReader();
    const result = await reader.readFile("./tests/fixtures/empty.ts");

    expect(result.content).toBe("");
    expect(result.metadata.size).toBe(0);
    expect(result.metadata.lines).toBe(0);
  });

  test("非常に大きなファイル (10,000行)", async () => {
    const reader = new FileReader();
    const result = await reader.readFile("./tests/fixtures/huge.ts");

    expect(result.metadata.lines).toBeGreaterThan(10000);
    // メモリエラーが発生しないこと
  });

  test("特殊文字を含むファイルパス", async () => {
    const reader = new FileReader();
    const result = await reader.readFile("./tests/fixtures/special-char (1).ts");

    expect(result.content).toBeDefined();
  });

  test("シンボリックリンクの処理", async () => {
    // TODO: シンボリックリンクテスト
  });
});
```

**完了条件**:
- [x] エッジケーステスト全通過
- [x] 境界値テストカバー

**テスト要件**:
- 空ファイル
- 非常に大きなファイル
- 特殊文字パス
- シンボリックリンク

---

##### - [x] TASK-0115: パフォーマンステスト ✅ **完了** (11テストケース全通過、全NFR目標達成)
- **タスクタイプ**: TDD
- **推定工数**: 2時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0114
- **要件リンク**: NFR-001, NFR-002
- **信頼性レベル**: 🔵

**実装詳細**:
`tests/fs/performance.test.ts`:
```typescript
import { describe, test, expect } from "bun:test";
import { FileReader } from "../../src/fs/FileReader";

describe("パフォーマンステスト", () => {
  test("小規模ファイル読み込みが50ms以内", async () => {
    const reader = new FileReader();
    const start = Date.now();

    await reader.readFile("./tests/fixtures/sample-simple.ts");

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  test("10ファイル並行読み込み", async () => {
    const reader = new FileReader();
    const files = Array(10).fill("./tests/fixtures/sample-simple.ts");

    const start = Date.now();
    await Promise.all(files.map(f => reader.readFile(f)));
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(200); // 10ファイルで200ms以内
  });
});
```

**完了条件**:
- [x] パフォーマンステスト通過
- [x] NFR-001, NFR-002の目標達成

**テスト要件**:
- 小規模ファイル: 50ms以内
- 並行処理: 効率的

---

##### - [x] TASK-0116: Week 1総合テストとドキュメント ✅ **完了** (77テスト全通過、Week 1完全達成)
- **タスクタイプ**: DIRECT
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0115
- **信頼性レベル**: 🔵

**実装詳細**:
1. `bun test tests/fs/` で全テスト実行
2. カバレッジ確認 (`bun test --coverage`)
3. README.md 更新 (File System層の使い方)
4. JSDoc整備
5. Week 1レポート作成

**完了条件**:
- [x] File System層の単体テスト全通過
- [x] テストカバレッジ70%以上
- [x] ドキュメント完備
- [x] Week 2準備完了

---

### Week 2: TypeScript Compiler API Layer

---

#### Day 6: CompilerHost実装

##### - [x] TASK-0117: CompilerHost基本実装 (TDD Red) ✅ **完了**
- **タスクタイプ**: TDD
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0116
- **要件リンク**: REQ-404 (TypeScript Compiler API使用)
- **信頼性レベル**: 🔵 (architecture.md Section 5.1準拠)

**実装詳細** (Red):

`tests/compiler/CompilerHost.test.ts`:
```typescript
import { describe, test, expect } from "bun:test";
import { CompilerHost } from "../../src/compiler/CompilerHost";
import * as ts from "typescript";

describe("CompilerHost", () => {
  test("TypeScript Programを作成できる", () => {
    const host = new CompilerHost({
      rootPath: process.cwd() + "/tests/fixtures/workspace",
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        strict: true,
      },
    });

    const program = host.createProgram(["./tests/fixtures/sample-simple.ts"]);
    expect(program).toBeDefined();
  });

  test("SourceFileを取得できる", () => {
    const host = new CompilerHost({
      rootPath: process.cwd() + "/tests/fixtures/workspace",
      compilerOptions: {},
    });

    const program = host.createProgram(["./tests/fixtures/sample-simple.ts"]);
    const sourceFile = program.getSourceFile("./tests/fixtures/sample-simple.ts");

    expect(sourceFile).toBeDefined();
  });

  test("TypeCheckerを取得できる", () => {
    const host = new CompilerHost({
      rootPath: process.cwd() + "/tests/fixtures/workspace",
      compilerOptions: {},
    });

    const program = host.createProgram(["./tests/fixtures/sample-simple.ts"]);
    const typeChecker = program.getTypeChecker();

    expect(typeChecker).toBeDefined();
  });
});
```

**完了条件**:
- [x] テストが作成され、すべて失敗 (Red)

**テスト要件**:
- ts.createProgram() 実行
- SourceFile取得
- TypeChecker取得

---

##### - [x] TASK-0118: CompilerHost実装 (TDD Green) ✅ **完了**
- **タスクタイプ**: TDD
- **推定工数**: 4時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0117
- **要件リンク**: REQ-404
- **信頼性レベル**: 🔵

**実装詳細** (Green):

`src/compiler/CompilerHost.ts`:
```typescript
import * as ts from "typescript";
import { CompilerConfig, ProgramInfo } from "../types/compiler";
import { CompilerError } from "../utils/errors";

/**
 * TypeScript Compiler Host
 * TypeScript Programの作成と管理
 */
export class CompilerHost {
  private readonly config: CompilerConfig;
  private readonly defaultCompilerOptions: ts.CompilerOptions;

  constructor(config: CompilerConfig) {
    this.config = config;
    this.defaultCompilerOptions = this.getDefaultCompilerOptions();
  }

  /**
   * TypeScript Programを作成
   * @param fileNames 解析するファイル一覧
   * @returns Program
   */
  createProgram(fileNames: string[]): ts.Program {
    try {
      const compilerOptions = {
        ...this.defaultCompilerOptions,
        ...this.config.compilerOptions,
      };

      const program = ts.createProgram({
        rootNames: fileNames,
        options: compilerOptions,
      });

      return program;
    } catch (error) {
      throw new CompilerError(
        `Failed to create TypeScript Program: ${error.message}`
      );
    }
  }

  /**
   * デフォルトのCompilerOptionsを取得
   */
  private getDefaultCompilerOptions(): ts.CompilerOptions {
    return {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true, // パフォーマンス最適化
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      jsx: ts.JsxEmit.React, // TSX対応
      allowJs: true, // JavaScript対応
      noEmit: true, // 出力不要
    };
  }

  /**
   * Compiler diagnosticsを取得
   */
  getDiagnostics(program: ts.Program): ts.Diagnostic[] {
    const diagnostics = [
      ...program.getSyntacticDiagnostics(),
      ...program.getSemanticDiagnostics(),
    ];
    return diagnostics;
  }
}
```

**完了条件**:
- [x] すべてのテストが通過 (Green)
- [x] ts.createProgram() が正常動作
- [x] エラーハンドリング適切

**テスト要件**:
- `bun test tests/compiler/CompilerHost.test.ts` 全通過

---

##### - [x] TASK-0119: CompilerHost Refactor + Diagnostics ✅ **完了**
- **タスクタイプ**: TDD
- **推定工数**: 1時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0118
- **要件リンク**: REQ-101 (部分的成功)
- **信頼性レベル**: 🔵

**実装詳細** (Refactor):
1. Diagnostics取得機能強化
2. 構文エラー時の処理
3. コード整理

**完了条件**:
- [x] Diagnostics機能追加
- [x] リファクタリング後もテスト通過

---

#### Day 7: ProgramManager実装

##### - [x] TASK-0120: ProgramManager基本実装 (TDD Red→Green) ✅ **完了**
- **タスクタイプ**: TDD
- **推定工数**: 5時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0118
- **要件リンク**: REQ-111 (キャッシュ)
- **信頼性レベル**: 🔵 (architecture.md Section 5.2準拠)

**実装詳細**:

**Red: テストケース**:
```typescript
import { describe, test, expect } from "bun:test";
import { ProgramManager } from "../../src/compiler/ProgramManager";

describe("ProgramManager", () => {
  test("Programインスタンスを再利用", () => {
    const manager = new ProgramManager({
      rootPath: process.cwd(),
      compilerOptions: {},
    });

    const program1 = manager.getProgram(["./tests/fixtures/sample-simple.ts"]);
    const program2 = manager.getProgram(["./tests/fixtures/sample-simple.ts"]);

    // 同じインスタンスが返される
    expect(program1).toBe(program2);
  });

  test("ファイルリストが異なれば新しいProgramを作成", () => {
    const manager = new ProgramManager({
      rootPath: process.cwd(),
      compilerOptions: {},
    });

    const program1 = manager.getProgram(["./tests/fixtures/sample-simple.ts"]);
    const program2 = manager.getProgram(["./tests/fixtures/sample-class.ts"]);

    expect(program1).not.toBe(program2);
  });

  test("TypeCheckerを取得", () => {
    const manager = new ProgramManager({
      rootPath: process.cwd(),
      compilerOptions: {},
    });

    const typeChecker = manager.getTypeChecker(["./tests/fixtures/sample-simple.ts"]);
    expect(typeChecker).toBeDefined();
  });
});
```

**Green: 実装**:
```typescript
import * as ts from "typescript";
import { CompilerHost } from "./CompilerHost";
import { CompilerConfig } from "../types/compiler";

/**
 * TypeScript Program Manager
 * Programインスタンスの再利用とキャッシュ管理
 */
export class ProgramManager {
  private readonly compilerHost: CompilerHost;
  private programCache: Map<string, ts.Program>;

  constructor(config: CompilerConfig) {
    this.compilerHost = new CompilerHost(config);
    this.programCache = new Map();
  }

  /**
   * Programを取得 (キャッシュから再利用)
   */
  getProgram(fileNames: string[]): ts.Program {
    const cacheKey = this.getCacheKey(fileNames);

    if (this.programCache.has(cacheKey)) {
      return this.programCache.get(cacheKey)!;
    }

    const program = this.compilerHost.createProgram(fileNames);
    this.programCache.set(cacheKey, program);

    return program;
  }

  /**
   * TypeCheckerを取得
   */
  getTypeChecker(fileNames: string[]): ts.TypeChecker {
    const program = this.getProgram(fileNames);
    return program.getTypeChecker();
  }

  /**
   * SourceFileを取得
   */
  getSourceFile(fileName: string): ts.SourceFile | undefined {
    const program = this.getProgram([fileName]);
    return program.getSourceFile(fileName);
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.programCache.clear();
  }

  /**
   * キャッシュキーを生成
   */
  private getCacheKey(fileNames: string[]): string {
    return fileNames.sort().join("|");
  }
}
```

**完了条件**:
- [x] テスト全通過
- [x] Programインスタンスが再利用される
- [x] キャッシュが正常動作

**テスト要件**:
- Program再利用確認
- TypeChecker取得
- SourceFile取得

---

##### - [x] TASK-0121: ProgramManager Refactor + mtime対応 ✅ **完了**
- **タスクタイプ**: TDD
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0120
- **要件リンク**: REQ-111, REQ-202
- **信頼性レベル**: 🔵

**実装詳細** (Refactor + 拡張):
1. mtimeベースのキャッシュ無効化
   ```typescript
   private async getCacheKey(fileNames: string[]): Promise<string> {
     const mtimes = await Promise.all(
       fileNames.map(async (f) => {
         const stats = await stat(f);
         return stats.mtime.getTime();
       })
     );
     return fileNames.sort().join("|") + ":" + mtimes.join("|");
   }
   ```
2. LRUキャッシュ (サイズ制限)
3. メモリ使用量監視

**完了条件**:
- [x] LRUキャッシュ実装 (サイズ制限100エントリ)
- [x] リファクタリング後もテスト通過

---

#### Day 8: SourceFileキャッシング機構

##### - [ ] TASK-0122: SourceFileCache実装 (TDD Red→Green)
- **タスクタイプ**: TDD
- **推定工数**: 5時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0121
- **要件リンク**: NFR-005 (キャッシュヒット10ms以内)
- **信頼性レベル**: 🔵 (architecture.md Section 3.2準拠)

**実装詳細**:

**Red: テストケース**:
```typescript
import { describe, test, expect } from "bun:test";
import { SourceFileCache } from "../../src/compiler/SourceFileCache";

describe("SourceFileCache", () => {
  test("SourceFileをキャッシュ", async () => {
    const cache = new SourceFileCache();
    const filePath = "./tests/fixtures/sample-simple.ts";

    const sourceFile1 = await cache.get(filePath);
    const sourceFile2 = await cache.get(filePath);

    // 同じインスタンスが返される
    expect(sourceFile1).toBe(sourceFile2);
  });

  test("キャッシュヒットが10ms以内", async () => {
    const cache = new SourceFileCache();
    const filePath = "./tests/fixtures/sample-simple.ts";

    // 初回読み込み (キャッシュミス)
    await cache.get(filePath);

    // 2回目 (キャッシュヒット)
    const start = Date.now();
    await cache.get(filePath);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(10);
  });

  test("ファイル更新時にキャッシュ無効化", async () => {
    const cache = new SourceFileCache();
    const filePath = "./tests/fixtures/mutable.ts";

    const sourceFile1 = await cache.get(filePath);

    // ファイル更新をシミュレート
    await cache.invalidate(filePath);

    const sourceFile2 = await cache.get(filePath);
    expect(sourceFile1).not.toBe(sourceFile2);
  });
});
```

**Green: 実装**:
```typescript
import * as ts from "typescript";
import { stat } from "fs/promises";

interface CacheEntry {
  sourceFile: ts.SourceFile;
  mtime: number;
}

/**
 * SourceFileキャッシュ
 * mtimeベースのキャッシュ無効化
 */
export class SourceFileCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;

  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * SourceFileを取得 (キャッシュから)
   */
  async get(filePath: string): Promise<ts.SourceFile> {
    const stats = await stat(filePath);
    const mtime = stats.mtime.getTime();

    const cached = this.cache.get(filePath);

    // キャッシュヒット & mtime一致
    if (cached && cached.mtime === mtime) {
      return cached.sourceFile;
    }

    // キャッシュミス → 新規作成
    const sourceFile = ts.createSourceFile(
      filePath,
      await Bun.file(filePath).text(),
      ts.ScriptTarget.Latest,
      true
    );

    this.set(filePath, sourceFile, mtime);
    return sourceFile;
  }

  /**
   * キャッシュに保存
   */
  private set(filePath: string, sourceFile: ts.SourceFile, mtime: number): void {
    // LRU: サイズ超過時は古いエントリを削除
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(filePath, { sourceFile, mtime });
  }

  /**
   * キャッシュを無効化
   */
  async invalidate(filePath: string): Promise<void> {
    this.cache.delete(filePath);
  }

  /**
   * 全キャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
  }
}
```

**完了条件**:
- [ ] テスト全通過
- [ ] キャッシュヒット時10ms以内
- [ ] mtime更新時にキャッシュ無効化

**テスト要件**:
- キャッシュヒット性能
- mtime検証
- LRUキャッシュ動作

---

##### - [ ] TASK-0123: Day 8振り返りとパフォーマンステスト
- **タスクタイプ**: DIRECT
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0122
- **信頼性レベル**: 🔵

**実装詳細**:
1. Compiler層のパフォーマンステスト
2. メモリ使用量測定
3. コードレビュー
4. ドキュメント更新

**完了条件**:
- [ ] NFR-005 (キャッシュヒット10ms以内) 達成
- [ ] パフォーマンステスト通過

---

#### Day 9: Compiler API統合テスト

##### - [ ] TASK-0124: Compiler層統合テスト
- **タスクタイプ**: TDD
- **推定工数**: 5時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0122
- **要件リンク**: NFR-203 (統合テスト)
- **信頼性レベル**: 🔵

**実装詳細**:
`tests/compiler/integration.test.ts`:
```typescript
import { describe, test, expect } from "bun:test";
import { ProgramManager } from "../../src/compiler/ProgramManager";
import { SourceFileCache } from "../../src/compiler/SourceFileCache";

describe("Compiler統合テスト", () => {
  test("ProgramManager + SourceFileCache統合", async () => {
    const manager = new ProgramManager({
      rootPath: process.cwd(),
      compilerOptions: {},
    });
    const cache = new SourceFileCache();

    const filePath = "./tests/fixtures/sample-simple.ts";

    // 初回: キャッシュミス
    const sourceFile1 = await cache.get(filePath);

    // 2回目: キャッシュヒット
    const start = Date.now();
    const sourceFile2 = await cache.get(filePath);
    const elapsed = Date.now() - start;

    expect(sourceFile1).toBe(sourceFile2);
    expect(elapsed).toBeLessThan(10);
  });

  test("TypeCheckerでシンボル解決", () => {
    const manager = new ProgramManager({
      rootPath: process.cwd(),
      compilerOptions: {},
    });

    const typeChecker = manager.getTypeChecker(["./tests/fixtures/sample-simple.ts"]);
    expect(typeChecker).toBeDefined();

    // シンボル解決テスト (Phase 2で詳細実装)
  });

  test("複数ファイルのProgram作成", () => {
    const manager = new ProgramManager({
      rootPath: process.cwd(),
      compilerOptions: {},
    });

    const files = [
      "./tests/fixtures/sample-simple.ts",
      "./tests/fixtures/sample-class.ts",
      "./tests/fixtures/sample-types.ts",
    ];

    const program = manager.getProgram(files);
    const sourceFiles = program.getSourceFiles();

    expect(sourceFiles.length).toBeGreaterThanOrEqual(files.length);
  });
});
```

**完了条件**:
- [ ] 統合テスト全通過
- [ ] CompilerHost + ProgramManager + SourceFileCache統合確認

**テスト要件**:
- キャッシュ統合
- TypeChecker動作確認
- 複数ファイル処理

---

##### - [ ] TASK-0125: エラーハンドリングテスト
- **タスクタイプ**: TDD
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0124
- **要件リンク**: REQ-101, REQ-102 (部分的成功)
- **信頼性レベル**: 🔵

**実装詳細**:
`tests/compiler/error-handling.test.ts`:
```typescript
import { describe, test, expect } from "bun:test";
import { ProgramManager } from "../../src/compiler/ProgramManager";

describe("Compilerエラーハンドリング", () => {
  test("構文エラーファイルでもProgramを作成", () => {
    const manager = new ProgramManager({
      rootPath: process.cwd(),
      compilerOptions: {},
    });

    // 構文エラーのあるファイル
    const program = manager.getProgram(["./tests/fixtures/sample-error.ts"]);

    expect(program).toBeDefined();

    // Diagnosticsを取得
    const diagnostics = program.getSyntacticDiagnostics();
    expect(diagnostics.length).toBeGreaterThan(0);
  });

  test("存在しないファイルのエラー", () => {
    const manager = new ProgramManager({
      rootPath: process.cwd(),
      compilerOptions: {},
    });

    expect(() => {
      manager.getProgram(["./nonexistent.ts"]);
    }).toThrow();
  });
});
```

**完了条件**:
- [ ] エラーハンドリングテスト通過
- [ ] 構文エラー時も部分的にProgram取得可能

**テスト要件**:
- 構文エラーファイル
- 存在しないファイル
- Diagnostics取得

---

#### Day 10: バッファ日 (課題解決、リファクタリング)

##### - [ ] TASK-0126: Week 2総合テストとリファクタリング
- **タスクタイプ**: DIRECT
- **推定工数**: 6時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0125
- **信頼性レベル**: 🔵

**実装詳細**:
1. `bun test tests/compiler/` で全テスト実行
2. カバレッジ確認
3. コードレビュー、重複削減
4. パフォーマンス最適化
5. ドキュメント更新
6. Week 2レポート作成

**完了条件**:
- [ ] Compiler層の単体テスト全通過
- [ ] テストカバレッジ70%以上
- [ ] TypeScript strict モードでエラーなし
- [ ] Week 3準備完了

---

##### - [ ] TASK-0127: 技術的課題の解決
- **タスクタイプ**: DIRECT
- **推定工数**: 2時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0126
- **信頼性レベル**: 🟡 (課題次第)

**実装詳細**:
1. Week 2で発見された技術的課題の対応
2. パフォーマンスボトルネックの解消
3. メモリリーク調査
4. 次週計画の調整

**完了条件**:
- [ ] 主要な課題が解決
- [ ] Week 3実施可能

---

### Week 3: 統合とテスト

---

#### Days 11-12: 統合テスト

##### - [ ] TASK-0128: Phase 1完全統合テスト
- **タスクタイプ**: TDD
- **推定工数**: 8時間 (2日間)
- **要件名**: code-analysis
- **依存タスク**: TASK-0126
- **要件リンク**: NFR-203 (統合テスト)
- **信頼性レベル**: 🔵

**実装詳細**:
`tests/integration/phase1.test.ts`:
```typescript
import { describe, test, expect } from "bun:test";
import { FileReader } from "../../src/fs/FileReader";
import { PathResolver } from "../../src/fs/PathResolver";
import { ProgramManager } from "../../src/compiler/ProgramManager";
import { SourceFileCache } from "../../src/compiler/SourceFileCache";

describe("Phase 1完全統合テスト", () => {
  test("File System + Compiler完全統合", async () => {
    const workspace = process.cwd() + "/tests/fixtures/workspace";

    // 1. PathResolverでパス解決
    const resolver = new PathResolver(workspace);
    const resolved = resolver.resolve("./src/index.ts");

    // 2. FileReaderでファイル読み込み
    const reader = new FileReader();
    const fileResult = await reader.readFile(resolved.absolutePath);

    // 3. ProgramManagerでTypeScript Program作成
    const manager = new ProgramManager({
      rootPath: workspace,
      compilerOptions: {},
    });
    const program = manager.getProgram([resolved.absolutePath]);

    // 4. SourceFile取得
    const sourceFile = program.getSourceFile(resolved.absolutePath);

    expect(sourceFile).toBeDefined();
    expect(fileResult.content.length).toBeGreaterThan(0);
  });

  test("パフォーマンス: 小規模ファイル50ms以内", async () => {
    const workspace = process.cwd() + "/tests/fixtures/workspace";
    const resolver = new PathResolver(workspace);
    const reader = new FileReader();
    const manager = new ProgramManager({
      rootPath: workspace,
      compilerOptions: {},
    });

    const start = Date.now();

    const resolved = resolver.resolve("./src/index.ts");
    await reader.readFile(resolved.absolutePath);
    manager.getProgram([resolved.absolutePath]);

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  test("エラー時の部分的成功", async () => {
    const workspace = process.cwd() + "/tests/fixtures/workspace";
    const manager = new ProgramManager({
      rootPath: workspace,
      compilerOptions: {},
    });

    // 構文エラーファイル
    const program = manager.getProgram(["./tests/fixtures/sample-error.ts"]);
    const diagnostics = program.getSyntacticDiagnostics();

    // エラーがあってもProgramは作成される
    expect(program).toBeDefined();
    expect(diagnostics.length).toBeGreaterThan(0);
  });
});
```

**完了条件**:
- [ ] Phase 1完全統合テスト通過
- [ ] NFR-002 (50ms以内) 達成
- [ ] エラーハンドリング確認

**テスト要件**:
- File System + Compiler統合
- パフォーマンス目標達成
- エラー時の挙動確認

---

##### - [ ] TASK-0129: エンドツーエンドシナリオテスト
- **タスクタイプ**: TDD
- **推定工数**: 4時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0128
- **要件リンク**: NFR-203
- **信頼性レベル**: 🔵

**実装詳細**:
実際のTypeScriptプロジェクトを解析するシナリオテスト
- 小規模プロジェクト (5ファイル)
- 中規模プロジェクト (50ファイル)
- 依存関係のあるファイル群

**完了条件**:
- [ ] 実際のプロジェクトで動作確認
- [ ] E2Eシナリオテスト通過

---

#### Days 13-14: ドキュメント整備

##### - [ ] TASK-0130: API仕様ドキュメント作成
- **タスクタイプ**: DIRECT
- **推定工数**: 6時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0128
- **信頼性レベル**: 🔵

**実装詳細**:
1. `docs/api/phase1-api.md` 作成
   - FileReader API
   - PathResolver API
   - CompilerHost API
   - ProgramManager API
   - SourceFileCache API
2. 使用例追加
3. 型定義ドキュメント

**完了条件**:
- [ ] API仕様書完成
- [ ] 使用例が明確
- [ ] 型定義が文書化

---

##### - [ ] TASK-0131: コードドキュメント整備
- **タスクタイプ**: DIRECT
- **推定工数**: 4時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0130
- **信頼性レベル**: 🔵

**実装詳細**:
1. 全ファイルのJSDoc整備
2. README.md更新 (Phase 1使い方)
3. アーキテクチャ図の更新
4. トラブルシューティングガイド

**完了条件**:
- [ ] JSDocが全関数に記述
- [ ] README.mdが最新
- [ ] ドキュメント完備

---

##### - [ ] TASK-0132: テストドキュメント作成
- **タスクタイプ**: DIRECT
- **推定工数**: 2時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0131
- **信頼性レベル**: 🔵

**実装詳細**:
1. テスト仕様書作成
2. テストカバレッジレポート
3. テスト実行手順書

**完了条件**:
- [ ] テストドキュメント完成
- [ ] カバレッジ70%以上達成

---

#### Day 15: Milestone 1検証

##### - [ ] TASK-0133: Milestone 1完全検証
- **タスクタイプ**: DIRECT
- **推定工数**: 6時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0132
- **信頼性レベル**: 🔵

**実装詳細**:
1. Milestone 1達成条件チェック
   - [ ] TypeScript Compiler APIが正常動作
   - [ ] ファイル読み込みが機能
   - [ ] 基本的なAST解析が可能
   - [ ] 単体テストが全て通過
2. 検証コマンド実行
   ```bash
   bun test tests/compiler/
   bun test tests/fs/
   bun test tests/integration/
   bun test --coverage
   ```
3. パフォーマンス検証
4. メモリ使用量測定

**完了条件**:
- [ ] Milestone 1完全達成
- [ ] 全テスト通過
- [ ] NFR達成確認
- [ ] Phase 2準備完了

---

##### - [ ] TASK-0134: Phase 1レポート作成と次フェーズ準備
- **タスクタイプ**: DIRECT
- **推定工数**: 2時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0133
- **信頼性レベル**: 🔵

**実装詳細**:
1. Phase 1完了レポート作成
   - 達成項目
   - 技術的課題
   - パフォーマンス結果
   - 学び・改善点
2. Phase 2タスクファイル確認
3. Phase 2キックオフ準備

**完了条件**:
- [ ] Phase 1完了レポート完成
- [ ] Phase 2準備完了
- [ ] タスク管理ファイル更新

---

## Phase 1完了チェックリスト

### 成果物チェック
- [ ] FileReader実装完了 (Bun.file活用)
- [ ] PathResolver実装完了 (ワークスペース境界チェック)
- [ ] WorkspaceValidator実装完了
- [ ] CompilerHost実装完了 (ts.createProgram)
- [ ] ProgramManager実装完了 (インスタンス再利用)
- [ ] SourceFileCache実装完了 (mtimeベース)
- [ ] 基本的なエラーハンドリング機構

### テストチェック
- [ ] File System層単体テスト全通過
- [ ] Compiler層単体テスト全通過
- [ ] 統合テスト全通過
- [ ] E2Eシナリオテスト通過
- [ ] パフォーマンステスト通過
- [ ] エラーハンドリングテスト通過
- [ ] テストカバレッジ70%以上

### 非機能要件チェック
- [ ] NFR-001: 起動時間1秒以内
- [ ] NFR-002: 小規模ファイル解析50ms以内
- [ ] NFR-005: キャッシュヒット10ms以内
- [ ] NFR-201: 単体テスト実装済み
- [ ] NFR-303: TypeScript strict モード

### ドキュメントチェック
- [ ] API仕様書完成
- [ ] README.md更新
- [ ] JSDoc完備
- [ ] テストドキュメント完成
- [ ] Phase 1完了レポート

---

## リスク管理

### 高リスク課題

#### TypeScript Compiler API起動時間
**リスク**: `ts.createProgram()` の初期化が遅い
**対策**:
- ProgramManager によるインスタンス再利用 ✅
- `skipLibCheck: true` で型定義スキップ ✅
- 必要最小限の compilerOptions ✅
**状態**: 対策実装済み

#### 大きなファイルのメモリ消費
**リスク**: 10,000行以上のファイルでメモリエラー
**対策**:
- ストリーム読み込み対応 (TASK-0107)
- LRUキャッシュでメモリ制限
**状態**: 対策予定

### 中リスク課題

#### キャッシュ整合性
**リスク**: ファイル更新時にキャッシュが古くなる
**対策**:
- mtimeベースのキャッシュ無効化 (TASK-0121, TASK-0122) ✅
**状態**: 対策実装済み

---

## パフォーマンス目標

| 指標 | 目標値 | 検証方法 | 状態 |
|-----|-------|---------|------|
| 起動時間 | 1秒以内 | `time bun run src/index.ts` | ⬜ |
| 小規模ファイル (100行) | 50ms以内 | TASK-0115 パフォーマンステスト | ⬜ |
| キャッシュヒット | 10ms以内 | TASK-0122 SourceFileCache | ⬜ |
| 10ファイル並行読み込み | 200ms以内 | TASK-0115 並行処理テスト | ⬜ |

---

## 依存関係マトリックス

### タスク依存関係
```
TASK-0101 → TASK-0102 → TASK-0103
                ↓
TASK-0105 (Red) → TASK-0106 (Green) → TASK-0107 (Refactor)
                ↓
TASK-0108 (Red) → TASK-0109 (Green) → TASK-0110 (Refactor)
                ↓
TASK-0111 → TASK-0112 (FS統合テスト)
                ↓
TASK-0114 → TASK-0115 → TASK-0116 (Week 1完了)
                ↓
TASK-0117 (Red) → TASK-0118 (Green) → TASK-0119 (Refactor)
                ↓
TASK-0120 (Red→Green) → TASK-0121 (Refactor)
                ↓
TASK-0122 (SourceFileCache) → TASK-0123
                ↓
TASK-0124 (Compiler統合) → TASK-0125 (エラーハンドリング)
                ↓
TASK-0126 (Week 2完了) → TASK-0127
                ↓
TASK-0128 (Phase 1統合) → TASK-0129 (E2E)
                ↓
TASK-0130 (APIドキュメント) → TASK-0131 → TASK-0132
                ↓
TASK-0133 (Milestone 1検証) → TASK-0134 (Phase 1完了)
```

---

## 更新履歴

- **2025-11-01**: Phase 1タスクファイル作成
  - 総タスク数: 34タスク (TASK-0101 〜 TASK-0134)
  - 推定工数: 120-150時間
  - 期間: 15営業日
  - Week 1: File System Layer (5日)
  - Week 2: TypeScript Compiler API Layer (5日)
  - Week 3: 統合とテスト (5日)

---

**次のステップ**: TASK-0101 (プロジェクト初期化) から開始

**関連文書**:
- アーキテクチャ: [architecture.md](../design/code-analysis/architecture.md)
- 要件: [requirements.md](../spec/code-analysis-requirements.md)
- 技術スタック: [tech-stack.md](../tech-stack.md)
- タスク概要: [code-analysis-overview.md](./code-analysis-overview.md)
