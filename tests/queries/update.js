const { assert, Table, TableComb, errors } = require('../test_helpers');

const abdu = { name: 'abdu' };
const abel = { name: 'abel' };
const array = { name: 'array' };

describe('#update', () => {
  describe('with principal index', () => {
    describe('with partition key only', () => {
      beforeEach('add items to table', () =>
        Table.add({ name: 'abdu', age: 0, bro: 0, wife: 'lat' })
      );
      describe('unconditional requests', () => {
        it('should update item', () =>
          Table.update(abdu, { age: 1, bro: 2 })
            .then(upd => assert.deepEqual(upd, { age: 1, bro: 2 }))
        );
        it("should remove item's attribute", () =>
          Table.removeAttribute(abdu, ['age'])
            .then(upd => assert.deepEqual(upd, { name: 'abdu', bro: 0 }))
        );
        it('fails if attribute does not exists', () =>
          Table.removeAttribute({ name: 'abdu' }, ['col'])
        );
      });
      describe('conditional requests', () => {
        describe('#if', () => {
          it('returns updated params if condition is met', () =>
            Table.if('bro', '<>', 1)
              .update(abdu, { s: 'male' })
              .then(upd => assert.deepEqual(upd, { s: 'male' }))
          );
          it('fails otherwise', () =>
            Table.if('b', '<', 0)
              .update(abdu, { c: 3 })
              .then(errors.failure)
              .catch(errors.conditional)
          );
        });

        describe('#where(,beginsWith,)', () => {
          it('returns updated props if condition', () =>
            Table.where('wife', 'beginsWith', 'la')
              .update(abdu, { age: 0 })
          );
          it('fails otherwise', () =>
            Table.where('name', 'beginsWith', 'marcelo')
              .update(abdu, { age: 1 })
              .then(data => assert.typeOf(data, 'undefined'))
              .catch(errors.conditional)
          );
        });

        describe('#where(,contains,)', () => {
          const key = { name: 'abelz' };
          const item = { name: 'abelz', friends: ['lol', 'fun'], brother: 'lim' };

          before('adds item', () => Table.add(item));

          it('works with strings', () =>
            Table
              .where('brother', 'contains', 'lim')
              .update(key, { b: 0 }, 'OLD')
              .then(olditem => assert.deepEqual(olditem, item))
          );

          it('works with lists', () =>
            Table
              .where('friends', 'contains', 'fun')
              .update(key, { cool: true })
              .then(upd => assert.deepEqual(upd, { cool: true }))
          );

          it('fails if condition unmet', () =>
            Table
              .where('name', 'contains', 'marcel')
              .update(key, { b: 1 })
              .catch(errors.conditional)
          );
        });

        describe('#where(,typeIs,)', () => {
          // We don't need to test primary key for type as it is already handled by DynamoDB
          it('succeeds when condition is met', () =>
            Table.where('a', 'typeIs', 'N').update(item, { c: 0 })
          );
          it('fails otherwise', () =>
            Table.where('b', 'typeIs', 'S').update(item, { c: 1 }).catch(errors.conditional)
          );
        });
      });

    });
  });

  describe('nested conditionals', () => {
    it('updates nested prop', async () => {
      const { children } = await Table.if('prop.a', '=', 0).update(nestedItem, { children: 4 });

      assert.equal(4, children);
    });
  });

  describe('List append and remove', () => {
    it('should add to existing list', async () => {
      const { list } = await Table.addToList({ list: [5] }).update(array);

      assert.equal(5, list[4]);
    });

    it('should remove from list', async () => {
      const item = { name: 'a', list: ['a', 'b', 'c', 'd'] };
      await Table.add(item);

      // should remove first & second item
      const { list } = await Table.removeFromList({ list: [0, 1] }).update(array);

      assert.deepEqual(list, ['c', 'd']);
    });
  });

  describe('Incrementing and Decrementing', () => {
    it('should increment prop', () =>
      Table.increment('a', 1).update(item).then(upd => assert.equal(upd.a, 1))
    );
    it('should increment nested prop', () =>
      Table.increment('prop.a', 1).update(nestedItem).then(upd => assert.equal(upd.prop.a, 1))
    );
    it('should decrement prop', () =>
      Table.decrement('a', 1).update(item).then(upd => assert.equal(upd.a, 0))
    );
    it('should decrement nested prop', () =>
      Table.decrement('prop.a', 1).update(nestedItem).then(upd => assert.equal(upd.prop.a, 0))
    );
  });

  describe('chaining conditions', () => {
    before('adds an item', () => TableComb.add({
      name: 'Alain', age: 64, value: 1, charm: 89, tribe: 'footix'
    }));
    it('can chain multiple conditions', () => TableComb
      .if('age', '<', 100)
      .if('charm', '<>', 0)
      .if('value', '>', -1)
      .update({ name: 'Alain', tribe: 'footix' }, { value: 2 }, 'NEW')
      .then(upd => assert.equal(upd.value, 2)));
  });
});
