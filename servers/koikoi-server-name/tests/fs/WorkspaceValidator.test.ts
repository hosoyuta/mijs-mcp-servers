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

  test("存在しないファイルはfalse", async () => {
    const validator = new WorkspaceValidator();
    const exists = await validator.fileExists("./nonexistent-file.ts");
    expect(exists).toBe(false);
  });
});
