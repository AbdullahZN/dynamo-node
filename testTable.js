const DynamoDB = require('./dynamoDB')('./credits.json');
const arg = process.argv[2];

const params = {
  KeySchema: [{ AttributeName: "name", KeyType: "HASH" }],
  AttributeDefinitions: [{ AttributeName: "name", AttributeType: "S" }],
  ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 10 }
};

switch(arg) {
  case 'create':
    DynamoDB
      .select("aws.table.for.testing")
      .createTable(params)
      .then((data) => console.log("Created Test Table"))
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
