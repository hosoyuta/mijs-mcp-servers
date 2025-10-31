/**
 * Sample test file
 */

import { helper } from '../lib/helper';

describe('helper', () => {
  test('should process input', () => {
    const result = helper('test');
    expect(result).toBe('Processed: test');
  });
});
