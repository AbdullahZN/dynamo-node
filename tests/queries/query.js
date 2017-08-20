const { assert, Table, TableComb, errors } = require('../test_helpers');

// Item Keys
const key = { name: 'a' };
const keys = { name: 'a', tribe: 'yt' };

describe('#query', () => {
  before(() => {
    return Table.add({ name: 'a', age: 5, p:1 });
  });

  it('succeeds with simple query', () => {
    return Table.query('name', '=', 'a');
  });

  it('succeeds with secondary index', () => {
    return Table.useIndex('age-index').query('age', '=', 5);
  });

  it('returns filtered item with primary index', () => {
    return Table.if('age', '=', 5).query('name', '=', 'a')
      .then(({ Count }) => assert.equal(Count, 1));
  });

  it('returns 0 item if condition is unmet', () => {
    return Table.if('age', '=', 3).query('name', '=', 'a')
      .then(({ Count }) => assert.equal(Count, 0));
  });

  it('returns filtered item by secondary index', () => {
    return Table.useIndex('age-index').if('name', '=', 'a').query('age', '=', 5)
    .then(({ Count }) => assert.equal(Count, 1));
  });

  it('fails with unexisting secondary index', () => {
    return Table.useIndex('age-').query('name', '=', 'a')
      .then(errors.failure).catch(errors.validation);
  });
});
