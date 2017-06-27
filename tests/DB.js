const assert = require('chai').assert;
const DynamoDB = require('../dynamoDB')('./credits.json');

describe('DynamoDB', function() {
    describe('#select(TableName)', function(){
        const Table = DynamoDB.select('aws.table.for.testing');
        it('should return object', function(){
            assert.typeOf(Table, 'object');
        });
        it('should return provided TableName', function() {
            assert.equal(Table.getTableName(), "aws.table.for.testing");
        });
        it('should return object of query methods', function(){
            assert.typeOf(Table.add, 'function');
        });
    });
});
