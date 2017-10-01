const AWS = require('aws-sdk');
const ConditionalQueryBuilder = require('./lib/ConditionalQueryBuilder');

const getPromise = func => (method, params) => new Promise((resolve, reject) => {
  func[method](params, (err, data) => (err ? reject(err) : resolve(data)));
});

// Exports DynamoDB function that returns an object of methods
module.exports = (region = 'eu-central-1', config) => {

  AWS.CredentialProviderChain.defaultProviders = [
    function () {
      // if (AWS.ECSCredentials.prototype.isConfiguredForEcsCredentials()) {
      return new AWS.ECSCredentials();
      // }
      // return new AWS.EC2MetadataCredentials();
    },
    function () { return new AWS.EnvironmentCredentials('AWS'); },
    function () { return new AWS.SharedIniFileCredentials(); }
  ];

  var chain = new AWS.CredentialProviderChain();

  chain.resolve((err, cred)=>{
    AWS.config.credentials = cred;
  })

  AWS.config.update({ region });
  if (typeof config === 'string') {
    AWS.config.loadFromPath(config);
  } else if (typeof config === 'object') {
    AWS.config.update(config);
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
