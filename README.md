# node-dynamo

DynamoDB helpers

### Requirements

Install official aws-sdk package from npm or yarn

```bash
> npm install aws-sdk || yarn add aws-sdk
```

Require module and pass AWS configuration JSON as parameter

```js
const DynamoDB = require('./dynamoDB')('./credits.json');
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
const UserModel = DynamoDB.select('users');
```

#### Tables

_**Create**_

```js
UserModel.createTable({
    KeySchema: [       
        { AttributeName: "uid", KeyType: "HASH"},  //Partition key
        { AttributeName: "name", KeyType: "RANGE" }  //Sort key
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
  uid: O123456, // Uniq Key
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
UserModel.update({ uid: 05435 }, {
  friends: ["abdu", "chris"],
  points: 450,
});
```

_**Delete**_

```js
UserModel.delete({ identifier: "abdu" });
```
