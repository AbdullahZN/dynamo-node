const { assert, Table, TableComb, errors } = require('../test_helpers');

const item = { name: 'newItem' };

describe('#add', () => {
    describe('unconditional requests', () => {
      it('succeeds if partition key is valid', () => Table.add(item));
      it('fails otherwise', () =>
          Table.add({ a: 0 }).then(errors.failure).catch(errors.validation)
      );
      it('should add item with more properties', () =>
          Table.add(Object.assign(item, { level: 5 }))
      );
    });

    describe('conditional requests', () => {
        describe('#exists', () => {
            it('succeeds if exists', () => Table.exists('name').add(item));
            it('fails otherwise', () =>
                Table.exists('name').add({ name: "idontexist" })
                    .then(errors.failure).catch(errors.conditional)
            );
        });

        describe('#notExists', () => {
            it('succeeds if notExists', () => Table.notExists('name').add({ name: 'item.item' }));
            it('fails otherwise', () =>
                Table.notExists('name').add(item).then(errors.failure).catch(errors.conditional)
            );
        });

    });

    after('delete items', () => {
        Table.delete({ name: 'item.item' });
    })
});
