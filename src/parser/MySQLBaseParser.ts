import { Parser, CommonTokenStream } from 'antlr4ts'
import { SqlMode } from './common'

// This is a superclass used to customize parser functionality.
export abstract class MySQLBaseParser extends Parser {
  serverVersion: number
  sqlMode?: SqlMode

  public constructor(input: CommonTokenStream) {
    super(input)
    this.serverVersion = 80000
  }

  public reset(): void {
    super.reset(false)
  }

  // Checks the token at the given position relative to the current position, whether it matches the expected value.
  // For positions > 1 this looks ahead, otherwise it looks back.
  // Note: position == 0 is not defined. position == 1 is the current position.
  public look(position: number, expected: number): boolean {
    // TODO: String.fromCharcode?
    return this.inputStream.LA(position) === expected
  }

  // TODO:
  // A specialized function to get the text from a given context. This falls back to context->getText() in the general
  // case, but provides special behavior for certain contexts (e.g. the implicit string concatenation used in MySQL).
  // public getText() {}

  // Validation function used to check that a string that is not allowed to contain line breaks really doesn't.
  public containsLinebreak(text: string): boolean {
    return text.includes('\r\n')
  }

  // Returns true if the given mode (one of the enums above) is set.
  public isSqlModeActive(mode: number): boolean {
    if (!this.sqlMode) {
      return false
    }

    return (this.sqlMode & mode) !== 0
  }
}
