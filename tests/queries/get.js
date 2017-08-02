const { assert, Table, TableComb, errors } = require('../test_helpers');

// Item Keys
const key = { name: 'a' };
const keys = { name: 'a', tribe: 'yt' };

describe('#get', function() {
    before('Adding items to table beforehand', function() {
        return Promise.all([
            Table.add(key),
            TableComb.add(keys)
        ]);
    });
<<<<<<< HEAD

=======
>>>>>>> dca0840b5e9cf735c24e53f1dbfafe545d53b70a
    describe('with partition key only', () => {
        it('succeeds with right partition key', () => Table.get(key));
        it('fails with wrong partition key', () =>
            Table.get({a: 0}).then(errors.failure).catch(errors.validation)
        );
    });
<<<<<<< HEAD

=======
>>>>>>> dca0840b5e9cf735c24e53f1dbfafe545d53b70a
    describe('with partition and range key', () => {
        it('succeeds with right key combination', () => TableComb.get(keys));
        it('fails with wrong combination', () =>
            TableComb.get({a:0, g:9}).then(errors.failure).catch(errors.validation)
        );
<<<<<<< HEAD
    });

    after(() => {
        Table.delete(key);
        TableComb.delete(keys);
=======
>>>>>>> dca0840b5e9cf735c24e53f1dbfafe545d53b70a
    });
});
