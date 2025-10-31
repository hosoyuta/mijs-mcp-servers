/**
 * Workspace type definitions
 */

export interface Config {
  name: string;
  version: string;
  debug?: boolean;
}

export type Status = 'active' | 'inactive' | 'pending';

export interface User {
  id: string;
  username: string;
  status: Status;
}
