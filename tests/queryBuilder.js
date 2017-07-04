const assert = require('chai').assert;
const DynamoDB = require('../index')('eu-central-1');
const Table = DynamoDB.select('aws.table.for.testing');

Table.reset = function () {
    console.log(this.ConditionExpression, this.ExpressionValues);
    this.ConditionExpression = [];
    this.ExpressionValues = {};
    this.ExpressionNames = {};
    this.resetExpressionValueGenerator();
}

describe('DynamoDB Conditional Expression Builder', function() {

    describe('#where()', function(){
        it('should write expression values corresponding to expression condition attributes', function() {
            Table.where('a', 'beginsWith', '0');
            Table.where('c', 'contains', '1');
            Table.where('e', 'typeIs', '2');
            assert.include(Table.ConditionExpression, 'begins_with(a, :a)');
            assert.include(Table.ConditionExpression, 'contains(c, :b)');
            assert.include(Table.ConditionExpression, 'attribute_type(e, :c)');
            assert.equal(Table.ExpressionValues[':a'], 0);
            assert.equal(Table.ExpressionValues[':b'], 1);
            assert.equal(Table.ExpressionValues[':c'], 2);
            Table.reset();
        });
    });

    describe('#notExists()', function(){
        it('should execute without error', function(done) {
            Table.notExists('nonexistingprop').add({ name: 'Abdu', prono: 'hellox' })
                .then(() => done())
                .catch(done);
            Table.delete({ name: 'Abdu' });
        });
    });

    describe('#if()', function() {
            it('creates Condition, Values, Names for Expression', function() {
                ['a = 0', 'b <> 43', 'c < 6'].forEach(condition => {
                    Table.if( ...(condition.split(' ')) );
                });
                const expectedCondition = ['#a = :a', '#b <> :b', '#c < :c'];
                assert.deepEqual(Table.ConditionExpression, expectedCondition);
                assert.deepEqual(Table.ExpressionValues, {':a':'0', ':b':'43', ':c':'6'});
                assert.deepEqual(Table.ExpressionNames, {'#a':'a', '#b':'b', '#c':'c'});
                Table.reset();
            });
    });

    describe('#if().add()', function() {
        it('addItem if condition is evaluated to true', function(done) {
            Table.add({ name: 'Abdu', age: 33 }).then(() => {
                return Table.exists('age')
                    .if('age', '>', 32)
                    .add({ name: 'Abdu', age: 5346 })
            }).then(() => done()).catch(done);
        });

        it('can not add if not exists', function(done) {
            Table.delete({ name: 'Abdu' }).then(() => {
                return Table.exists('age').if('age', '<', 0)
                    .add({ name: 'Abdu', age: 342 })
            }).then(() => done(new Error)).catch(() => done());
        });
    });

});
