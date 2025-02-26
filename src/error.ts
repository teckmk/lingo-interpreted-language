export const InvalidIndentationError = (indentWidth: number, line: number) =>
  new Error(
    `Invalid Indentation: Expected it to multiple of initial value: ${indentWidth} at line ${line}`,
  )
