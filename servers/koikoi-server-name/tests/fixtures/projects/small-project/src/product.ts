/**
 * Small Project - Product Service
 * Depends on: types.ts
 */

import { Product } from "./types";

export class ProductService {
  private products: Map<string, Product> = new Map();

  /**
   * Add a product
   */
  addProduct(name: string, price: number, category: string): Product {
    const product: Product = {
      id: this.generateId(),
      name,
      price,
      category,
    };

    this.products.set(product.id, product);
    return product;
  }

  /**
   * Get product by ID
   */
  getProduct(id: string): Product | undefined {
    return this.products.get(id);
  }

  /**
   * Get products by category
   */
  getProductsByCategory(category: string): Product[] {
    return Array.from(this.products.values()).filter(
      (p) => p.category === category
    );
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
