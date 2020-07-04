import { Token, CharStream } from 'antlr4ts'
import { MySQLLexer } from './MySQLLexer'
import { Lexer } from 'antlr4ts/Lexer'
import { SqlMode } from './common'

// This is a superclass used to customize lexer functionality.
export abstract class MySQLBaseLexer extends Lexer {
  inVersionComment: boolean
  pendingTokens: Token[]
  serverVersion: number
  // Used to check repertoires.
  charsets: string[]
  sqlMode?: SqlMode

  public constructor(input: CharStream) {
    super(input)
    this.inVersionComment = false
    this.serverVersion = 50707
    this.pendingTokens = []
    this.charsets = []
  }

  public reset(): void {
    this.inVersionComment = false
    super.reset()
  }

  // Allow a grammar rule to emit as many tokens as it needs.
  public nextToken(): Token {
    // First respond with pending tokens to the next token request, if there are any.
    if (this.pendingTokens.length > 0) {
      const pending = this.pendingTokens.shift()
      if (pending) {
        return pending
      }
    }

    // Let the main lexer class run the next token recognition.
    // This might create additional tokens again.
    const next = super.nextToken()

    if (this.pendingTokens.length > 0) {
      const pending = this.pendingTokens.shift()
      this.pendingTokens.push(next)
      if (pending) {
        return pending
      }
    }

    return next
  }

  public nextDefaultChannelToken(): Token {
    let token = this.nextToken()

    while (token.channel !== Token.DEFAULT_CHANNEL) {
      token = this.nextToken()
    }

    return token
  }

  public emitDot(): void {
    const token = this.tokenFactory.create(
      this._tokenFactorySourcePair,
      MySQLLexer.DOT_SYMBOL,
      '.',
      this._channel,
      this._tokenStartCharIndex,
      this._tokenStartCharIndex,
      this._tokenStartLine,
      this._tokenStartCharPositionInLine
    )

    this.pendingTokens.push(token)

    ++this._tokenStartCharIndex
  }

  public checkVersion(text: string): boolean {
    // Minimum is: /*!12345
    if (text.length < 8) {
      return false
    }

    // Skip version comment introducer.
    const version = parseInt(text.substring(3, text.length), 10)
    if (version <= this.serverVersion) {
      this.inVersionComment = true
      return true
    }

    return false
  }

  public checkCharset(text: string): number {
    return this.charsets.includes(text) ? MySQLLexer.UNDERSCORE_CHARSET : MySQLLexer.IDENTIFIER
  }

  // Returns true if the given mode (one of the enums above) is set.
  public isSqlModeActive(mode: number): boolean {
    if (!this.sqlMode) {
      return false
    }

    return (this.sqlMode & mode) !== 0
  }

  public determineFunction(proposed: number): number {
    // Skip any whitespace character if the sql mode says they should be ignored,
    // before actually trying to match the open parenthesis.
    if (this.isSqlModeActive(SqlMode.IgnoreSpace)) {
      let input = this._input.LA(1)
      let character = String.fromCharCode(input)
      while (character === ' ' || character === '\t' || character === '\r' || character === '\n') {
        this.interpreter.consume(this._input)
        this.channel = Lexer.HIDDEN
        this.type = MySQLLexer.WHITESPACE
        input = this._input.LA(1)
        character = String.fromCharCode(input)
      }
    }

    const input = this._input.LA(1)
    return String.fromCharCode(input) === '(' ? proposed : MySQLLexer.IDENTIFIER
  }
}
