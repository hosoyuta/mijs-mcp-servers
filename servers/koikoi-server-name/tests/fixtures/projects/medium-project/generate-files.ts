/**
 * Script to generate medium-scale TypeScript project files
 * This will create approximately 50 files for testing
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const baseDir = process.cwd();

// Create directories
const dirs = [
  "src/models",
  "src/services",
  "src/controllers",
  "src/middleware",
  "src/config",
  "src/utils",
  "src/validators",
  "types",
  "components/ui",
  "components/forms",
  "components/layouts",
];

console.log("Creating directories...");
dirs.forEach((dir) => {
  try {
    mkdirSync(join(baseDir, dir), { recursive: true });
  } catch (e) {
    // Directory may already exist
  }
});

// Generate type files (10 files)
console.log("Generating type files...");
for (let i = 1; i <= 10; i++) {
  const content = `/**
 * Type definitions - Module ${i}
 */

export interface Entity${i} {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export type Status${i} = "active" | "inactive" | "pending";

export interface Config${i} {
  enabled: boolean;
  value: number;
}
`;
  writeFileSync(join(baseDir, `types/module${i}.ts`), content);
}

// Generate model files (10 files)
console.log("Generating model files...");
for (let i = 1; i <= 10; i++) {
  const content = `/**
 * Model - Entity ${i}
 */

import { Entity${i}, Status${i} } from "../../types/module${i}";

export class Model${i} {
  private data: Map<string, Entity${i}> = new Map();

  create(entity: Omit<Entity${i}, "id">): Entity${i} {
    const id = \`entity${i}_\${Date.now()}\`;
    const newEntity: Entity${i} = {
      ...entity,
      id,
    };
    this.data.set(id, newEntity);
    return newEntity;
  }

  findById(id: string): Entity${i} | undefined {
    return this.data.get(id);
  }

  findAll(): Entity${i}[] {
    return Array.from(this.data.values());
  }

  update(id: string, updates: Partial<Entity${i}>): Entity${i} | undefined {
    const entity = this.data.get(id);
    if (!entity) return undefined;

    const updated = { ...entity, ...updates, updatedAt: new Date() };
    this.data.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.data.delete(id);
  }
}
`;
  writeFileSync(join(baseDir, `src/models/Model${i}.ts`), content);
}

// Generate service files (10 files)
console.log("Generating service files...");
for (let i = 1; i <= 10; i++) {
  const content = `/**
 * Service - Business Logic ${i}
 */

import { Model${i} } from "../models/Model${i}";
import { Entity${i}, Status${i} } from "../../types/module${i}";

export class Service${i} {
  private model: Model${i};

  constructor() {
    this.model = new Model${i}();
  }

  async create(data: Omit<Entity${i}, "id">): Promise<Entity${i}> {
    return this.model.create(data);
  }

  async getById(id: string): Promise<Entity${i} | undefined> {
    return this.model.findById(id);
  }

  async getAll(): Promise<Entity${i}[]> {
    return this.model.findAll();
  }

  async update(
    id: string,
    updates: Partial<Entity${i}>
  ): Promise<Entity${i} | undefined> {
    return this.model.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return this.model.delete(id);
  }

  async count(): Promise<number> {
    return this.model.findAll().length;
  }
}
`;
  writeFileSync(join(baseDir, `src/services/Service${i}.ts`), content);
}

// Generate UI components (10 files)
console.log("Generating component files...");
for (let i = 1; i <= 10; i++) {
  const content = `/**
 * UI Component ${i}
 */

import { Entity${i} } from "../../types/module${i}";

export interface Component${i}Props {
  data: Entity${i}[];
  onSelect?: (item: Entity${i}) => void;
  className?: string;
}

export class Component${i} {
  private props: Component${i}Props;

  constructor(props: Component${i}Props) {
    this.props = props;
  }

  render(): string {
    return \`Component${i}: \${this.props.data.length} items\`;
  }

  handleClick(item: Entity${i}): void {
    if (this.props.onSelect) {
      this.props.onSelect(item);
    }
  }

  getData(): Entity${i}[] {
    return this.props.data;
  }
}
`;
  writeFileSync(join(baseDir, `components/ui/Component${i}.tsx`), content);
}

// Generate utility files (10 files)
console.log("Generating utility files...");
for (let i = 1; i <= 10; i++) {
  const content = `/**
 * Utility functions - Module ${i}
 */

export function format${i}(value: string): string {
  return value.toUpperCase();
}

export function validate${i}(input: unknown): boolean {
  return typeof input === "string" && input.length > 0;
}

export function transform${i}<T>(data: T[]): T[] {
  return data.slice();
}

export const CONSTANT_${i} = ${i * 100};

export class Utility${i} {
  static process(value: string): string {
    return format${i}(value);
  }

  static check(input: unknown): boolean {
    return validate${i}(input);
  }
}
`;
  writeFileSync(join(baseDir, `src/utils/util${i}.ts`), content);
}

// Create main index file
console.log("Generating index file...");
const indexContent = `/**
 * Medium Project - Main Entry Point
 * Aggregates all modules
 */

// Export all services
${Array.from({ length: 10 }, (_, i) => i + 1)
  .map((i) => `export { Service${i} } from "./services/Service${i}";`)
  .join("\n")}

// Export all models
${Array.from({ length: 10 }, (_, i) => i + 1)
  .map((i) => `export { Model${i} } from "./models/Model${i}";`)
  .join("\n")}

// Export all utilities
${Array.from({ length: 10 }, (_, i) => i + 1)
  .map((i) => `export * from "./utils/util${i}";`)
  .join("\n")}

// Export types
${Array.from({ length: 10 }, (_, i) => i + 1)
  .map((i) => `export type { Entity${i}, Status${i}, Config${i} } from "../types/module${i}";`)
  .join("\n")}
`;
writeFileSync(join(baseDir, "src/index.ts"), indexContent);

console.log("✅ Medium-scale project generated successfully!");
console.log(`Total files created: ${10 + 10 + 10 + 10 + 10 + 1} = 51 files`);
