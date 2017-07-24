# DynamoDB ORM
[![Travis-ci](https://travis-ci.org/AbdullahZN/dynamodb-orm.svg?branch=master)](https://travis-ci.org/AbdullahZN/dynamodb-orm)
[![Code Climate](https://codeclimate.com/github/AbdullahZN/dynamodb-orm/badges/gpa.svg)](https://codeclimate.com/github/AbdullahZN/dynamodb-orm)

Please note this repository is a work in progress. Contributions are welcome.

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
```bash
# AWS credentials as ENV vars
AWS_SECRET_ACCESS_KEY="myKey"
AWS_ACCESS_KEY_ID="yourSecret"
```


Require module
```js
const DynamoDB = require('dynamo-node')(region [, credit_path ]);
// e.g with json credentials
const DynamoDB = require('dynamo-node')('eu-central-1', './credits.json');
// e.g with env vars
const DynamoDB = require('dynamo-node')('eu-central-1');
```


## Usage

---

#### Models

Init your model, this works even if 'users' table is not created yet

We'll use the same model in further examples

```js
// "users" refers to the TableName we want to query from
const UserModel = DynamoDB.select('users');
```

#### Tables

_**Create**_

Attribute types association

S  |  SS | N  | NS  |  B  |  BS | BOOL  |  NULL  | L   |  M
--|---|---|---|---|---|---|---|---|--
String  | String Set  | Number  | Number Set  | Binary  | Binary Set  | Boolean  | Null  | List  | Map


```js
UserModel.createTable({
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
UserModel.deleteTable();
```

---

#### Items

_**Add**_

```js
UserModel.add({
  name: "abdu", // Primary Key
  participants: ["A", "B", "C", "D"],
  last: "D"
});
```

_**Get**_

```js
UserModel.get({ name: "abdu" });
```

_**Update**_

```js
UserModel.update({ name: "abdu" }, {
  friends: ["abdu", "chris"],
  points: 450,
});

// nested properties, assuming clothes is set and is of type Map
UserModel.update({ name: "abel" }, {
  'clothes.shirts': 10,
  'clothes.polos': 3
});
```

_**Delete**_

```js
UserModel.delete({ name: "abdu" });
```

_**Scan**_

Returns all items from table
```js
UserModel.scan();
```

## Conditional Queries

_**Check if attribute exists**_

```js
const newUser = { name: "abel", age: 34 };

UserModel.exists('name').add(newUser);
UserModel.exists( ['name', 'age'] ).add(newUser);

UserModel.notExists('name').add(newUser);
UserModel.notExists( ['name', 'age'] ).add(newUser);
```

_**Attribute comparison**_

```js
const hector = { name: "hector" };

UserModel.add({ name: "hector", last_connection: 50, age: 10, friends: { nice: 0, bad: 10 } });

// Deletes it
UserModel
  .if('last_connection', '>', 30 )
  .if('last_connection', '<', 100)
  .if('age', '<>', 90) // different than
  .delete(hector);

// Updates it
UserModel
  .if('last_connection', '=', 50)
  .if('friends.bad', '>=', 0)
  .if('age', '<=', 10)
  .update(hector, { candy: 1 });
```

_**Attribute functions**_

```js
const momo = { name: "momo" };

UserModel.where('name', 'beginsWith', 'm').update(momo, { nickname: "momomo" });
UserModel.where('nickname', 'contains', 'mo').update(momo, { friends: ["lololo"] });

// Please refer to "Attribute types association" section for the list of type attributes
UserModel.where('friends', 'typeIs', 'N').update(momo, { friends: 0 }); // Won't update

```

## Attribute manipulation

_**Increment/Decrement attribute**_

```js
const burger = { name: 'burger' };

FoodModel.add({ name: 'burger', sold: 0, sellers: [5,8], ingredients: { cheese: 2 } });

FoodModel.increment('sold', 10).update(burger); // { sold: 10 }
FoodModel.decrement('sold', 1).update(burger); // { sold: 9 }

FoodModel.increment('ingredients.cheese', 4).update(burger);
FoodModel.decrement('ingredients.cheese', 1).update(burger);
```

_**Remove attribute**_
```js
FoodModel.removeAttribute(burger, [ 'ingredients.cheese' ]);
FoodModel.removeAttribute(burger, [ 'sold', 'ingredients' ]);
// burger is now { name: burger, sellers: [5,8] }
```

_**Add to/Remove from list attribute**_
```js
FoodModel.addToList({ sellers: [9] }).update(burger) // { ..., sellers: [5,8,9] }
FoodModel.removeFromList({ sellers: [8, 5] }).update(burger) // { ..., sellers: [9] }
```
---

#### Return values

Following previous examples, here's how you handle return values from each methods.

> Note: All methods return promises

```js
// outputs "Abdu"
UserModel.get({ name: "abdu" })
    .then(item => console.log(item.name));

// outputs "26"
UserModel.update({ name: "abdu" }, { age: "26" })
    .then(item => console.log(item.age));

// both outputs "{}"
UserModel.delete({ name: "abdu" })
    .then(item => console.log(item));

UserModel.add({ name: "Chris", age: "65" })
    .then(item => console.log(item));

```

---

#### Tests

Tests are located in the **./tests** folder
Note that you have to create two Tables named "**aws.table.for.testing**" and "**aws.table.combined.for.testing**" in order for them to run correctly.

Here's full testing process using npm scripts

```bash
> npm run createTable // can take a few seconds to be created even if process exits
> npm run test
```
