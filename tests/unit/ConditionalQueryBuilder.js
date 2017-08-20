const { expect, Table, TableComb, errors } = require('../test_helpers');
const ConditionalQueryBuilder = require('../../lib/ConditionalQueryBuilder');
const expressionBuilder = require('../../lib/ExpressionBuilder');

const tablename = 'table-name';
const docFn = function doc(){};
const dbFn = function db(){};
const cqb = new ConditionalQueryBuilder(tablename, docFn, dbFn);

describe('ConditionalQueryBuilder', () => {
    before('creates object of type ConditionalQueryBuilder that has expressionBuilder properties', () => {
        expect(new ConditionalQueryBuilder()).to.be.an.instanceof(ConditionalQueryBuilder)
        expect(cqb).to.include(expressionBuilder);
        expect(cqb.params).to.deep.equal(expressionBuilder.params);
    });

    beforeEach('resets conditional params', () => {
        cqb.resetExpressionParams();
    });

    describe('init', () => {
        it('inherits parents properties', () => {
            expect(cqb).to.include.keys('TableName', 'doc', 'db');
            expect(cqb.TableName).to.equal(tablename);
            expect(cqb.doc).to.equal(docFn);
            expect(cqb.db).to.equal(dbFn);
        });
    });

    describe('#useIndex', () => {
        it('sets indexname in params object', () => {
            expect(cqb.params.IndexName).to.equal(undefined);
            cqb.useIndex('indexname');
            expect(cqb.params.IndexName).to.equal('indexname');
        });
    });

    describe('#if', () => {
        it('adds condition, expression names and expression values', () => {
            cqb.if('a', '=', 'b');
            expect(cqb.params).to.deep.include({
                ExpressionAttributeNames: {'#a': 'a'},
                ExpressionAttributeValues: {':a': 'b'},
                ConditionExpression: [ '(#a = :a)' ]
            });
            cqb.if('c', '>', 'd');
            // expressions add up as we chain if methods to the builder
            expect(cqb.params).to.deep.include({
                ExpressionAttributeNames: {'#a':'a', '#c': 'c'},
                ExpressionAttributeValues: {':a':'b', ':b': 'd'},
                ConditionExpression: [ '(#a = :a)', '(#c > :b)' ]
            });
        });
    });

    describe('#between', () => {
        it('adds between(value AND value) condition', () => {
            cqb.between(1, 'age', 2);
            expect(cqb.params).to.deep.include({
                ExpressionAttributeNames: {'#age':'age'},
                ExpressionAttributeValues: {':a': 1, ':b': 2},
                ConditionExpression: [ '(#age BETWEEN :a AND :b)' ]
            });
        });
    });

    describe('#in', () => {
        it('adds (attr in array) expression from js array', () => {
            cqb.in([1,2,3,5,0]);
            expect(cqb.params).to.deep.include({
                ConditionExpression: [ '(IN :a, :b, :c, :d, :e)' ]
            });
        });
    });

    describe('#where', () => {
        describe('#typeIs', () => {
            it('adds typeIs(attr, type) condition', () => {
                cqb.where('maxAge', 'typeIs', 'N');
                expect(cqb.params.ConditionExpression).to.deep.equal(['(attribute_type(#maxAge, :a))']);
            });
        });

        describe('#contains', () => {
            it('adds contains(attr, substr) condition', () => {
                cqb.where('address', 'contains', 'paris');
                expect(cqb.params.ConditionExpression).to.deep.equal(['(contains(#address, :a))']);
            });
        });
    });

    describe('#createConditionList', () => {
        it('creates a list of condition from single attribute', () => {
            cqb.createConditionList('gender', 'exists');
            expect(cqb.params).to.deep.include({
                ConditionExpression: [ '(exists(#gender))' ]
            });
        });
        it('creates a list of condition from array of attributes', () => {
            cqb.createConditionList(['gender','age','health'], 'condition');
            expect(cqb.params).to.deep.include({
                ConditionExpression: [ '(condition(#gender) AND condition(#age) AND condition(#health))' ]
            });
        });
    });

    describe('#exists/#notExists', () => {
        it('relies on createConditionList', () => {
            cqb.exists('g');
            cqb.notExists('f');

            // store actual params and then resets
            const params = cqb.params;
            cqb.resetExpressionParams();

            cqb.createConditionList('g', 'attribute_exists');
            cqb.createConditionList('f', 'attribute_not_exists');
            expect(cqb.params).to.deep.include(params);
            expect(cqb.params).to.deep.include(params);
        });
    });

});
