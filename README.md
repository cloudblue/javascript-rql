# Javascript RQL
[![Build Status](https://travis-ci.org/cloudblue/javascript-rql.svg?branch=master)](https://travis-ci.org/cloudblue/javascript-rql)
[![codecov](https://codecov.io/gh/cloudblue/javascript-rql/branch/master/graph/badge.svg)](https://codecov.io/gh/cloudblue/javascript-rql)
[![npm](https://img.shields.io/npm/v/javascript-rql)](https://img.shields.io/npm/v/javascript-rql)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=javascript-rql&metric=alert_status)](https://sonarcloud.io/dashboard?id=javascript-rql)

The javascript-rql is a simple and powerful library to transform javascript object to valid rql query string. Supports queries of any complexity (any nesting).

## RQL

RQL (Resource query language) is designed for modern application development. It is built for the web, ready for NoSQL, and highly extensible with simple syntax.
This is a query language fast and convenient database interaction. RQL was designed for use in URLs to request object-style data structures.


[RQL Reference](https://connect.cloudblue.com/community/api/rql/)

[RQL for Web](https://www.sitepen.com/blog/resource-query-language-a-query-language-for-the-web-nosql/)

[Django RQL](https://github.com/cloudblue/django-rql)

## Install

To install the javascript-rql from a terminal window type:

```sh
$ npm install --save javascript-rql
```

## Interface

Javascript object with rql expressions should implement the following interface (typescript example):
```typescript
interface IRQLExpression {
    $eq?: string|number,
    $ne?: string|number,
    $not?: IRQLExpression,
    $gt?: number,
    $ge?: number,
    $lt?: number,
    $le?: number,
    $like?: string,
    $ilike?: string,
    $in?: Array<number|string>,
    $out?: Array<number|string>,
    $range?: {
        min: number,
        max: number,
    },
}
 
interface IRQL {
    $and? Array<IRQL>
    $or?: Array<IRQL>;
    $ordering?: Array<string>;
    $select?: Array<string>;
    limit?: number;
    offset?: number;
    [key: string]?: string|number|Array<string|number>|boolean|IRQLExpression;
}
```
## Usage
You can import rql function:
```js
import { rql } from 'javascript-rql';
```
or
```js
const { rql } = require('javascript-rql');
```

and use:
```js
rql(rqlObject);
```


## Examples

##### Simple filters
```js
const filter = {
  name: 'eugene',
  age: 13,
};
 
rql(filter); // 'name=eugene&age=13'
```

##### Filters with text matching
```js
const filter = {
  name: {
    $like: 'vasya*',
    $ilike: '***New',
  },
};
 
rql(filter); //'like(name,*vasya\**)&ilike(name,*\*\*\*New*)'
```

##### Filter with list
```js
const filter = {
  age: {
    $out: [1, 2],
  },
  num: {
    $in: [3, 4, 5],
  },
};
 
rql(filter); //'out(age,(1,2))&in(num,(3,4,5))'
```

##### Filters with range
```js
const filter = {
  age: {
    $range: {
      max: 5,
      min: 9,
    },
  },
};
 
rql(filter); //'range(age,9,5)'
```

##### Filters with relationals
```js
const filter = {
  name: {
    $eq: 'vasya',
  },
  age: {
    $gt: 1,
    $lt: 8,
  },
  num: {
    $lte: 9,
    $gte: 4,
  },
};

rql(filter); //'eq(name,vasya)&gt(age,1)&lt(age,8)&lte(num,9)&gte(num,4)'
```

##### Filters with logical NOT
```js
const filter = {
  name: {
    $not: [{
      $eq: 'vasya',
    }, {
      $eq: 'petya',
    }],
  },
  age: {
    $not: {
      $eq: 10,
      $in: [1, 2, 3],
    },
  },
};

rql(filter); //'not(eq(name,vasya))&not(eq(name,petya))&not(eq(age,10))&not(in(age,(1,2,3)))'
```

##### Filters with logical OR
```js
const filter = {
  // You can use $or inside field
  color: {
    $or: [
      // Inside { } may be some conditions and for all them is used logical operator AND
      { $eq: 'red' },
      { $eq: 'blue' },
      { $eq: 'yellow' },
    ],
  },
 
  // Also you can use $or in root level, then inside must be objects array with fields name
  $or: [
    // Inside { } may be some fields with conditions and for all them is used logical operator AND
    { product: 'TV' },
    { product: 'Computer' },
  ],
};
 
rql(filter); //'(((eq(color,red))|(eq(color,blue)))|(eq(color,yellow)))&((product=TV)|(product=Computer))'
```

##### Combine AND and OR filters
```js
// When you need to use same keys in and conditions (for example with OR) you can use special logical AND:
const filter = {
  $and: [
    {
      $or: [
        {status: 'new'},
        {type: 'program'},
      ],
    },
    {
      $or: [
        {status: 'done'},
        {type: 'service'},
      ]
    },
  ]
};
 
rql(filter); // "(((status=new)|(type=program)))&(((status=done)|(type=service)))"
```

##### Filters with control operators
We support 2 key for ordering: ordering and sort. Use the one which is implemented by the backend.
```js
const filter = {
  $select: ['products', 'agreements'],
  $ordering: '-created',
  $sort: ['-name'],
  $limit: { start: 10, count: 100 },
};
 
rql(filter); //Result: 'select(products,agreements)&ordering(-created)&sort(-name)&limit(10,100)'
```

##### Combine any filters in one query
```js
const combinationFilter = {
  offset: 0,
  limit: 10,
  $select: ['products', 'agreements'],
  $ordering: ['title', '-created'],
  $or: [
    {
      type: 'distribution',
      owner: { $eq: 'me' },
    },
    {
      type: { $in: ['sourcing', 'service'] },
      owner: { $not: { $eq: 'me' } },
    },
  ],
  name: {
    $or: [
      { $like: 'my test' },
      { $like: 'my' },
      { $ilike: '***CONTRACT' },
    ],
  },
};

rql(filter); //'offset=0&limit=10&select(products,agreements)&ordering(title,-created)&((type=distribution&eq(owner,me))|(in(type,(sourcing,service))&not(eq(owner,me))))&(((like(name,"*my test*"))|(like(name,*my*)))|(ilike(name,*\*\*\*CONTRACT*)))'
```

##### Filters with empty values 
```js
// If values are empty, null, undefined then they will not be in the query.
const filter = {
  $select: [],
  $ordering: [],
  name: '',
  age: null,
  $or: [{name: undefined}],
  type: 'pending',
};

rql(filter); //'type=pending'
```

## Contribute

If you want to contribute to the javascript-rql development feel free to open issues or fork the github repository and submit your pull request.


## License

The javascript-rql is licensed under the [*Apache License 2.0*](http://www.apache.org/licenses/LICENSE-2.0).


