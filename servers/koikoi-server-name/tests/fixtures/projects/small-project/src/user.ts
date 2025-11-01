/**
 * Small Project - User Service
 * Depends on: types.ts
 */

import { User, UserRole } from "./types";

export class UserService {
  private users: Map<string, User> = new Map();

  /**
   * Create a new user
   */
  createUser(name: string, email: string, age: number): User {
    const user: User = {
      id: this.generateId(),
      name,
      email,
      age,
    };

    this.users.set(user.id, user);
    return user;
  }

  /**
   * Get user by ID
   */
  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  /**
   * Get all users
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
