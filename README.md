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

#### Tables

_**Create**_

```js
DynamoDB.createTable({
    TableName : "Movies",
    KeySchema: [       
        { AttributeName: "year", KeyType: "HASH"},  //Partition key
        { AttributeName: "title", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [       
        { AttributeName: "year", AttributeType: "N" },
        { AttributeName: "title", AttributeType: "S" }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
    })
});
```

_**Delete**_

```js
DynamoDB.deleteTable({ TableName: "Movies" });
```

---

#### Items

_**Add**_

```js
DynamoDB.add({
  TableName: 'Rooms',
  Item: {
    name: "privateRoom",
    participants: ["A", "B", "C", "D"],
    last: "D"  
  }
});
```

_**Get**_

```js
DynamoDB.get({ TableName: "Rooms", Key: {name: "privateRoom"} });
```

_**Update**_

```js
DynamoDB.update({
  TableName: "Rooms",
  Key: { name: 'myRoom' },
  update: {
    participants: ["abdu", "chris"],
    last: "A",
    totalParticipants: 450,
  }
})
```

_**Delete**_

```js
DynamoDB.delete({ TableName: "Rooms", Key: { name: "privateRoom" } });
```
