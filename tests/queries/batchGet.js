const { assert, Table, errors } = require('../test_helpers');

const item  = { name: 'myItem'  };
const item2 = { name: 'myItem2' };
const item3 = { name: 'myItem3' };
const item4 = { name: 'myItem4' };

describe('#batchGet', () => {

    before('adds item to DB', () => {
        Table.add(item);
        Table.add(item2);
        Table.add(item3);
        Table.add(item4);
    });

    describe('simple query', () => {
        const batchGet = {
            'aws.table.for.testing': {
                Keys: { 'name': ['myItem', 'myItem2', 'myItem3', 'myItem4'] }
            }
        };
        const expected = [ item, item2, item3, item4 ];

        it('should get multiple items from DB', () => {
            return Table.batchGet(batchGet).then(data => {
                assert.includeDeepMembers(expected, data['aws.table.for.testing']);
            });
        });
    });
});
