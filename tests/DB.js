const assert = require('assert');
const DynamoDB = require('../dynamoDB')();

describe('DynamoDB', function() {
    describe('#select(TableName)', function(){
        const Table = DynamoDB.select('aws.table.for.testing');
        it('should return object', function(){
            assert(typeof Table === 'object');
        });
        it('should return provided TableName', function() {
            assert(Table.getTableName() === "aws.table.for.testing");
        });
        it('should return object of query methods', function(){
            assert(Table.hasOwnProperty('add'));
            assert(typeof Table.add === 'function');
        });
    });
});
