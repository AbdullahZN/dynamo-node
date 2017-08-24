const { assert, Table, TableComb, errors } = require('../test_helpers');

const item = { name: 'abdu' };
const updateParams = { a: 0, b: 0 };

const nestedItem = { name: 'abel'};
const nestedParams = Object.assign({ prop: { a: 0, b: 0 } }, nestedItem);

const array = { name: 'Array' };
const arrayParams = Object.assign({ list: [ 0, 1, 2, 3 ] }, array);

describe('#update', () => {
  before('add items to table', () => {
    return Promise.all([
      Table.add(item),
      Table.add(nestedParams),
      Table.add(arrayParams)
    ]);
  });

  describe('unconditional requests', () => {
    it('should update item', () => {
      return Table.update(item, { a: 0, b: 0 })
        .then(upd => assert.deepInclude(upd, { a: 0, b: 0 }));
    });
    it("should remove item's attribute", () => {
      return Table.removeAttribute({ name: 'abdu' }, [ 'a' ])
        .then(upd => assert.notDeepInclude(upd, { a: 0 }));
    });
    it('fails if attribute does not exists', () => {
      return Table.removeAttribute({ name: 'abdu' }, [ 'col' ]);
    });
  });

  describe('conditional requests', () => {

    describe('#if', () => {
      it('succeeds if condition is met', () =>
        Table.if('b', '<>', 1).update(item, { c: 3, s: 'male' })
          .then(upd => assert.deepInclude(upd, {c: 3, s: 'male' }))
      );
      it('fails otherwise', () =>
        Table.if('b', '<', 0).update(item, { c: 3 })
          .then(errors.failure).catch(errors.conditional)
      );
    });

    describe('#where(,beginsWith,)', () => {
      it('succeeds when condition is met', () =>
        Table.where('name', 'beginsWith', 'ab').update(item, { a: 0 })
      );
      it('fails otherwise', () =>
        Table.where('name', 'beginsWith', 'marcelo').update(item, { a: 1 })
          .then((data) => assert.typeOf(data, 'undefined')).catch(errors.conditional)
      );
    });

    describe('#where(,contains,)', () => {
        const key = { name: 'abelz' };
        const item = { name: 'abelz', friends: [ 'lol', 'fun' ], brother: 'lim' };

        before('adds item', () => Table.add(item) );

        it("works with strings", () => {
            return Table
                .where('brother', 'contains', 'lim')
                .update(key, { b: 0 }, 'OLD')
                .then(olditem => assert.deepEqual(olditem, item));
        });

        it("works with lists", async () => {
            Table.where('friends', 'contains', 'fun');

            assert.deepEqual({ cool: true }, await Table.update(key, { cool: true }));
        });

        it("fails if condition unmet", () => {
            return Table
                .where('name', 'contains', 'marcel')
                .update(key, { b: 1 })
                .catch(errors.conditional);
        });
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
            // should remove first & second item
            const { list } = await Table.removeFromList({ list: [0, 1] }).update(array);

            assert.notInclude(list, [0, 1]);
            assert.equal(list[0], 2);
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
        it('can chain multiple conditions', () => {
            return TableComb
                .if('age', '<', 100)
                .if('charm', '<>', 0)
                .if('value', '>', -1)
                .update({ name: 'Alain', tribe: 'footix' }, { value: 2 }, 'NEW')
                .then(upd => assert.equal(upd.value, 2));
        });
    });

});
