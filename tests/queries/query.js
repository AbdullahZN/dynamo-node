const { assert, Table, TableComb, errors } = require('../test_helpers');

// Item Keys
const key = { name: 'a' };
const keys = { name: 'a', tribe: 'yt' };

describe('#query', () => {
  before(() => Table.add({ name: 'a', age: 5 }));

  it('succeeds with simple query', () => {
    return Table.query('name', '=', 'a');
  });

  it('succeeds with secondary index', () => {
    return Table.useIndex('age-index').query('age', '=', 5);
  });

  it('fails with unexisting secondary index', () => {
    return Table.useIndex('age-').query('name', '=', 'a')
      .then(errors.failure).catch(errors.validation);
  });

  after(() => Table.delete(key));
});
