# DynamoDB ORM
[![Travis-ci](https://travis-ci.org/AbdullahZN/dynamo-node.svg?branch=master)](https://travis-ci.org/AbdullahZN/dynamo-node)

This DynamoDB ORM for node.js aims to provide a beautiful, simple and complete implementation to work with dynamodb databases. You can easily select a table and start querying/writing data, from simple requests to conditional ones without prior knowledge.

Current features:
 - **Expression Abstraction:** Condition, Attribute values/names, Projections, Filters, KeyConditions
 - **Conditional Requests:** Add, update, delete and query conditionally
 - **Attribute Functions:** begins_with, contains, typeIs, in
 - **Incrementing Decrementing**
 - **List, Set Append/Remove**
 - **Attribute Removal**

#### **Please note this repository is a work in progress. Contributions are welcome.**

## Requirements

Install package from npm or yarn

```bash
> npm install dynamo-node || yarn add dynamo-node
```

You can either set your AWS credentials as env variables or as a JSON file

```js
// AWS credentials as JSON file
{
  "accessKeyId": "myKey",
  "secretAccessKey": "yourSecret",
}
```

Require module
```js
const DynamoDB = require('dynamo-node')(region [, credit_path ]);
// e.g with json credentials
const DynamoDB = require('dynamo-node')('eu-central-1', './credits.json');
// e.g with env vars
process.env.DYNAMO_ENV = 'test';
const DynamoDB = require('dynamo-node')('eu-central-1');
```


## Usage

---

#### Tables

Inits your table, or sets tablename for further creation

```js
// "users" refers to the TableName we want to query from
const UserTable = DynamoDB.select('users');
```

_**Create**_

Attribute types association

S  |  SS | N  | NS  |  B  |  BS | BOOL  |  NULL  | L   |  M
--|---|---|---|---|---|---|---|---|--
String  | String Set  | Number  | Number Set  | Binary  | Binary Set  | Boolean  | Null  | List  | Map


```js
UserTable.createTable({
    KeySchema: [       
        { AttributeName: "name", KeyType: "HASH"},  //Partition key
        { AttributeName: "uid", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [       
        { AttributeName: "uid", AttributeType: "N" },
        { AttributeName: "name", AttributeType: "S" }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
    }
});
```

_**Delete**_

```js
UserTable.deleteTable();
```


---

#### Items

_**Add**_

```js
UserTable.add({
  name: "abdu", // Primary Key
  participants: ["A", "B", "C", "D"],
  last: "D"
});
```

_**Get**_

```js
UserTable.get({ name: "abdu" });
```

_**Update**_

```js
// if "abdu" doesn't exist, it will be added (upsert)
UserTable.update({ name: "abdu" }, {
  friends: ["abdu", "chris"],
  points: 450,
});

// nested properties, assuming clothes is set and is of type Map
UserTable.update({ name: "abel" }, {
  'clothes.shirts': 10,
  'clothes.polos': 3
});

UserTable.update(key, attributes, 'OLD'); // returns item's pre-update state
UserTable.update(key, attributes, 'UPD'); // default, returns only updated attributes
UserTable.update(key, attributes, 'NEW'); // returns item's post-update state
```

_**Delete**_

```js
UserTable.delete({ name: "abdu" });
```

_**Query**_

```js
UserTable.query('name', '=', 'abdu');

// Using global secondary index
UserTable.useIndex('age-index').query('age', '=', 5);
```

_**Scan**_

Returns all items from table

```js
// a very expensive task !
UserTable.scan();
```

## Conditional Queries

_**Check if attribute exists**_

```js
const newUser = { name: "abel", age: 34 };

UserTable.exists('name').add(newUser);
UserTable.exists( ['name', 'age'] ).add(newUser);

UserTable.notExists('name').add(newUser);
UserTable.notExists( ['name', 'age'] ).add(newUser);
```

_**Attribute comparison**_

```js
const hector = { name: "hector" };

UserTable.add({ name: "hector", last_connection: 50, age: 10, friends: { nice: 0, bad: 10 } });

// Deletes it
UserTable
  .if('last_connection', '>', 30 )
  .if('last_connection', '<', 100)
  .if('age', '<>', 90) // different than
  .delete(hector);

// Updates it
UserTable
  .if('last_connection', '=', 50)
  .if('friends.bad', '>=', 0)
  .if('age', '<=', 10)
  .update(hector, { candy: 1 });
```

_**Attribute functions**_


<kbd>beginsWith</kbd>

- matches a substring with the beggining of an attribute

```js

// Updates user if nickname attribute begins with a 'm'
UserTable.where('nickname', 'beginsWith', 'm').update(momo, { nickname: "lol" });
```

<kbd>contains</kbd>

- String: matches substring
- List: matches element

```js
// Updates user if nickname contains 'lol'
UserTable.where('nickname', 'contains', 'lol').update(momo, { fun: true });

// Updates user if 'homer' is in parents list
UserTable.where('parents', 'contains', 'homer').update(momo, { cool: true });
```

<kbd>typeIs</kbd>

- matches attribute type

Please refer to "Attribute types association" section for the list of type attributes

```js
// Updates user momo if his friends attribute is N (number)
UserTable.where('friends', 'typeIs', 'N').update(momo, { friends: 0 });
```

<kbd>inList</kbd>

- matches attribute with provided array

```js
// Gets user named 'abel' if he has a friend named 'abdu' or 'chris'
UserTable.inList('friends', [ 'abdu', 'chris' ]).query('name', '=', 'abel');

```

## Attribute manipulation

_**Increment/Decrement attribute**_

```js
const burger = { name: 'burger' };

FoodTable.add({ name: 'burger', sold: 0, sellers: [5,8], ingredients: { cheese: 2 } });

FoodTable.increment('sold', 10).update(burger); // { sold: 10 }
FoodTable.decrement('sold', 1).update(burger); // { sold: 9 }

FoodTable.increment('ingredients.cheese', 4).update(burger);
FoodTable.decrement('ingredients.cheese', 1).update(burger);
```

_**Remove attribute**_
```js
FoodTable.removeAttribute(burger, [ 'ingredients.cheese' ]);
FoodTable.removeAttribute(burger, [ 'sold', 'ingredients' ]);
// burger is now { name: burger, sellers: [5,8] }
```

_**Add to/Remove from list attribute**_
```js

// The provided array of VALUES will be appended to the attribute
FoodTable.addToList({ sellers: [9] }).update(burger) // { ..., sellers: [5, 8, 9] }

// This time we pass an array of INDEXES from which we want to delete
FoodTable.removeFromList({ sellers: [1] }).update(burger) // { ..., sellers: [5, 9] }
```
---

## Batch Operations

```js
// No need to provide a table name this time
const Batch = DynamoDB.select();
```

```js
const batchGet = {
    'table1': {
        // 'name' is the primary key of table1
        Keys: { 'name': ['myItem', 'myItem2', 'myItem3', 'myItem4'] }
    },
    'table2': {
        // 'pid' is the primary key of table2
        Keys: { 'pid': [1101, 1110, 1010] }
    }
};
Batch.batchGet(batchGet);
```

```js
const batchPut = {
    'table1': [ { name: 'a'}, { name: 'b' }, { name: 'c' }, { name: 'd' } ],
    'table2': [ { pid: 1 }, { pid: 2 }, { pid: 3 }, { pid: 4 } ],
};

Batch.batchPut(batchPut);
```

```js
const batchDelete = {
    'table1': [ { name: 'b' }, { name: 'c' } ],
    'table2': [ { pid: 3 }, { pid: 4 } ],
};

Batch.batchDelete(batchDelete);
```

#### Projections

You can select which attributes you want back from the result when performing get, query or scan operations

```js
Table.add({ id: 1, status: 2, a, b, c, d });
Table.add({ id: 2, status: 2, e, f, g, h });

// returns { Items: [{ id: 1 }], Count: 1, ... }
Table.project('id').query('id', '=', 1);

// returns { Items: [{ id: 1, status: 2 }, { id: 2, status: 2 }], ... }
Table.project(['id', 'status']).scan();

// returns { status: 2 }
Table.project(['status']).get({ id: 1 });
```

#### Return values

All methods return promises

```js
// outputs "Abdu"
UserTable.get({ name: "abdu" })
    .then(item => console.log(item.name));

// outputs "26"
UserTable.update({ name: "abdu" }, { age: "26" })
    .then(item => console.log(item.age));

// both outputs "{}"
UserTable.delete({ name: "abdu" })
    .then(item => console.log(item));

UserTable.add({ name: "Chris", age: "65" })
    .then(item => console.log(item));

```

---

#### Test & Development

Tests are located in the **./tests** folder

To run tests or to start working with dynamo-node, you should run a local dynamodb database

Here is the quickest process to setup a local dynamodb database

```bash
# jre 7+ required, you can find a complete ubuntu installation in .travis.yml configuration

$ mkdir dyn && cd dyn
# wget or curl -O, not both
$ wget https://s3.eu-central-1.amazonaws.com/dynamodb-local-frankfurt/dynamodb_local_latest.tar.gz
$ curl -O https://s3.eu-central-1.amazonaws.com/dynamodb-local-frankfurt/dynamodb_local_latest.tar.gz
$ tar -xvf *.tar.gz
# this will run a local dynamodb database listening on 8000
$ java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb &
$ cd ..
```

Now that we have our database running, we have to create two tables named "**aws.table.for.testing**" and "**aws.table.combined.for.testing**" in order for them to run correctly.

We can create those tables with the **./testTable.js** script.

```bash
$ node testTable create

# if needed
$ node testTable delete
```

Run tests
```bash
> npm run test || yarn test
```

#### Environment

You need to set up a specific envvar to start development with dynamo-node and a local dynamo db

```js
process.env.DYNAMO_ENV = 'test';
```
