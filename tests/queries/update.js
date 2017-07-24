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
    it("should remove item's attribute", function() {
      return Table.removeAttribute({ name: 'abdu' }, [ 'a' ])
        .then(upd => assert.notDeepInclude(upd, { a: 0 }));
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
      it("succeeds when condition is met", () =>
        Table.where('name', 'contains', 'abd').update(item, { b: 0 })
      );
      it("should not update item if name doesn't contain 'abel'", () =>
        Table.where('name', 'contains', 'marcelo').update(item, { b: 1 })
          .catch(errors.conditional).then((data) => assert.typeOf(data, 'undefined'))
      );
    });

    describe('#where(,typeIs,)', () => {
      // We don't need to test primary key for type as it is already handled by DynamoDB
      it('succeeds when condition is met', () =>
        Table.where('a', 'typeIs', 'N').update(item, { c: 0 })
      );
      it('fails otherwise', () =>
        Table.where('b', 'typeIs', 'S').update(item, { c: 1 })
          .catch(errors.conditional).then((data) => assert.typeOf(data, 'undefined'))
      );
    });
  });

  describe('nested conditionals', () => {
    it('should update nested object if condition is true', () =>
      Table.if('prop.a', '=', 0).update(nestedItem, { children: 4 })
        .then(upd => assert.equal(upd.children, 4))
    );
  });

  describe('List append and remove', () => {
    it('should add to existing list', () =>
      Table.addToList({ list: [5] }).update(array).then(upd => assert.equal(upd.list[4], 5))
    );
    it('should remove from list', () =>
      // should remove first & second item
      Table.removeFromList({ list: [0, 1] }).update(array).then(upd => {
        assert.notInclude(upd.list, [0, 1]);
        assert.equal(upd.list[0], 2);
      })
    );
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

});
