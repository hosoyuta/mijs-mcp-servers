/**
 * Sample file with syntax errors for testing error handling
 * This file intentionally contains syntax errors
 */

// Missing closing brace
export function brokenFunction() {
  console.log("This function is missing a closing brace");
  if (true) {
    console.log("Nested block");
  // Missing }
}

// Invalid syntax
export const invalidSyntax =

// Missing type annotation
export function missingReturn() {
  const x = 5;
  // Missing return statement but return type is not void
}

// Incorrect interface definition
export interface BrokenInterface
  name: string  // Missing semicolon and brace
  age: number
}

// Duplicate identifier
export const duplicateVar = "first";
export const duplicateVar = "second";

// Invalid type usage
export function invalidType(param: ThisTypeDoesNotExist): void {
  console.log(param);
}

// Unclosed string
export const unclosedString = "This string is not closed

// Missing comma in object
export const obj = {
  prop1: "value1"
  prop2: "value2"
};

// Invalid class syntax
export class BrokenClass {
  constructor(
    public name string  // Missing colon
  ) {}

  // Method without body
  brokenMethod()
}
