const DynamoDB = require('../index')();
const expect = require('chai').expect;

describe('DynamoDB Items', function() {
    const ExistingTable = DynamoDB.select('aws.table.for.testing');
    const Item = ExistingTable.add({ name: 'NewItem' });
    let ItemObject = null;
    describe('#getItemObject', function() {
        it('should return Item Object', function(done) {
            Item.then(() => {
                ItemObject = ExistingTable.getItemObject({ name: 'NewItem' });
                expect(ItemObject).to.have.own.property('get');
                expect(ItemObject).to.be.an('object');
            })
            .then(() => done())
            .catch(done);
        });
    });
    describe('ItemObject#get', function() {
        it('should get Item from DB', function(done) {
            ItemObject.get().then((Item) => {
                expect(Item).to.have.property('name');
                expect(Item.name).to.equal('NewItem');
                done();
            }).catch(done);
        });
    });
    describe('ItemObject#update', function() {
        it('should update Item from DB', function(done) {
            ItemObject.get()
            .then((Item) => {
                expect(Item).to.not.have.property('size');
                return ItemObject.update({ size: 'newSize' });
            })
            .then(Item => expect(Item).to.have.property('size'))
            .then(() => done())
            .catch(done);
        });
    });
    describe('ItemObject#delete', function() {
        it('should delete Item from DB', function(done) {
            ItemObject.delete().then(() => done()).catch(done);
        });
    });
});
