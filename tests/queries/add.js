const { Table, errors } = require('../test_helpers');

const item = { name: 'newItem' };
const item2 = { name: 'item.item' };

describe('#add', () => {
  before('deletes items if already exists', () =>
    Promise.all([
      Table.delete(item),
      Table.delete(item2),
    ])
  );

  describe('unconditional requests', () => {
    it('succeeds if partition key is valid', () => Table.add(item));
    it('fails otherwise', () =>
      Table
        .add({ a: 0 })
        .then(errors.failure)
        .catch(errors.validation)
    );
    it('should add item with more properties', () =>
      Table.add(Object.assign(item, { level: 5 }))
    );
  });

  describe('conditional requests', () => {
    describe('#exists', () => {
      it('succeeds if exists', () =>
        Table.exists('name')
          .add(item)
      );
      it('fails otherwise', () =>
        Table.exists('name')
          .add({ name: 'idontexist' })
          .then(errors.failure)
          .catch(errors.conditional)
      );
    });

    describe('#notExists', () => {
      it('succeeds if notExists', () =>
        Table.notExists('name')
          .add({ name: 'item.item' })
      );
      it('fails otherwise', () =>
        Table.notExists('name')
          .add(item)
          .then(errors.failure)
          .catch(errors.conditional)
      );
    });
  });
});
