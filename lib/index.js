/*
 * Copyright © 2020 Ingram Micro Inc. All rights reserved.
 */

import {
  curry,
  forEachObjIndexed,
  flatten,
  ifElse,
  includes,
  identity,
  is,
  join,
  keys,
  objOf,
  of,
  pipe,
  map,
  test,
  replace,
  reject,
  unless,
  __,
} from 'ramda';

import {
  alt,
  escapeStars,
  isObjectStrict,
  isNilOrEmpty,
} from '@/utils';


export const RQL_EXPRESSIONS = {
  AND: '$and',
  EQ: '$eq',
  NE: '$ne',
  GT: '$gt',
  GTE: '$ge',
  LT: '$lt',
  LTE: '$le',
  LIKE: '$like',
  ILIKE: '$ilike',
  IN: '$in',
  OUT: '$out',
  RANGE: '$range',
  NOT: '$not',
  OR: '$or',
  SELECT: '$select',
  ORDERING: '$ordering',
};


/** Checks that expression type is control kind
 *
 * @type {Function}
 * @param {String} type - expression type
 * @returns {Boolean}
 *
 * @summary String -> String
 * @example ('$select') -> true
 */
const isControlRqlExp = includes(__, [
  RQL_EXPRESSIONS.SELECT,
  RQL_EXPRESSIONS.ORDERING,
]);


/** Wraps primitive expression value in quotation marks
 *
 * @type {Function}
 * @param {String|Number} value - expression value
 * @returns {String}
 *
 * @summary String -> String
 * @example ('a b') -> '"a b"'
 */
const quotize = unless(test(/^([\w\-*+\\][\w.\-:+@*\\]*|null\(\)|empty\(\))$/g), (v) => `"${v}"`);


/** Transform tech operation name to rql operation name (removes $)
 *
 * @type {Function}
 * @param {String} operation
 * @returns {String}
 *
 * @summary String -> String
 * @example ('$select') -> 'select'
 */
const $operation = replace(/^\$/g, '');


/** Wraps any expression value in quotation marks
 *
 * @type {Function}
 * @param {String|Number|Array} value - expression value
 * @returns {String}
 *
 * @summary String|Number|Array -> String
 * @example (['some test', 'test']) -> '"some test",test'
 */
const $value = ifElse(
  Array.isArray,
  pipe(
    map(quotize),
    join(','),
  ),
  quotize,
);


/** Prepares query string applying formatter function
 *
 * @type {Function}
 * @param {Function} formatter - function to expression value
 * @param {String} field - field name
 * @param {String} operation - operation name
 * @param {String} value  - expression value
 * @return {String}
 *
 * @summary Function ->  String -> String -> String -> String
 * @example (v=>`*${v}*`, 'name', '$eq', 'Jone') -> 'eq(name,*Jone*)'
 */
const $query = curry((valueFormatter, field, operation, value) => alt(
  '',
  `${$operation(operation)}(${field},${valueFormatter(value)})`,
  isNilOrEmpty(value),
));


/** Enhances function to preparing expression value
 *
 * @type {Function}
 * @param {String} field name
 * @param {String} operation name
 * @param {String} expression value
 * @return {String}
 *
 * @summary String -> String -> String -> String
 * @example ('name', '$eq', 'Jone Lone') -> 'eq(name,"Jone Lone")'
 */
const qRel = $query($value);


/** Prepares default query param string
 *
 * @type {Function}
 * @param {String} field - param name
 * @param {String|Number|Array} value - param value
 * @returns {String}
 *
 * @summary (String, String) -> String
 * @example
 *  ('name', 'Jone Lone') -> 'name="Jone Lone"'
 *  ('name', undefined) -> ''
 */
const qEq = (field, value) => alt('', `${field}=${$value(value)}`, isNilOrEmpty(value));


/** Prepares array value to list searching
 *
 * @type {Function}
 * @param {Array} value - array expression value
 * @returns {String}
 *
 * @summary (String, String) -> String
 * @example
 *  ('Jone') -> '*Jone*'
 *  ('name', undefined) -> ''
 */
const qList = $query((v) => `(${$value(v)})`);


