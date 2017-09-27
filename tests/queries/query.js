const { assert, Table, TableComb, errors } = require('../test_helpers');

const item = { name: 'query-a', age: 5 };
const itemWithList = { name: 'query', age: 1, status: 3, gf: 'lat' };

describe('#query', () => {
  before(() =>
    Promise.all([
      Table.add(item),
      Table.add(itemWithList),
    ])
  );

  describe('with partition key only', () => {
    describe('with principal index', () => {
      it('returns item with keyCondition only', () =>
        Table.query('name', '=', 'query-a')
          .then((result) => {
            assert.property(result, 'Items');
            assert.deepEqual(result.Items, [item]);
          })
      );
      it('returns item with a single FilterExpression', () =>
        Table.if('age', '=', 5)
          .query('name', '=', 'query-a')
          .then((result) => {
            assert.propertyVal(result, 'Count', 1);
            assert.deepEqual(result.Items, [item]);
          })
      );
      it('returns item with more FilterExpressions', () =>
        Table.if('age', '=', 1)
          .where('gf', 'contains', 'la')
          .query('name', '=', 'query')
          .then((result) => {
            assert.propertyVal(result, 'Count', 1);
            assert.deepEqual(result.Items, [itemWithList]);
          })
      );
      it('returns empty array if FilterExpression does not match any item', () =>
        Table.if('age', '=', 3)
          .query('name', '=', 'query-a')
          .then((result) => {
            assert.propertyVal(result, 'Count', 0);
            assert.deepEqual(result.Items, []);
          })
      );
      it('returns item if attribute matches list', () =>
        Table.inList('status', [1, 2, 3])
          .query('name', '=', 'query')
          .then((result) => {
            assert.propertyVal(result, 'Count', 1);
            assert.deepEqual(result.Items, [itemWithList]);
          })
      );
      it('returns empty array if attribute does not match list', () =>
        Table.inList('status', [5])
          .query('name', '=', 'query')
          .then((result) => {
            assert.propertyVal(result, 'Count', 0);
            assert.deepEqual(result.Items, []);
          })
      );
      it('returns items within limit range', async () => {
        const newItems = [
          ['a', 2],
          ['b', 2],
          ['c', 2],
          ['d', 2]
        ].map(([name, age]) => Table.add({ name, age }));
        await Promise.all(newItems);
        return Table
          .useIndex('age-index')
          .limit(2)
          .query('age', '=', 2)
          .then(({ Count }) => assert.equal(2, Count));
      });
      it('returns only projected attributes', async () => {
        await Table.project('status')
          .query('name', '=', 'query')
          .then((result) => {
            assert.property(result, 'Items');
            assert.deepEqual(result.Items, [{ status: 3 }]);
          });
        await Table.project(['status', 'name'])
          .query('name', '=', 'query')
          .then((result) => {
            assert.property(result, 'Items');
            assert.deepEqual(result.Items, [{ status: 3, name: 'query' }]);
          });
      });
    });

    describe('with secondary index', () => {
      it('works with keyCondition only', () =>
        Table.useIndex('age-index')
          .query('age', '=', 5)
          .then((result) => {
            assert.propertyVal(result, 'Count', 1);
            assert.deepEqual(result.Items, [item]);
          })
      );
      it('returns filtered item', () =>
        Table.useIndex('age-index')
          .if('name', '=', 'query-a')
          .query('age', '=', 5)
          .then((result) => {
            assert.propertyVal(result, 'Count', 1);
            assert.deepEqual(result.Items, [item]);
          })
      );

      it('fails with wrong secondary index', () =>
        Table.useIndex('age-')
          .query('name', '=', 'query-a')
          .then(errors.failure)
          .catch(errors.validation)
      );
    });
  });
});
