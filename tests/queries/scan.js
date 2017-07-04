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

    describe('#query()', function() {
        it('should query Conditionally', function(done) {
            Table.add({ name: 'Fred', age: 53 })
                .then(() => Table.scan())
                .then(() => done())
                .catch(done);
        });
    });
