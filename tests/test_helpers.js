const { assert, expect, should } = require('chai');
const DynamoDB = require('../index')('eu-central-1');

// Test Tables
const Table = DynamoDB.select('aws.table.for.testing');
const TableComb = DynamoDB.select('aws.table.combined.for.testing');

// DynamoDB error codes
const errorCodes = {
  CONDITION : 'ConditionalCheckFailedException',
  VALIDATION: 'ValidationException'
};

// error callbacks
const errors = {
  failure: (d) => {
    throw new Error('assert failed')
  },
  conditional: ({ code }) => {
    assert.include(code, errorCodes.CONDITION);
  },
  validation: ({ code }) => assert.equal(code, errorCodes.VALIDATION)
};

module.exports = {
  assert,
  expect,
  should,
  Table,
  TableComb,
  errors
}
