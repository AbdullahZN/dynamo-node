const { assert, Table, TableComb, DynamoDB, errors } = require('../test_helpers');

const abdu = { name: 'abdu' };

describe('#update', () => {
  describe('with principal index', () => {
    describe('with partition key only', () => {
      beforeEach('add items to table', () =>
        Table.add({ name: 'abdu', age: 0, bro: 0, wife: 'lat' })
      );
      describe('unconditional requests', () => {
        it('should update item', () =>
          Table.update(abdu, { age: 1, bro: 2 })
            .then(upd => assert.deepInclude(upd, { age: 1, bro: 2 }))
        );
        it("should remove item's attribute", () =>
          Table.removeAttribute(abdu, ['age'])
            .then(upd => assert.deepInclude(upd, { name: 'abdu', bro: 0 }))
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

          before('adds item', () =>
            Table.add(item)
          );

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
          const item = { name: 'anItem' };
          before('adds item to DB', () =>
            Table.add({ name: 'anItem', a: 1, b: 2 })
          );

          // We don't need to test primary key for type as it is already handled by DynamoDB
          it('succeeds when condition is met', () =>
            Table
              .where('a', 'typeIs', 'N')
              .update(item, { c: 0 })
          );
          it('fails otherwise', () =>
            Table
              .where('b', 'typeIs', 'S')
              .update(item, { c: 1 })
              .then(errors.failure)
              .catch(errors.conditional)
          );
        });
      });
    });
  });

  describe('nested conditionals', () => {
    before('add item', () =>
      Table.add({ name: 'abdu', prop: { a: 0 } })
    );

    it('updates nested prop', () =>
      Table
        .if('prop.a', '=', 0)
        .update({ name: 'abdu' }, { children: 4 })
        .then(({ children }) => assert.equal(4, children))
    );
  });

  describe('List append and remove', () => {
    const ingredients = { name: 'ingredients' };
    const ingredientList = ['coconut', 'olive'];
    const newIngredients = ['cocoa', 'fish'];

    beforeEach('adds item to DB', () =>
      Table.add({ name: 'ingredients', list: ingredientList })
    );

    it('concats new list items to existing list attribute', () =>
      Table
        .addToList({ list: newIngredients })
        .update(ingredients)
        .then(({ list }) => assert.deepEqual(
          ingredientList.concat(newIngredients), list)
        )
    );

    it('does not add new item if attribute is a Set', async () => {
      const seth = { name: 'seth' };
      const children = DynamoDB.createSet(['a', 'b']);

      await Table.add({ name: 'seth', children });
      return Table.addToSet({ children: ['c'] })
        .update(seth)
        .then(upd => assert.deepEqual(['a', 'b', 'c'], upd.children.values));
    });

    /**
     * Removes element at index 1
     * We have to query for NEW return values,
     * as removed attributes do not appear in the UPDATED attribute list
     */
    it('should remove from list', () =>
      Table
        .removeFromList({ list: [1] })
        .update(ingredients, null, 'NEW')
        .then(({ list }) => assert.deepEqual(['coconut'], list))
    );
  });

  describe('Incrementing and Decrementing', () => {
    const item = { name: 'inc' };
    const props = { a: 6, p: { q: 100 } };

    beforeEach('adds item to DB', () =>
      Table.add(Object.assign({}, item, props))
    );
    it('should increment prop', () =>
      Table
        .increment('a', 1)
        .update(item)
        .then(upd => assert.equal(upd.a, props.a + 1))
    );
    it('should increment nested prop', () =>
      Table
        .increment('p.q', 36)
        .update(item)
        .then(({ p }) => assert.equal(p.q, props.p.q + 36))
    );
    it('should decrement prop', () =>
      Table
        .decrement('a', 14)
        .update(item)
        .then(upd => assert.equal(upd.a, props.a - 14))
    );
    it('should decrement nested prop', () =>
      Table
        .decrement('p.q', 58)
        .update(item)
        .then(({ p }) => assert.equal(p.q, props.p.q - 58))
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
