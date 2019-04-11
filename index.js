const AWS = require('aws-sdk');
const ConditionalQueryBuilder = require('./lib/ConditionalQueryBuilder');

const getPromise = func => (method, params) => new Promise((resolve, reject) => {
  func[method](params, (err, data) => (err ? reject(err) : resolve(data)));
});

// Exports DynamoDB function that returns an object of methods
module.exports = (region = 'eu-central-1', config) => {
  AWS.config.update({ region });
  if (process.env.DYNAMO_ENV === 'test') {
    AWS.config.update({
      apiVersion: '2012-08-10',
      accessKeyId: 'test',
      secretAccessKey: 'test',
      endpoint: process.env.DYNAMO_URI || 'http://localhost:8000',
    });
  } else if (config) {
    if (typeof config === 'string') {
      AWS.config.loadFromPath(config);
    } else if (typeof config === 'object') {
      AWS.config.update(config);
    }
  }

  const dynamoDB = new AWS.DynamoDB();
  if (!dynamoDB.config.credentials) {
    throw new Error('Can not load AWS credentials');
  }

  const docClient = new AWS.DynamoDB.DocumentClient();
  const db = getPromise(dynamoDB);
  const doc = getPromise(docClient);

  return {
    config: dynamoDB.config,

    // Select Table and return method object for further queries
    select: TableName => new ConditionalQueryBuilder(TableName, {
      docClient,
      doc,
      db,
    }),

    createSet: params => docClient.createSet(params),
  };
};
