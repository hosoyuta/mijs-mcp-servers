/**
 * Service - Business Logic 2
 */

import { Model2 } from "../models/Model2";
import { Entity2, Status2 } from "../../types/module2";

export class Service2 {
  private model: Model2;

  constructor() {
    this.model = new Model2();
  }

  async create(data: Omit<Entity2, "id">): Promise<Entity2> {
    return this.model.create(data);
  }

  async getById(id: string): Promise<Entity2 | undefined> {
    return this.model.findById(id);
  }

  async getAll(): Promise<Entity2[]> {
    return this.model.findAll();
  }

  async update(
    id: string,
    updates: Partial<Entity2>
  ): Promise<Entity2 | undefined> {
    return this.model.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return this.model.delete(id);
  }

  async count(): Promise<number> {
    return this.model.findAll().length;
  }
}
