/**
 * Small Project - Main Entry Point
 * Depends on: types.ts, user.ts, product.ts, utils.ts
 */

import { User, Product, AuthToken, UserRole } from "./types";
import { UserService } from "./user";
import { ProductService } from "./product";
import { formatDate, isValidEmail, formatCurrency } from "../lib/utils";

/**
 * Application class that integrates all services
 */
export class Application {
  private userService: UserService;
  private productService: ProductService;

  constructor() {
    this.userService = new UserService();
    this.productService = new ProductService();
  }

  /**
   * Register a new user with validation
   */
  registerUser(name: string, email: string, age: number): User | null {
    if (!isValidEmail(email)) {
      return null;
    }

    if (age < 0 || age > 150) {
      return null;
    }

    return this.userService.createUser(name, email, age);
  }

  /**
   * Create a product with formatted price
   */
  createProduct(name: string, price: number, category: string): {
    product: Product;
    formattedPrice: string;
  } | null {
    if (price < 0) {
      return null;
    }

    const product = this.productService.addProduct(name, price, category);
    return {
      product,
      formattedPrice: formatCurrency(price),
    };
  }

  /**
   * Get user statistics
   */
  getUserStats(): {
    totalUsers: number;
    timestamp: string;
  } {
    const users = this.userService.getAllUsers();
    return {
      totalUsers: users.length,
      timestamp: formatDate(new Date()),
    };
  }
}

// Export all public APIs
export { User, Product, AuthToken, UserRole } from "./types";
export { UserService } from "./user";
export { ProductService } from "./product";
export * from "../lib/utils";
