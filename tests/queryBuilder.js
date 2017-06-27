const assert = require('assert');
const DynamoDB = require('../dynamoDB')('./credits.json');
const Table = DynamoDB.select('users');

Table.current = function (){
    const c = this.ConditionExpression;
    this.ConditionExpression = [];
    return c.join(' ');
}

describe('DynamoDB Conditional Expression Builder', function() {

    describe('#where()', function(){
        it('should write expression as a function if given condition is a function', function() {
            assert.equal(Table.where('a', 'beginsWith', 'b').current(), 'begins_with(a, b)');
            assert.equal(Table.where('c', 'contains', 'd').current(), 'contains(c, d)');
            assert.equal(Table.where('e', 'typeIs', 'f').current(), 'attribute_type(e, f)');
        });
    });

    describe('#if()', function() {
        it('should write expression as a comparison if given condition is a comparator', function() {
            assert.equal(Table.if('a = b').current(), 'a = b');
            assert.equal(Table.if('c != d').current(), 'c <> d');
            assert.equal(Table.if('c <> d').current(), 'c <> d');
            assert.equal(Table.if('e < f').current(), 'e < f');
            assert.equal(Table.if('g <= h').current(), 'g <= h');
            assert.equal(Table.if('i > j').current(), 'i > j');
            assert.equal(Table.if('k >= l').current(), 'k >= l');
        });
    });

    describe('#find("attribute")', function(){
        it('should add "attribute" to ConditionExpression', function() {
            assert.equal(Table.find("attribute").current(), 'attribute');
        });
    });
    describe('#find.between()', () => {
        assert.equal(Table.find('totalFriends').between(34, 56).current(), 'totalFriends BETWEEN 34 AND 56');
    });

    describe('#find.in()', () => {
        it('should write expression with range', function() {
            assert.equal(Table.find('totalFriends').in([4, 8, 10]).current(), 'totalFriends IN 4, 8, 10');
        });
    });

    describe('query methods after conditionExpression', () => {
        it('should execute conditional query', function(done) {
            Table.notExists(['uid'])
                .add({ uid: "jameson", age: 500 }).then(() => done()).catch(done)
        });

        it('should succeed if user whatched more than 500 games', function(done){
            Table.if('age = 500').get({ uid: "jameson" }).then(Item => {
                console.log(Item);
                done();
            }).catch(done);
        });

        it('should fail if user whatched less than 500 games', function(done){
            Table.if('age < 500').get({ uid: "james" }).then(Item => {
                console.log(Item);
                done();
            }).catch(done);
        });
    });

});
