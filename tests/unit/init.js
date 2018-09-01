const { assert } = require('chai');

const dyn = require('../../index');
const conf = require('./conf.json');

describe('init module', () => {
  it('uses conf file if DYNAMO_ENV is not set', () => {
    delete process.env.DYNAMO_ENV;
    const dynamo = dyn('eu-central-1', `${__dirname}/conf.json`);
    assert.equal(dynamo.config.credentials.accessKeyId, conf.accessKeyId);
  });

  it('preferes DYNAMO_ENV over conf file', () => {
    process.env.DYNAMO_ENV = 'test';
    const dynamoEnv = dyn('us-west-1', `${__dirname}/conf.json`);
    assert.equal(dynamoEnv.config.credentials.accessKeyId, 'test');
  });

  it('uses DYNAMO_ENV if no conf file', () => {
    process.env.DYNAMO_ENV = 'test';
    const dynamoTest = dyn();
    assert.equal(dynamoTest.config.credentials.accessKeyId, 'test');
  });
});
