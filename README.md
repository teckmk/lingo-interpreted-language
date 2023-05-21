# Getting Started

`cowlang` is a programming language that is inspired by `Typescript` and `Dart`.  
Getting best of both languages in one place.

## Quick Links
- [Requirements](#requirements)
- [Installation](#installation)
- [Development Setup](#dev-setup)
- [Running Code](#running-code)
- [REPL](#repl)
- [Syntax](#syntax)
  - [Variables](#variables)
     - [Variable Types](#variable-types)
  - [Strings and Interpolation](#strings-and-interpolation)
  - [Comments](#comments)
  - [Printing](#printing-to-console)
  - [Conditionals](#conditionals)
  - [Loops](#loops)
  - [Arrays](#arrays)
  - [Functions](#functions)
    - [Paramter Types](#parameter-types)
  - [Operators](#operators)
  - [Keywords](#keywords)
  - [Built-in Types](#built-in-types)
- [In Progress](#in-progress)
- [Comming Soon Features](#plans)
- [Changelog](./CHANGLOG.md)


## Requirements

- Node.js
- Typescript
- Cowlang Language Support [(VS Code Extension)](https://marketplace.visualstudio.com/items?itemName=skmaky.cowlang)

## Installation
The interpreter can be installed using following command
```bash
npm install -g @cowlang/engine
```

> Above command may not work if package is not available on `npm`. In that case, for time being, follow the steps `Dev Setup` to try it out

## Dev Setup

1. Clone the project and `cd` in the project root
2. Building
   ```bash
   tsc
   ```
3. Installing interpretor globally
   ```bash
   npm install . -g
   ```
4. Now you can run `cowlang` code files that end with `.cow` extenstion


# Running Code
Code files in `cowlang` have `.cow` extension. In order to run your cow file, run:

```bash
cowlang milk-production.cow
```
Above command will run file named `milk-production.cow`

# REPL
Cowlang has built-in support to run code directly in the terminal. Just like Node REPL there's a cowlang REPL.  
To enter in REPL, run:
```bash
cowlang
```
Running above command print something like below:
```bash
cowlang REPL vx.y.x
>
```
Now you can write your code directly inside terminal, and it gets **executed** everytime you press **enter**.
# Syntax

## Variables

`cowlang` supports two kinds of variables, one which can be reassigned and other which are constant and cannot be reassigned.

- Variables, that can be reassigned

  ```javascript
  var someVar = 10
  someVar = 20
  ```

  Variables, can also be declared but initialized
  later, an uninitialized variable must've have expilicit dynamic type

  ```php
  var name: dynamic; # Note the semicolon, it is mandatory here
  name = "John Doe"
  ```

- Constants, that cannot be reassigned
  ```javascript
  const numDaysInWeek = 7
  numDaysInWeek = 8
  ```

### Variable Types
Type can be declared after a colon following the identifier.
```typescript
var name: string = "John Doe"
var age: number = 20
```
 Types are infered in cowlang, if no type is given interpreter gets it from the value assigned
```php
var name = "John Doe"
name = 20 # it will throw error, because name is string
```
To create dynamic variable, that can have any value of any type use `dynamic` type
```typescript
var store: dynamic = "some value"
store = 20
store = false
store = [1.2, 3.5]
```
## Strings and Interpolation

Strings are declared using double quotes

```javascript
var name = "John Doe"
```

To evaluate a variable inside the string prefix variable with $

```dart
const message = "My name is $name"
```

To insert expressions in strings ${} syntax is used

```dart
const result = "2 + 2 = ${2 + 2}"
```

## Comments

Anything that starts with # is considered as comment and ignored

```php
# This is a comment
print("Hello") # Prints Hello
```

## Printing to console

`print` is built-in function that is used to log the output

```javascript
print("Hello World!")

print(5 + 9)

const PI = 1.1314

print("PI is $PI")
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

> Note: Functions in `cowlang` automatically return last evaluated result

Functions can return functions, that are executed by appending another pair of parens

```rust
fn padder(padding){
    fn add(a,b){
        padding + a + b
    }
}

const result = padder(10)(5,20)
print(result)
```
### Parameter Types
Parameter types can be given same as in variables
```php
fn add(a: number, b: number){
 a + b
}

add(1,2) # prints 3
add(1, true) # throws error, becuase 'true' is not a number
```

## Operators

| Operator | Description            |
| -------- | ---------------------- |
| >        | Greater Than           |
| >=       | Greater Than Or Equals |
| <        | Less Than              |
| <=       | Less Than Or Equals    |
| ==       | Equals                 |
| !=       | Not Equals             |
| =        | Assignment             |
| &&       | And                    |
| \|\|     | Or                     |
| and      | And                    |
| or       | Or                     |

## Keywords

| Keyword | Description         |
| ------- | ------------------- |
| var     | Declares a variable |
| const   | Declares a constant |
| while   | Loop                |
| if      | Conditional         |
| else    | Conditional         |
| fn      | Declares a function |
| and     | Logical 'and'       |
| or      | Logical 'or'        |
## Built-in Types

| Type    | Description                          |
| ------- | ------------------------------------ |
| dynamic | A dynamic variable can have any type |
| string  | String type                          |
| number  | Integer and floats                   |
| array   | Array                                |
| object  | Object                               |

# In Progress

- Param and return types

# Plans

Features that we're going to add in future

- Enums
- Interfaces
- Classes
- Tuples

Architecture level things we're considering

- Compiling to Byte Code
- Adding Multi-threading


# [Changelog](./CHANGLOG.md)