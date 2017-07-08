const assert = require('chai').assert;
const expect = require('chai').expect;
const DynamoDB = require('../../index')('eu-central-1');
const Table = DynamoDB.select('aws.table.for.testing');

Table.reset = function () {
    this.resetExpressions();
    this.resetExpressionValueGenerator();
}

const CONDITION_FAIL = 'The conditional request failed';
const newError = () => { throw new Error('should not get') };
const checkConditionalErr = ({ message }) => assert.include(message, CONDITION_FAIL);

describe('Basic request', function() {
    it('should return item', function() {
        return Table.add({ name: 'a' }).then(() => Table.get({ name: 'a' }));
    });
})
