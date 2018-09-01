process.env.DYNAMO_ENV = 'test';

const DynamoDB = require('./index')('eu-central-1');

const baseParams = {
  ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
};

const params = {
  KeySchema: [{ AttributeName: 'name', KeyType: 'HASH' }],
  AttributeDefinitions: [
    { AttributeName: 'name', AttributeType: 'S' },
    { AttributeName: 'age', AttributeType: 'N' },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'age-index',
      KeySchema: [
        { AttributeName: 'age', KeyType: 'HASH' },
      ],
      Projection: {
        ProjectionType: 'ALL',
      },
      ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
    },
  ],
};

const combinedParams = {
  KeySchema: [
    { AttributeName: 'name', KeyType: 'HASH' },
    { AttributeName: 'tribe', KeyType: 'RANGE' },
  ],
  AttributeDefinitions: [
    { AttributeName: 'name', AttributeType: 'S' },
    { AttributeName: 'tribe', AttributeType: 'S' },
  ],
};

switch (process.argv[2]) {
  case 'create':
    DynamoDB
      .select('aws.table.for.testing')
      .createTable(Object.assign(params, baseParams))
      .then(() => console.log('Created Test Table with primary key'))
      .catch(err => console.log(err.message.split('\n')[0]));

    DynamoDB
      .select('aws.table.combined.for.testing')
      .createTable(Object.assign(combinedParams, baseParams))
      .then(() => console.log('Created Test Table with primary and range key'))
      .catch(err => console.log(err.message.split('\n')[0]));
    break;
  case 'delete':
    DynamoDB
      .select('aws.table.for.testing')
      .deleteTable()
      .then(() => console.log('Deleted Test Table'))
      .catch(err => console.log(err.message.split('\n')[0]));

    DynamoDB
      .select('aws.table.combined.for.testing')
      .deleteTable()
      .then(() => console.log('Deleted Test Table combined'))
      .catch(err => console.log(err.message.split('\n')[0]));
    break;
  default:
    const cmd = process.argv[0].split('/').splice(-1).join();
    const opr = process.argv[1].split('/').splice(-1).join();
    console.log(`Usage: ${cmd} ${opr} <operation>\nAvailable operations: create, delete`);
}
