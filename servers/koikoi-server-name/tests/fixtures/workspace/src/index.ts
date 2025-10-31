/**
 * Workspace main entry point
 */

import { helper } from '../lib/helper';
import { Config } from './types';

export function main(): void {
  console.log('Application started');
  const result = helper('test');
  console.log(result);
}

export const config: Config = {
  name: 'test-app',
  version: '1.0.0'
};
