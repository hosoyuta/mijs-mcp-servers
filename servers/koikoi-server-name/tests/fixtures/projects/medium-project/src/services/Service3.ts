/**
 * Service - Business Logic 3
 */

import { Model3 } from "../models/Model3";
import { Entity3, Status3 } from "../../types/module3";

export class Service3 {
  private model: Model3;

  constructor() {
    this.model = new Model3();
  }

  async create(data: Omit<Entity3, "id">): Promise<Entity3> {
    return this.model.create(data);
  }

  async getById(id: string): Promise<Entity3 | undefined> {
    return this.model.findById(id);
  }

  async getAll(): Promise<Entity3[]> {
    return this.model.findAll();
  }

  async update(
    id: string,
    updates: Partial<Entity3>
  ): Promise<Entity3 | undefined> {
    return this.model.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return this.model.delete(id);
  }

  async count(): Promise<number> {
    return this.model.findAll().length;
  }
}
