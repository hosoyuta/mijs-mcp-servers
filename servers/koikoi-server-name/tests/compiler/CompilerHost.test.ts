/**
 * CompilerHost tests
 */

import { describe, test, expect } from 'bun:test';
import { CompilerHost } from '../../src/compiler/CompilerHost';

describe('CompilerHost', () => {
  test('should create CompilerHost instance', () => {
    const host = new CompilerHost();
    expect(host).toBeDefined();
  });
});
