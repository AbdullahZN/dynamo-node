const assert = require('assert');
const DynamoDB = require('../dynamoDB')();
Promise.fail = require('promise-fail');

describe('DynamoDB Table', function() {
    const UnexistingTable = DynamoDB.select('UnexistingTable');
    const ExistingTable = DynamoDB.select('aws.table.for.testing');

    describe('if Table does not exist', function() {
        it('should fail on all CRUD Methods', function(done){
            Promise.fail([
                UnexistingTable.add({ name: 'a' }),
                UnexistingTable.get({ name: 'a' }),
                UnexistingTable.update({ name: 'c'}, { newAttribute: 'd' }),
                UnexistingTable.delete({ name: 'a'})
            ])
            .then(() => done())
            .catch(done);
        })
    });

    describe('#add(Item)', function() {
        it('should add item to table', function(done){
            ExistingTable
                .add({ name: "Hello", size: "Big" })
                .then(() => done())
                .catch(done);
        });

        it('should fail if primary key is not provided', function(done){
            ExistingTable
                .add({ size: 4 })
                .then(() => done(new Error('should not add if key is not provided')))
                .catch(() => done());
        });
    });

    describe('#get(Item)', function() {
        it('should get item from table', function(done){
            ExistingTable
                .get({ name: "Hello" })
                .then(() => done())
                .catch(done);
        });
        it('should fail if primary key is not provided', function(done){
            ExistingTable
                .add({ not: "Hello" })
                .then(() => done(new Error()))
                .catch(() => done());
        })
    });

    describe('#update(Item)', function() {
        it('should update item from table', function(done){
            ExistingTable
                .update({ name: "Hello" }, { newAttribute: 'newest' })
                .then(() => done())
                .catch(done);
        });
        it('should fail if primary key is not provided', function(done){
            ExistingTable
                .update({ not: "Hello" }, { newAttribute: 'old' })
                .then(() => done(new Error()))
                .catch(() => done());
        });

        it('should fail if attribute object is not provided', function(done){
            ExistingTable
                .update({ name: "Hello" })
                .then(() => done(new Error()))
                .catch(() => done())
        });
    });

    describe('#delete(Item)', function() {
        it('should delete item from', function(done){
            ExistingTable
                .delete({ name: "Hello" })
                .then(() => done())
                .catch(done);
        });
        it('should fail if primary key is not provided', function(done){
            ExistingTable
                .delete({ not: "Hello" })
                .then(() => done(new Error()))
                .catch(() => done());
        })
    });
});
