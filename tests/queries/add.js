const assert = require('chai').assert;
const DynamoDB = require('../../index')('eu-central-1');
const Table = DynamoDB.select('aws.table.for.testing');

Table.reset = function () {
    this.resetExpressions();
    this.resetExpressionValueGenerator();
}

const CONDITION_FAIL = 'The conditional request failed';
const newItem = { name: 'newItem' };
const newError = () => { throw new Error('should not add') };
const checkConditionalErr = ({ message }) => assert.include(message, CONDITION_FAIL);

describe('Basic requests', function() {

    it('should add item if only primary key is provided', function() {
        return Table.add(newItem);
    });

    it('should add item with more properties', function() {
        return Table.add(Object.assign(newItem, { level: 5 }));
    });

    it('should not add item if primary key is not provided', function() {
        return Table.add({ noprops: 0 }).then(newError)
            .catch(({ message }) => assert.include(message, 'Missing the key'));
    });

});

describe('conditionals', function() {
    describe('#exists', function() {
        it('should add only if already exists', function() {
            return Table.exists('name').add(newItem);
        });

        it('should fail if trying to override non existing item', function() {
            return Table.exists('name').add({ name: "thisNameDoesNotExists" })
                .then(newError).catch(checkConditionalErr);
        });
    });

    describe('#notExists', function() {
        it('should add only if not exists', function() {
            return Table.notExists('name').add({ name: 'newItem2' })
                .then(() => Table.delete({ name: 'newItem2' }));
        });

        it('should fail if trying to add existing item', function() {
            return Table.notExists('name').add(newItem).then(newError).catch(checkConditionalErr);
        });
    });

});

describe('nested conditionals', function() {
});
