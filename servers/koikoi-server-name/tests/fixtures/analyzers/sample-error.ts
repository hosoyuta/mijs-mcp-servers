/**
 * File with syntax errors for testing error handling
 */

function broken() {
  console.log("This function is incomplete"
  // Missing closing parenthesis and brace
}

class IncompleteClass {
  prop: string
  // Missing semicolon - this might not be an error in TS

  method() {
    return "test"
  // Missing closing brace
