# DynamoDB ORM
[![Travis-ci](https://travis-ci.org/AbdullahZN/DynamoDB.svg?branch=master)](https://travis-ci.org/AbdullahZN/DynamoDB)
[![Code Climate](https://codeclimate.com/github/AbdullahZN/DynamoDB/badges/gpa.svg)](https://codeclimate.com/github/AbdullahZN/DynamoDB)

### Requirements

Install package from npm or yarn

```bash
> npm install dynamo-node || yarn add dynamo-node
```

Require module and pass AWS configuration JSON as parameter

```js
const DynamoDB = require('dynamo-node')('./credits.json');
```

Necessary configuration JSON content

```js
{
  "accessKeyId": "myKey",
  "secretAccessKey": "yourSecret",
  "region": "eu-central-1"
}
```

### Usage

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
```

_**Delete**_

```js
UserModel.delete({ name: "abdu" });
```

####

#### You can also select a specific item following this example :

_**getItemObject**_

```js
const Abdu = UserModel.getItemObject({ name: "abdu" });
```

_**This give you access to the parent Model methods \( except for \#Add \), without worrying about the primary Key**_

```js
Abdu.get();
Abdu.update({
  friends: ["abdu", "chris", "frank"],
  points: 650,
});
Abdu.delete();
```

---

#### Return values

Following previous examples, here's how you handle return values from each methods.

> Note: All methods return promises

```js
// outputs "Abdu"
Abdu.get()
    .then(item => console.log(item.name));

// outputs "26"
Abdu.update({ age: "26" })
    .then(item => console.log(item.age));

// both outputs "{}"
Abdu.delete()
    .then(item => console.log(item));

UserModel.add({ name: "Chris", age: "65" })
    .then(item => console.log(item));

// both outputs "object"
UserModel.createTable( tableSchema )
    .then(table => console.log(typeof table));

UserModel.deleteTable()
    .then(table => console.log(typeof table));
```

You can catch errors like you would usually do

---

#### Tests

Tests are located in the **./tests** folder  
Note that you have to create a Table named "**aws.table.for.testing**" in order for them to run correctly.

Here's full testing process using npm scripts

```bash
> npm run createTable // can take a few seconds to be created even if process exits
> npm run test
> npm run deleteTable
```
