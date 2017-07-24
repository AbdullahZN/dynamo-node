const { assert, Table, TableComb, errors } = require('../test_helpers');

// Item keys
const key = { name: 'J' };
const keys = { name: 'K', tribe: 'jacksons' };

// Items
const item = Object.assign({ age: 9, nested: { object: 0 } }, key);
const itemComb = Object.assign({ age: 9, nested: { object: 0 } }, keys);

describe('#delete', () => {

    beforeEach('Adding items to table beforehand', () =>
        Promise.all([ Table.add(item) ])
    );

    describe('unconditional request', () => {
      it('succeeds with valid key', () => Table.delete(key));
      it('fails with unvalid key', () =>
        Table.delete({ a: 0 }).then(errors.failure).catch(errors.validation)
      );
    });

    describe('conditional requests', () => {
      it('succeeds if condition is met', () => Table.if('age', '>', 6).delete(key));
      it('fails otherwise',       () =>
        Table.if('age', '<>', 9).delete(key).then(errors.failure).catch(errors.conditional)
      );
    });

    describe('nested conditional requests', () => {
      it('succeeds if condition is met', () => Table.if('nested.object', '=', 0).delete(key));
      it('fails otherwise', () =>
        Table.if('nested.object', '>', 0).delete(key).then(errors.failure).catch(errors.conditional)
      );
    });

});
