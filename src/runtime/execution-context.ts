export type StackFrame = {
  functionName: string
  filename: string
  position: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
}

export class ExecutionContext {
  private callStack: StackFrame[]
  private loopStack: { loopId: string; label?: string }[] = []

  constructor() {
    this.callStack = []
  }

  public enterLoop(loopId: string, label?: string): void {
    this.loopStack.push({ loopId, label })
  }

  public exitLoop(): void {
    this.loopStack.pop()
  }

  public isInLoop(): boolean {
    return this.loopStack.length > 0
  }

  public getCurrentLoop(): { loopId: string; label?: string } | undefined {
    return this.loopStack[this.loopStack.length - 1]
  }

  public pushCallStack(frame: StackFrame) {
    this.callStack.push(frame)
  }

  public popCallStack() {
    this.callStack.pop()
  }

  public getCallStack(): StackFrame[] {
    return this.callStack.reverse()
  }

  static formatStackTrace(stack: StackFrame[], maxFrames = 10): string {
    const trimmedStack = stack.slice(0, maxFrames) // Limit frames to avoid excessive output
    let stackTrace = "Stack Trace:\n"
    for (const frame of trimmedStack) {
      // const shortFile = frame.filename.replace(/^.*[\\/]/, "") // Extract filename from path
      const shortFile = frame.filename
      stackTrace += `  at ${frame.functionName || "<anonymous>"} (${shortFile}:${frame.position.start.line}:${frame.position.start.column})\n`
    }

    if (stack.length > maxFrames) {
      stackTrace += `  ... (${stack.length - maxFrames} more frames)\n`
    }

    return stackTrace
  }
}
