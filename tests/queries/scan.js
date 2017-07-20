const assert = require('chai').assert;
const DynamoDB = require('../../index')('eu-central-1');
const Table = DynamoDB.select('aws.table.for.testing');

describe('global scan', function() {
    it('should get all items', function() {
        const newItems = ['a', 'b', 'c', 'd', 'e'];
        newItems.map((item, index) => Table.add({ name: item, age: index }));
        return Promise.all(newItems).then(() => Table.scan())
    });
});
