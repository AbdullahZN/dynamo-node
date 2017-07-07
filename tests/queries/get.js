const assert = require('chai').assert;
const expect = require('chai').expect;
const DynamoDB = require('../../index')('eu-central-1');
const Table = DynamoDB.select('aws.table.for.testing');

Table.reset = function () {
    this.resetExpressions();
    this.resetExpressionValueGenerator();
}

const CONDITION_FAIL = 'The conditional request failed';

describe('conditionals', function() {
    Table.add({ name: 'Fred', age: 45 });
    Table.add({ name: 'Baguette', type: 'bread' });

    it('should update if condition is valid', function() {
        return Table.if('age', '>', 43).update({ name: 'Fred'}, { f: 3, s: 'male' })
            .then(updated => assert.deepEqual(updated, {f: 3, s: 'male' }));
    });

    it('should not update if condition is not valid', function() {
        return Table.where('type', 'beginsWith', 'xxx').update({ name: 'Baguette'}, { type: 'noBread' })
            .then(() => { throw new Error('should not update !'); })
            .catch((err) => assert.include(err.message, CONDITION_FAIL));
    });

});

describe('nested conditionals', function() {
    Table.add({ name: 'Eric', prono: { a: 0, b: 0 } });
    it('should update nested object if condition is true', function() {
        return Table.if('prono.a', '=', 0).update({ name: 'Eric'}, { children: 4 })
            .then(updated => assert.equal(updated.children, 4));
    });
});

describe('List append and remove', function() {
    const array = { name: 'Array' };
    Table.add({ name: 'Array', list: [ 0, 1, 2, 3 ] });

    it('should add to existing list', function() {
        return Table.addToList({ list: [5] }).update(array)
            .then((updated) => assert.equal(updated.list[4], 5));
    });

    it('should remove from list', function() {
        // should remove first & second item
        return Table.removeFromList({ list: [0, 1] }).update(array)
            .then((updated) => {
                assert.notInclude(updated.list, [0, 1]);
                assert.equal(updated.list[0], 2);
            });
    });
});

describe('Incrementing and Decrementing', function() {
    const sandwich = { name: 'sandwich' };
    Table.add({ name: 'sandwich', buyers: 5, ingredients: { flour: 0, cheese: 150 } });

    it('should increment param from 5 to 6', function() {
        return Table.increment('buyers', 1).update(sandwich)
            .then(updated => assert.equal(updated.buyers, 6));
    });

    it('should increment nested param from 0 to 1', function() {
        return Table.increment('ingredients.flour', 1).update(sandwich)
            .then(updated => assert.equal(updated.ingredients.flour, 1));
    });

    it('should decrement param from 6 to 1', function() {
        return Table.decrement('buyers', 5).update(sandwich)
            .then(updated => assert.equal(updated.buyers, 1));
    });

    it('should decrement nested param from 150 to 147', function() {
        return Table.decrement('ingredients.cheese', 3).update(sandwich)
            .then(updated => assert.equal(updated.ingredients.cheese, 147));
    });

});
