import { ExecutionContext } from "./execution-context"

export class RuntimeError extends Error {
  context?: ExecutionContext

  constructor(context: ExecutionContext, message: string) {
    super(message)
    this.name = "RuntimeError"
    this.context = context
  }
}
