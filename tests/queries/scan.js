const { assert, Table, TableComb, errors } = require('../test_helpers');

describe('#scan', () => {
    before('add item', () => Table.add({ name: 'scan' }));

    it('succeeds without params', () => Table.scan());

    it('succeeds with truthy and falsy conditions', async () => {
        // truthy
        const t = await Table.where('name', 'contains', 'can').scan();

        // falsy
        const f = await Table.where('name', 'beginsWith', 't').scan();

        assert.equal(1, t.Count);
        assert.equal(0, f.Count);
    });
});