/** Prepares range value to range searching
 *
 * @type {Function}
 * @param {Object} value - object with min and max
 * @returns {String}
 *
 * @summary {min: Number, max: Number} -> String
 * @example ({min:2,max:4}) -> '2,4'
 */
const qRange = $query(({ min, max }) => `${min},${max}`);


/** Transforms array value to OR RQL expression string
 *
 * @type {Function}
 * @param {Array} value - array value to OR expression
 * @returns {String}
 *
 * @summary Array -> String
 * @example (['a','b', undefined, 'c','d']) -> '(((a|b)|c)|d)'
 */
const qOr = (values) => values.reduce((acc, v) => alt(
  acc,
  alt(`(${v})`, `(${acc}|${v})`, isNilOrEmpty(acc)),
  isNilOrEmpty(v),
));


/** Wraps expression value to expression operator
 *
 * @type {Function}
 * @param {String} opration - expression operator
 * @param {String} value - expression value
 * @param {Function} formatter - function formatter for value
 * @returns {String}
 *
 * @summary (String, String, Function) -> String
 * @example
 *  ('$ne', 'abc') -> 'ne(abc)'
 *  ('$select', 'my field', snakeCase) -> 'select(my_field)'
 */
const qWrap = (operation, value, formatter = identity) => alt(
  '',
  `${$operation(operation)}(${formatter(value)})`,
  isNilOrEmpty(value),
);


/** Prepares value to AND RQL expression
 *
 * @type {Function}
 * @param {Array} value - array value to AND expression
 * @returns {String}
 *
 * @summary Array -> String
 * @example (['a','b','c','d']) -> '(((a|b)|c)|d)'
 */
const qAnd = pipe(
  reject(isNilOrEmpty),
  join('&'),
);


/** Prepares text value to non-strict searching
 *
 * @type {Function}
 * @param {String} value - text expression value
 * @returns {String}
 *
 * @summary (String, String) -> String
 * @example
 *  ('Jone') -> '*Jone*'
 */
const qFullsearchText = $query(unless(isNilOrEmpty, (v) => $value(`*${escapeStars(v)}*`)));


/** Prepares text value to starts with searching
 *
 * @type {Function}
 * @param {String} value - text expression value
 * @returns {String}
 *
 * @summary (Object) -> String
 * @example
 *  ({start: 'Jone'}) -> 'Jone*'
 */
const qStartText = $query((v) => $value(`${escapeStars(v.start)}*`));


/** Prepares text value to end with searching
 *
 * @type {Function}
 * @param {String} value - text expression value
 * @returns {Object}
 *
 * @summary (Object) -> String
 * @example
 *  ({end: 'Jone'}) -> '*Jone'
 */
const qEndText = $query((v) => $value(`*${escapeStars(v.end)}`));


/** Prepares text value to end/start searching
 *
 * @type {Function}
 * @param {String} value - text expression value
 * @returns {String}
 *
 * @summary (Object) -> String
 * @example
 *  ({start: 'M', end: 'w'}) -> 'M*w'
 */
const qStartAndEndText = $query((v) => $value(`${escapeStars(v.start)}*${escapeStars(v.end)}`));


/** Prepares text value to pattern searching
 *
 * @type {Function}
 * @param {String} value - text expression value
 * @returns {String}
 *
 * @summary (Object) -> String
 * @example
 *  ({pattern: 'C*u*t*y'}) -> 'C*u*t*y'
 */
const qPatternText = $query((v) => $value(v.pattern));


/* eslint-disable no-use-before-define */
/** Applies expression operation to the other rql expressions of field
 *
 * @type {Function}
 * @param {String} field - field (param name, entity prop)
 * @param {String} operation - expression operation
 * @param {Object|Array} rqlFilters - rql expressions which will be applied to the operation
 * @returns {String}
 *
 * @summary (String, String, Array|Object) -> String
 * @example
 *  ('name', '$not', {$eq: 'Jon'}) -> ['not(eq(name, Jon))']
 *  ('name', '$not', [[{$eq:'Jon'}, {$eq: 'Mark'}]) -> ['not(eq(name,Jon))', 'not(eq(name,Mark))']
 */
