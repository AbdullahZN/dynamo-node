const { assert } = require('chai');

const dyn = require('../../index');
const conf = require('./conf.json');

describe('init module', () => {
  it('uses conf file if AWS_ACCESS_KEY_ID is not set', () => {
    delete process.env.AWS_ACCESS_KEY_ID;
    const dynamo = dyn('eu-central-1', `${__dirname}/conf.json`);
    assert.equal(dynamo.config.credentials.accessKeyId, conf.accessKeyId);
  });

  it('preferes AWS_ACCESS_KEY_ID over conf file', () => {
    process.env.AWS_ACCESS_KEY_ID = 'test-env-var';
    const dynamoEnv = dyn('us-west-1', `${__dirname}/conf.json`);
    assert.equal(dynamoEnv.config.credentials.accessKeyId, 'test-env-var');
  });

});
