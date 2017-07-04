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
            Table.if('age', '>', 43)
                .update({ name: 'Fred'}, {age: 3, sex: 'male' })
                .then(() => {
                    Table.delete({ name: 'Fred' });
                    done();
                }).catch(done);
        });
    });