const toWrappedQueries = (field, operation, rqlFilters) => pipe(
  unless(is(Array), of),
  reject(isNilOrEmpty),
  map((rqlFilter) => map((subKey) => {
    const subRql = objOf(subKey, rqlFilter[subKey]);
    const subQuery = rqlToQuery(subRql, field);

    return qWrap(operation, subQuery);
  }, keys(rqlFilter))),
  flatten,
)(rqlFilters);


/** Transform rql object to query string and wraps it in brackets
 *
 * @type {Function}
 * @param {Object} rqlObject - rql object
 * @returns {String|undefined|null}
 *
 * @summary Object -> String|undefined|null
 * @example ({ age: { $in: [3, 4, 5] } }) -> '(in(age,(3,4,5)))'
 */
const toWrappedQuery = pipe(
  rql,
  unless(isNilOrEmpty, (v) => `(${v})`),
);


/** Transforms rql expression of field to query string
 *
 * @type {Function}
 * @param {Object} rqlObject - rql object
 * @param {String} field - field (param name, entity prop)
 * @returns {String}
 *
 * @summary (Object, String) -> String
 * @example ({ $like: 'Jo', $ne: 'Joe'  }) -> 'like(name, *Jo*)&ne(name, Joe)'
 */
export function rqlToQuery(rqlExp, field) {
  const rqlFilter = [];

  const toSubQueries = map(pipe(
    objOf(field),
    toWrappedQuery,
  ));

  forEachObjIndexed((value, operation) => {
    if (isNilOrEmpty(value)) return;

    switch (operation) {
      // Text matching
      case RQL_EXPRESSIONS.LIKE:
      case RQL_EXPRESSIONS.ILIKE:
        if (is(String, value)) {
          rqlFilter.push(qFullsearchText(field, operation, value));
        } else if (isObjectStrict(value)) {
          if (value.start && value.end) {
            rqlFilter.push(qStartAndEndText(field, operation, value));
          } else if (value.start) {
            rqlFilter.push(qStartText(field, operation, value));
          } else if (value.end) {
            rqlFilter.push(qEndText(field, operation, value));
          }

          if (value.pattern) {
            rqlFilter.push(qPatternText(field, operation, value));
          }
        }

        break;

      // List matching
      case RQL_EXPRESSIONS.IN:
      case RQL_EXPRESSIONS.OUT:
        rqlFilter.push(qList(field, operation, value));
        break;

      // Range matching
      case RQL_EXPRESSIONS.RANGE:
        rqlFilter.push(qRange(field, operation, value));
        break;

      // Logical OR
      case RQL_EXPRESSIONS.OR:
        rqlFilter.push(qOr(toSubQueries(value)));
        break;

      // Logical AND
      case RQL_EXPRESSIONS.AND:
        rqlFilter.push(qAnd(toSubQueries(value)));
        break;

      // Logical NOT
      case RQL_EXPRESSIONS.NOT:
        rqlFilter.push(...toWrappedQueries(field, operation, value));
        break;

      // Relationals
      default:
        rqlFilter.push(qRel(field, operation, value));
    }
  })(rqlExp);

  return qAnd(rqlFilter);
}


/** Transforms rql object to query string
 *
 * @type {Function}
 * @param {Object} rqlObject - rql object
 * @param {String} field - field (param name, entity prop)
 * @returns {String}
 *
 * @summary Object -> String
 * @example ({ name: { $like: 'Jo', $ne: 'Joe'}  }) -> 'like(name, *Jo*)&ne(name, Joe)'
 */
export function rql(rqlObj) {
  const result = [];

  const toSubQueries = map(toWrappedQuery);

  forEachObjIndexed((value, key) => {
    if (isNilOrEmpty(value)) return;

    if (isObjectStrict(value)) {
      result.push(rqlToQuery(value, key));
    } else if (key === RQL_EXPRESSIONS.OR) {
      result.push(qOr(toSubQueries(value)));
    } else if (key === RQL_EXPRESSIONS.AND) {
      result.push(qAnd(toSubQueries(value)));
    } else if (isControlRqlExp(key)) {
      result.push(qWrap(key, value, $value));
    } else {
      result.push(qEq(key, value));
    }
  }, rqlObj);

  return qAnd(result);
}

export default rql;
