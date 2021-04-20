/*
 * Copyright © 2020 Ingram Micro Inc. All rights reserved.
 */

import {
  anyPass,
  curry,
  equals,
  isEmpty,
  isNil,
  pipe,
  replace,
  type,
} from 'ramda';


/** Check that argument is strict object
 * @type {Function}
 * @param {Any} arg
 * @return {Boolean}
 *
 * @summary Any -> Boolean
 * @example
 *  ({}) -> true
 *  ([]) -> false
 */
export const isObjectStrict = pipe(type, equals('Object'));


/** Check that argument is null or undefined or empty
 * @type {Function}
 * @param {Any} arg
 * @return {Boolean}
 *
 * @summary Any -> Boolean
 * @example
 *  null -> true
 *  undefined -> true
 *  [] -> true
 *  {} -> true
 *  '' -> true
 *  'abc -> false
 */
export const isNilOrEmpty = anyPass([isEmpty, isNil]);


/** Applies ternary operator to arguments
 * @type {Function}
 * @param {Any} arg
 * @return {Boolean}
 *
 * @summary Any -> Any -> Any -> Any
 * @example
 *  'a' -> 'b' -> true -> 'a'
 *  'a' -> 'b' -> false -> 'b'
 */
export const alt = curry((t, f, c) => (c ? t : f));


/** Escape all stars in string
 * @type {Function}
 * @param {String} arg
 * @return {String}
 *
 * @summary Any -> Any -> Any -> Any
 * @example
 *  '*a*' -> '\*b\*'
 */
export const escapeStars = replace(/\*/g, '\\*');
