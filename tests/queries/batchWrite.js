let { assert, expect, Table, TableComb, errors } = require('../test_helpers');

const item1 = { name: 'batchItem1' };
const item2 = { name: 'batchItem2' };
const item3 = { name: 'bI3', a: 0, b: [1] };

describe('#batchWrite', () => {

    describe('batchPut/batchWrite', () => {
        const batchPut = { 'aws.table.for.testing': [ item1, item2, item3 ] };

        it('should put multiple items to DB using batchPut', () => {
            return Table.batchPut(batchPut).then(data => {
                assert.deepEqual({}, data.UnprocessedItems);
            });
        });

        it('should put multiple items to DB using batchWrite', () => {
            return Table.batchWrite(batchPut).then(data => {
                assert.deepEqual({}, data.UnprocessedItems);
            });
        });

        it('should fail if item has no primary key provided', () => {
            const unvalidParams = {
                'aws.table.for.testing': [ { a: 1 }, { name: "a" } ]
            };
            return Table.batchPut(unvalidParams)
                .then(errors.failure).catch(errors.validation);
        });
    });

    describe('batchDelete', () => {
        const batchDelete = { 'aws.table.for.testing': [ item1, item2 ] };
        it('should delete multiple items from DB', () => {
            return Table.batchDelete(batchDelete).then(data => {
                assert.deepEqual({}, data.UnprocessedItems);
            });
        });

        it('should not delete unexisting items', () => {
            return Table.batchDelete({ 'aws.table.for.testing': [ { name: "&" } ] });
        })
    });

});
