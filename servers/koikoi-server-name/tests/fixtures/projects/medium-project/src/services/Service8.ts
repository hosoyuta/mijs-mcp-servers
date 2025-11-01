/**
 * Service - Business Logic 8
 */

import { Model8 } from "../models/Model8";
import { Entity8, Status8 } from "../../types/module8";

export class Service8 {
  private model: Model8;

  constructor() {
    this.model = new Model8();
  }

  async create(data: Omit<Entity8, "id">): Promise<Entity8> {
    return this.model.create(data);
  }

  async getById(id: string): Promise<Entity8 | undefined> {
    return this.model.findById(id);
  }

  async getAll(): Promise<Entity8[]> {
    return this.model.findAll();
  }

  async update(
    id: string,
    updates: Partial<Entity8>
  ): Promise<Entity8 | undefined> {
    return this.model.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return this.model.delete(id);
  }

  async count(): Promise<number> {
    return this.model.findAll().length;
  }
}
