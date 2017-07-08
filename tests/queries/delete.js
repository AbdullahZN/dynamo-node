const assert = require('chai').assert;
const expect = require('chai').expect;
const DynamoDB = require('../../index')('eu-central-1');
const Table = DynamoDB.select('aws.table.for.testing');

Table.reset = function () {
    this.resetExpressions();
    this.resetExpressionValueGenerator();
}

const CONDITION_FAIL = 'The conditional request failed';
const newError = () => { throw new Error('should not delete') };
const checkConditionalErr = ({ message }) => assert.include(message, CONDITION_FAIL);

describe('Basic request', function() {
  it('should delete provided key', function() {
    return Table.add({ name: 'J'}).then(() => Table.delete({ name: 'J' }));
  });
})

describe('Conditional requests', function() {

  describe('#if', function() {
    it('should delete if condition is valid', function() {
      return Table.add({ name: 'K', a: 0 })
      .then(() => Table.if('a', '>=', 0).delete({ name: 'K'}));
    });
  })

  describe('#where', function() {
    it('should not delete if condition is not valid', function() {
      return Table.add({ name: 'L', b: 'rest' })
      .then(() => Table.where('b', 'beginsWith', 'r').delete({ name: 'L' }));
    });
  });

});

describe('nested conditionals', function() {
    it('should delete if nested property condition is true', function() {
      return Table.add({ name: 'Erikssen', prono: { a: 0, b: 0 } })
        .then(() => Table.if('prono.a', '=', 0).delete({ name: 'Erikssen' }));
    });
    it('should not delete if nested property condition is false', function() {
      return Table.add({ name: 'Erikssen', prono: { a: 0, b: 0 } })
        .then(() => Table.if('prono.a', '<>', 0).delete({ name: 'Erikssen' }))
        .then(newError).catch(checkConditionalErr);
    });
});
