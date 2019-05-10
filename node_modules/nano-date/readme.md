# Nano Date

[![Downloads][npm-dm]][package-url]
[![Downloads][npm-dt]][package-url]
[![NPM Version][npm-v]][package-url]
[![Dependencies][deps]][package-url]
[![Dev Dependencies][dev-deps]][package-url]
[![License][license]][package-url]
[![Build Status](https://travis-ci.org/jcgertig/nano-date.svg?branch=master)](https://travis-ci.org/jcgertig/nano-date)
[![Code Climate](https://codeclimate.com/github/jcgertig/nano-date/badges/gpa.svg)](https://codeclimate.com/github/jcgertig/nano-date)
[![Test Coverage](https://codeclimate.com/github/jcgertig/nano-date/badges/coverage.svg)](https://codeclimate.com/github/jcgertig/nano-date/coverage)

__Date class that supports up to nano seconds__

All of the normal date class functions with a few addtions.

If you pass a number in the constructor it will assume milliseconds however if
you pass in a string of numbers it will assume nanoseconds.

```javascript
const upToMillisecondPrecision  = new NanoDate(1497290225089); // assumes milliseconds
const upToMicrosecondPrecision  = new NanoDate(1497290225089.999); // assumes milliseconds
const upToNanosecondPrecision = new NanoDate('1497290225089999999'); // assumes nanoseconds
```

__Why a string of numbers?__
This is because 13 digits is ~ the max you can have in javascript and not have it start rounding off and 16 digits is ~ the max you can have in a float before it too starts to round.
So for our case of nanoseconds it needs up to 19 digits or more to represent time since epoch
that goes far beyond what a integer or float can handle so we have to use strings. Under the hood we use a library called bignumber.js to handle the math we do on this number.

Extra available methods.

- `getMicroseconds`
```javascript
nanoDate.getMicroseconds(); // 0 - 999
```

- `getNanoseconds`
```javascript
nanoDate.getNanoseconds(); // 0 - 999
```

- `setMicroseconds` - returns the microseconds value
```javascript
nanoDate.setMicroseconds(25); // 25
```

- `setNanoseconds` - returns the nanoseconds value
```javascript
nanoDate.setNanoseconds(25); // 25
```

- `toString`, `toUTCString` & `toISOStringFull` - adds millisecond, microsecond, nanosecond as a decimal to the seconds
```javascript
nanoDate.toString(); // ie "Mon Jun 12 2017 12:57:05.089999999 GMT-0500 (CDT)"
```

- `valueOf` && `NanoDate.now()` - returns a integer of millisecond precision

- `valueOfWithMicro` - returns a float with microsecond precision
```javascript
nanoDate.valueOfWithMicro(); // 1497290225089.999
```

- `valueOfWithNano` - returns a float in a string with nanosecond precision
```javascript
nanoDate.valueOfWithNano(); // "1497290225089.999999"
```

- `getTime` - returns a string in nanoseconds
```javascript
nanoDate.getTime(); // "1497290225089999999"
```

[npm-dm]: https://img.shields.io/npm/dm/nano-date.svg
[npm-dt]: https://img.shields.io/npm/dt/nano-date.svg
[npm-v]: https://img.shields.io/npm/v/nano-date.svg
[deps]: https://img.shields.io/david/jcgertig/nano-date.svg
[dev-deps]: https://img.shields.io/david/dev/jcgertig/nano-date.svg
[license]: https://img.shields.io/npm/l/nano-date.svg
[package-url]: https://npmjs.com/package/nano-date
