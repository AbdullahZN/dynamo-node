const assert = require('chai').assert;
const DynamoDB = require('../../index')('eu-central-1');
const Table = DynamoDB.select('aws.table.for.testing');

Table.reset = function () {
    console.log(this.ConditionExpression, this.ExpressionValues);
    this.ConditionExpression = [];
    this.ExpressionValues = {};
    this.ExpressionNames = {};
    this.resetExpressionValueGenerator();
}

    describe('#update()', function() {
        it('should update conditionally', function(done) {
            Table.add({ name: 'Fred', age: 45 }).then(() => {
                return Table.if('age', '>', 43)
                .update({ name: 'Fred'}, {age: 3, sex: 'male' });
            }).then(() => {
                Table.delete({ name: 'Fred' });
                done();
            }).catch(done);
        });

        it('should update nested object if condition is true', function(done) {
            Table
            .add({ name: 'Eric', prono: { a: 0, b: 0 } })
            .then(() => {
                return Table.if('prono.a', '=', 0).update({ name: 'Eric'}, {
                    age: 3,
                    sex: 'male',
                    children: 4
                });
            }).then(() => {
                    Table.delete({ name: 'Eric' });
                    done();
            }).catch(done);
        });

        it('should not update if condition is false', function(done) {
            Table
            .add({ name: 'Baguette', type: 'bread' })
            .then(() => {
                return Table.where('type', 'beginsWith', 'xxx')
                    .update({ name: 'Baguette'}, { type: 'noBread' });
            })
            .then(() => done(new Error('should not update !')))
            .catch(() => {
                //Table.delete({ name: 'Fred' });
                done();
            });
        });

        it('should add to existing list', function(done) {
            Table
            .add({ name: 'Array', list: [ 0, 1, 2, 3 ] })
            .then(() => {
                return Table.addToList({ list: [5] }).update({ name: 'Array' });
            }).then((updated) => { done() }).catch(done);
        });

        it('should remove from list', function(done) {
            // should remove first & second item
            Table.removeFromList({ list: [0, 1] })
                .update({ name: 'Array' })
                .then(() => done()).catch(done);
        });

    });
