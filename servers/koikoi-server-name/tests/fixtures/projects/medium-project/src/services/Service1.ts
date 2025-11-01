/**
 * Service - Business Logic 1
 */

import { Model1 } from "../models/Model1";
import { Entity1, Status1 } from "../../types/module1";

export class Service1 {
  private model: Model1;

  constructor() {
    this.model = new Model1();
  }

  async create(data: Omit<Entity1, "id">): Promise<Entity1> {
    return this.model.create(data);
  }

  async getById(id: string): Promise<Entity1 | undefined> {
    return this.model.findById(id);
  }

  async getAll(): Promise<Entity1[]> {
    return this.model.findAll();
  }

  async update(
    id: string,
    updates: Partial<Entity1>
  ): Promise<Entity1 | undefined> {
    return this.model.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return this.model.delete(id);
  }

  async count(): Promise<number> {
    return this.model.findAll().length;
  }
}
