const DynamoDB = require('./index')('eu-central-1');
const arg = process.argv[2];

const baseParams = {
  ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
}

const params = {
  KeySchema: [{ AttributeName: "name", KeyType: "HASH" }],
  AttributeDefinitions: [{ AttributeName: "name", AttributeType: "S" }],
};

const combinedParams = {
  KeySchema: [
    { AttributeName: "name", KeyType: "HASH" },
    { AttributeName: "tribe", KeyType: "RANGE" },
  ],
  AttributeDefinitions: [
    { AttributeName: "name", AttributeType: "S" },
    { AttributeName: "tribe", AttributeType: "S" }
  ],
}

switch(arg) {
  case 'create':
    DynamoDB
      .select("aws.table.for.testing")
      .createTable(Object.assign(params, baseParams))
      .then((data) => console.log("Created Test Table with primary key"))
      .catch(err => console.log(err.message.split('\n')[1]));

    DynamoDB
      .select("aws.table.combined.for.testing")
      .createTable(Object.assign(combinedParams, baseParams))
      .then((data) => console.log("Created Test Table with primary and range key"))
      .catch(err => console.log(err.message.split('\n')[1]));
    break;
  case 'delete':
    DynamoDB
      .select("aws.table.for.testing")
      .deleteTable()
      .then(() => console.log("Deleted Test Table"))
      .catch(err => console.log(err.message.split('\n')[1]));
    break;
  default:
    console.log(`Usage: node ${process.argv[1]} <command>\nAvailable command: create, delete`);
}
