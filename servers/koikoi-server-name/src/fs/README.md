# File System Layer

## Overview
TypeScript Compiler API based code analysis system's file system abstraction layer.

This layer provides secure, high-performance file operations with workspace boundary protection and glob pattern matching capabilities.

## Components

### FileReader
High-performance file reading using Bun.file() API with metadata extraction.

**Features:**
- Fast file reading with Bun.file()
- Metadata extraction (size, modification time, line count)
- Security measures (file size limits, path validation)
- UTF-8 encoding support

**Example:**
```typescript
import { FileReader } from './fs';

const reader = new FileReader();
const result = await reader.readFile('./src/index.ts');

console.log(result.content);
console.log(result.metadata.lines);
console.log(result.metadata.size);
```

### PathResolver
Path resolution with workspace boundary checking and glob pattern matching.

**Features:**
- Path resolution (relative to absolute)
- Workspace boundary validation
- Glob pattern matching with exclude patterns
- Cross-platform path normalization

**Example:**
```typescript
import { PathResolver } from './fs';

// 1. Path resolution
const resolver = new PathResolver('./my-project');
const resolved = resolver.resolve('./src/index.ts');

console.log(resolved.absolutePath);
console.log(resolved.relativePath);

// 2. Glob pattern matching
const files = await resolver.matchFiles(['src/**/*.ts']);
console.log(files);
```

### WorkspaceValidator
Workspace and file existence validation.

**Features:**
- Workspace directory validation
- File existence checking
- Directory existence checking

**Example:**
```typescript
import { WorkspaceValidator } from './fs';

const validator = new WorkspaceValidator();

// 1. Validate workspace
const isValid = await validator.validateWorkspace('./my-project');

// 2. Check file existence
const exists = await validator.fileExists('./src/index.ts');

// 3. Check directory existence
const dirExists = await validator.directoryExists('./src');
```

## Full Integration Example

```typescript
import { FileReader, PathResolver, WorkspaceValidator } from './fs';

// 1. Validate workspace
const validator = new WorkspaceValidator();
const isValid = await validator.validateWorkspace('./my-project');

if (!isValid) {
  throw new Error('Invalid workspace');
}

// 2. Resolve path
const resolver = new PathResolver('./my-project');
const resolved = resolver.resolve('./src/index.ts');

// 3. Check file existence
const exists = await validator.fileExists(resolved.absolutePath);

if (!exists) {
  throw new Error('File not found');
}

// 4. Read file
const reader = new FileReader();
const result = await reader.readFile(resolved.absolutePath);

console.log(`Read ${result.metadata.lines} lines from ${resolved.relativePath}`);
```

## Security Features

### File Size Limits
- Maximum file size: 100MB (configurable)
- Prevents DoS attacks and out-of-memory errors

### Workspace Boundary Protection
- All paths are validated against workspace boundaries
- Prevents path traversal attacks (e.g., `../../etc/passwd`)
- Throws `WorkspaceBoundaryError` for invalid paths

### Path Validation
- Rejects empty or invalid paths
- Normalizes paths for cross-platform compatibility

## Error Handling

### FileSystemError
Base error class for all file system related errors.

```typescript
throw new FileSystemError('File not found', '/path/to/file', 'ENOENT');
```

### WorkspaceBoundaryError
Thrown when attempting to access files outside workspace.

```typescript
throw new WorkspaceBoundaryError('/etc/passwd', '/home/user/project');
```

## Performance Optimizations

1. **Single API Call**: Bun.file() called once per file operation
2. **Efficient Line Counting**: String split without array allocation
3. **Glob Pattern Caching**: Duplicate file patterns are deduplicated
4. **Path Normalization**: Minimal string operations for path conversion

## Testing

All components have comprehensive test coverage:
- Unit tests: `tests/fs/*.test.ts`
- Integration tests: `tests/fs/integration.test.ts`

Run tests:
```bash
bun test tests/fs/
```

## Configuration

### Default Exclude Patterns
The following patterns are excluded by default in glob matching:
- `node_modules/**`
- `dist/**`
- `.git/**`
- `**/*.map`
- `**/.DS_Store`

### File Size Limit
Default: 100MB (100 * 1024 * 1024 bytes)

This can be adjusted in `FileReader.ts` by modifying the `MAX_FILE_SIZE` constant.

## Type Definitions

All type definitions are exported from `src/types/fs.ts`:
- `FileMetadata`: File metadata structure
- `FileReadResult`: File reading result
- `ResolvedPath`: Path resolution result
- `WorkspaceInfo`: Workspace information

## Dependencies

- **bun**: File system operations
- **glob**: Pattern matching
- **path**: Path manipulation
- **fs/promises**: File stats (Node.js)

## Best Practices

1. **Always validate workspace** before performing file operations
2. **Use PathResolver** for all path operations to ensure boundary checking
3. **Check file existence** with WorkspaceValidator before reading
4. **Handle errors** appropriately with try-catch blocks
5. **Use relative paths** when working within a workspace

## Future Enhancements

- [ ] Automatic encoding detection
- [ ] File watching capabilities
- [ ] Caching layer for repeated reads
- [ ] Stream-based reading for large files
- [ ] Parallel file reading
- [ ] Path traversal attack detection improvements
