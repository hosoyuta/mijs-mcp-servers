/**
 * Sample class definitions for testing
 * Contains class, inheritance, and method definitions
 */

/**
 * 基底クラス: Person
 */
export class Person {
  constructor(
    public readonly id: string,
    public name: string,
    protected age: number
  ) {}

  /**
   * 挨拶メッセージを返す
   */
  greet(): string {
    return `Hello, I'm ${this.name}`;
  }

  /**
   * 年齢を取得
   */
  getAge(): number {
    return this.age;
  }
}

/**
 * 継承クラス: Employee
 */
export class Employee extends Person {
  private salary: number;

  constructor(
    id: string,
    name: string,
    age: number,
    public department: string,
    salary: number
  ) {
    super(id, name, age);
    this.salary = salary;
  }

  /**
   * 給与を取得
   */
  getSalary(): number {
    return this.salary;
  }

  /**
   * 昇給
   */
  raiseSalary(amount: number): void {
    this.salary += amount;
  }

  /**
   * 従業員情報を文字列で返す
   */
  override greet(): string {
    return `Hello, I'm ${this.name} from ${this.department}`;
  }
}

/**
 * 抽象クラス: Shape
 */
export abstract class Shape {
  constructor(public color: string) {}

  /**
   * 面積を計算（抽象メソッド）
   */
  abstract calculateArea(): number;

  /**
   * 色を表示
   */
  displayColor(): string {
    return `This shape is ${this.color}`;
  }
}

/**
 * 具象クラス: Circle
 */
export class Circle extends Shape {
  constructor(
    color: string,
    public radius: number
  ) {
    super(color);
  }

  calculateArea(): number {
    return Math.PI * this.radius * this.radius;
  }
}

/**
 * 具象クラス: Rectangle
 */
export class Rectangle extends Shape {
  constructor(
    color: string,
    public width: number,
    public height: number
  ) {
    super(color);
  }

  calculateArea(): number {
    return this.width * this.height;
  }
}
