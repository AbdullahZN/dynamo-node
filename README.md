# pretty simple DynamoDB ORM

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
  name: "abdu", // Uniq Key
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

You can also select a specific item following this example :

_**getItemObject**_

```js
const Abdu = UserModel.getItemObject({ name: "abdu" });
```

_**This give you access to the parent Model methods ( except for #Add ), without worrying about the primary Key**_

```js
Abdu.get();
Abdu.update({
  friends: ["abdu", "chris", "frank"],
  points: 650,
});
Abdu.delete();
```
