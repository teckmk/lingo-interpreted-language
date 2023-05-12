# Getting Started

`lingo` is a toy programming language created for learning interpretors.

## Requirements

- Node.js
- Typescript

## Installation

1. Clone the project and `cd` in the project root
2. Building
   ```bash
   tsc
   ```
3. Installing interpretor globally
   ```bash
   npm install . -g
   ```
4. Now you can run `lingo` code files that end with `.lo` extenstion

# Syntax

## Variables

`lingo` supports two kinds of variables, one which can be reassigned and other which are constant and cannot be reassigned.

- Variables, that can be reassigned

  ```javascript
  var someVar = 10
  someVar = 20
  ```

- Constants, that cannot be reassigned
  ```javascript
  const numDaysInWeek = 7
  numDaysInWeek = 8 // Error, cannot reassign a constant
  ```

## Strings and Interpolation

Strings are declared using double quotes

```javascript
var name = "John Doe"
```

To evaluate a variable inside the string prefix variable with $

```dart
const message = "My name is $name" // Evaluates to: My name is John Doe
```

To insert expressions in strings ${} syntax is used

```dart
const result = "2 + 2 = ${2 + 2}" // Evaluates to: 2 + 2 = 4
```

## Printing to console

`print` is built-in function that is used to log the output

```javascript
print("Hello World!") // Hello World!

print(5 + 9) // 14

const PI = 1.1314

print("PI is $PI") // PI is 1.1314
```

## Conditionals

```javascript
var age = 20

if (age < 18) {
  print("Immature")
} else if (age == 18) {
  print("You can get your ID")
} else {
  print("Retire")
}
```

## Loops

```dart
var start = 1

const end = 10
const tableof = 8

while (start <= end) {
  print("$tableof * $start = ${tableof * start}")
  start = start + 1
}
```

## Arrays

```javascript
var subjects = ["Physics", "Maths", "Computer", "Literature"]
```

`length` is built-in function to get the length of an array

```dart
print("Number of subjects are ${length(subjects)}")
```

## Functions

Functions are declared using `fn` keyword

```rust
fn add(a,b){
    a + b
}
```

> Note: Functions in `lingo` automatically return last evaluated result

Functions can return functions, that are executed by appending another pair of parens

```rust
fn padder(padding){
    fn add(a,b){
        padding + a + b
    }
}

const result = padder(10)(5,20)
print(result) // 35
```

# In Progress

- Comments
- Logic Gates: &&, ||
- Static Type Checking

# Plans

Features that we're going to add in future

- Enums
- Interfaces
- Classes
- Tuples

Architecture level things we're considering

- Compiling to Byte Code
- Adding Multi-threading
