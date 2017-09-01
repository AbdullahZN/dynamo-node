const AWS = require('aws-sdk');
const ConditionalQueryBuilder = require('./lib/ConditionalQueryBuilder');

const getPromise = func => (method, params) => new Promise((resolve, reject) => {
  func[method](params, (err, data) => (err ? reject(err) : resolve(data)));
});

// Exports DynamoDB function that returns an object of methods
module.exports = (region = 'eu-central-1', configPath) => {
  if (process.env.DYNAMO_ENV === 'test') {
    AWS.config.update({
      region,
      apiVersion: '2012-08-10',
      accessKeyId: process.env.DYNAMO_ENV,
      secretAccessKey: process.env.DYNAMO_ENV,
      endpoint: 'http://localhost:8000',
    });
  } else if (configPath) {
    AWS.config.loadFromPath(configPath);
  }

  // gets docClient function to return promise
  const dynamoDB = new AWS.DynamoDB();
  const db = getPromise(dynamoDB);
  const doc = getPromise(new AWS.DynamoDB.DocumentClient());

  return {
    config: dynamoDB.config,

    // Select Table and return method object for further queries
    select: TableName => new ConditionalQueryBuilder(TableName, doc, db),
  };
};
