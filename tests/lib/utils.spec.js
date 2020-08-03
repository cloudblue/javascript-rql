/*
 * Copyright © 2020 Ingram Micro Inc. All rights reserved.
 */

import * as utils from '@/utils';


let result;


describe('utils.alt', () => {
  const trueResult = 'some true result';
  const falseResult = 'some false result';
  it.each([
    // expected, trueResult, falseRresult, cond
    [trueResult, trueResult, falseResult, true],
    [trueResult, trueResult, falseResult, 'some'],
    [trueResult, trueResult, falseResult, {}],
    [trueResult, trueResult, falseResult, 1],
    [trueResult, trueResult, falseResult, []],
    [falseResult, trueResult, falseResult, false],
    [falseResult, trueResult, falseResult, undefined],
    [falseResult, trueResult, falseResult, 0],
    [falseResult, trueResult, falseResult, null],
    [falseResult, trueResult, falseResult, ''],
  ])('returns %s when trueResult=%s, falseResult=%s, cond=%s', (
    expected, t, f, cond,
  ) => {
    result = utils.alt(t, f, cond);

    expect(result).toEqual(expected);
  });
});


describe('utils.isObjectStrict', () => {
  it.each([
    // expected, argument
    [true, {}],
    [false, []],
    [false, ''],
    [false, 123],
    [false, () => {}],
    [false, true],
    [false, undefined],
    [false, null],
  ])('returns %s when arg=%s', (
    expected, arg,
  ) => {
    result = utils.isObjectStrict(arg);

    expect(result).toEqual(expected);
  });
});

describe('utils.isNilOrEmpty', () => {
  it.each([
    // expected, argument
    [true, undefined],
    [true, null],
    [true, {}],
    [true, []],
    [true, ''],
    [false, 0],
    [false, { a: 'a' }],
    [false, ['a']],
    [false, false],
    [false, true],
  ])('returns %s when arg=%s', (
    expected, arg,
  ) => {
    result = utils.isNilOrEmpty(arg);

    expect(result).toEqual(expected);
  });
});
