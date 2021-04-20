/*
 * Copyright © 2020 Ingram Micro Inc. All rights reserved.
 */

import rql from '@/index';


let result;

describe('#rql', () => {
  // Simple filter
  const simpleFilter = {
    name: 'mr Loop',
    surname: 'lop;',
    type: 'admin',
    client: 'null()',
    surname2: 'empty()',
    age: 13,
  };

  const simpleFilterQurey = 'name="mr Loop"&surname="lop;"&type=admin&client=null()&surname2=empty()&age=13';

  // Text matching filter
  const textMatchingFilter = {
    name: {
      $like: 'vasya*',
      $ilike: '***New',
    },
    city: {
      $like: {
        start: 'M',
        end: 'w',
      },
      $ilike: {
        start: 'M',
      },
    },
    country: {
      $like: {
        end: 'a',
      },
      $ilike: {
        pattern: '*u*ss*',
        start: 'R',
        end: 'a',
      },
    },
    area: {
      $ilike: true,
      $like: {
        invalidKey: 'qwe',
      },
    },
  };

  const textMatchingFilterQuery = 'like(name,*vasya\\**)&ilike(name,*\\*\\*\\*New*)&like(city,M*w)&ilike(city,M*)&like(country,*a)&ilike(country,R*a)&ilike(country,*u*ss*)';

  // List filter
  const listFilter = {
    age: {
      $out: [1, 2],
    },
    num: {
      $in: [3, 4, 5],
    },
  };

  const listFilterQuery = 'out(age,(1,2))&in(num,(3,4,5))';

  // Range filter
  const rangeFilter = {
    age: {
      $range: {
        max: 5,
        min: 9,
      },
    },
  };

  const rangeFilterQuery = 'range(age,9,5)';

  // Relational filter
  const relFilter = {
    name: {
      $eq: 'vasya',
    },
    age: {
      $gt: 1,
      $lt: 8,
    },
    num: {
      $le: 9,
      $ge: 4,
    },
  };

  const relFilterQuery = 'eq(name,vasya)&gt(age,1)&lt(age,8)&le(num,9)&ge(num,4)';

  // Filter with NOT
  const filterWithNOT = {
    name: {
      $not: [{
        $eq: 'vasya',
      }, {
        $eq: 'pet;ya',
      }],
    },
    age: {
      $not: {
        $eq: 10,
        $in: [1, 2, 3],
      },
    },
  };

  const filterWithNOTQuery = 'not(eq(name,vasya))&not(eq(name,"pet;ya"))&not(eq(age,10))&not(in(age,(1,2,3)))';

  // Filter with OR
  const filterWithOR = {
    color: {
      $or: [
        { $eq: 'red' },
        { $eq: 'blue' },
        { $eq: 'yellow' },
      ],
    },
    $or: [
      { product: 'TV' },
      { product: 'Computer' },
    ],
  };

  const filterWithORQuery = '(((eq(color,red))|(eq(color,blue)))|(eq(color,yellow)))&((product=TV)|(product=Computer))';

  // Control operators
  const controlFilter = {
    $select: ['products', 'agreements'],
    $ordering: '-created',
    $sort: ['-name', 'created'],
    $limit: { start: 10, count: 100 },
  };

  const controlFilterQuery = 'select(products,agreements)&ordering(-created)&sort(-name,created)&limit(10,100)';

  // Combination filters
  const combinationFilter = {
    offset: 0,
    limit: 10,
    $select: ['products', 'agreements'],
    $ordering: ['title', '-created'],
    $limit: { count: 99 },
    $or: [
      {
        type: 'distribution',
        owner: { $eq: 'me' },
      },
      {
        type: { $in: ['sourcing', 'service'] },
        owner: { $not: { $eq: 'me' } },
      },
      {
        owner: { $eq: 'me' },
        $and: [
          { $or: [
            { type: 'distribution' },
            { status: 'pending' },
          ] },
          { $or: [
            { type: 'program' },
            { status: 'active' },
          ] },
        ],
      },
    ],
    name: {
      $or: [
        { $like: 'my test' },
        { $like: 'my' },
        { $ilike: '***CONTRACT' },
      ],
      $ne: 'not my test',
    },
  };

  const combinationFilterQuery = 'offset=0&limit=10&select(products,agreements)&ordering(title,-created)&limit(0,99)&(((type=distribution&eq(owner,me))|(in(type,(sourcing,service))&not(eq(owner,me))))|(eq(owner,me)&(((type=distribution)|(status=pending)))&(((type=program)|(status=active)))))&(((like(name,"*my test*"))|(like(name,*my*)))|(ilike(name,*\\*\\*\\*CONTRACT*)))&ne(name,"not my test")';

  // Filter with empty values
  const filterWithEmptyValues = {
    $limit: {},
    $or: [
      {
        age: null,
        $or: [
          {
            name: { $eq: '' },
            $not: {},
          },
          { value: 123 },
          { age: null },
        ],
      },
    ],
    name: '',
    type: {},
    status: [],
    owner: {
      $or: null,
      $out: [],
      $in: [1],
    },
    created: {
      $in: [],
      $eq: undefined,
      $ne: '',
      $like: undefined,
      $not: {
        $ge: null,
        $not: [
          { $eq: '' },
        ],
      },
    },
  };

  const filterWithEmptyValuesQuery = '(((value=123)))&in(owner,(1))';

  // Filter with AND and OR
  const filterWithANDandOR = {
    name: {
      $and: [
        { $like: 'test' },
        { $like: 'prop' },
      ],
    },
    $and: [
      { $or: [
        { status: 'new' },
        { type: 'program' },
      ] },
      { $or: [
        { status: 'done' },
        { type: 'service' },
      ] },
    ],
  };

  const filterWithANDandORquery = '(like(name,*test*))&(like(name,*prop*))&(((status=new)|(type=program)))&(((status=done)|(type=service)))';

  it.each([
    ['simple filter', simpleFilter, simpleFilterQurey],
    ['text matching filter', textMatchingFilter, textMatchingFilterQuery],
    ['list filters', listFilter, listFilterQuery],
    ['range filter', rangeFilter, rangeFilterQuery],
    ['relational filter', relFilter, relFilterQuery],
    ['logic NOT filter', filterWithNOT, filterWithNOTQuery],
    ['logic OR filter', filterWithOR, filterWithORQuery],
    ['control filter', controlFilter, controlFilterQuery],
    ['combination filters', combinationFilter, combinationFilterQuery],
    ['filter with empty values', filterWithEmptyValues, filterWithEmptyValuesQuery],
    ['filter with AND and OR', filterWithANDandOR, filterWithANDandORquery],
  ])('supports %s', (filteKind, filter, expected) => {
    result = rql(filter);

    expect(result).toEqual(expected);
  });
});
