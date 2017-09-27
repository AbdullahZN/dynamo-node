const { expect, DynamoDB } = require('../test_helpers');
const { checkConditionExpression } = require('./unit_helpers');

const ConditionalQueryBuilder = require('../../lib/ConditionalQueryBuilder');

const tablename = 'table-name';
const doc = function doc() { };
const db = function db() { };
const docClient = function docClient() {};

const cqb = new ConditionalQueryBuilder(tablename, { doc, db, docClient });

// sets params argument to cqb.params for further conditionExpression checks
cqb.conditionCheck = checkConditionExpression;

describe('ConditionalQueryBuilder', () => {
  before('creates object of type ConditionalQueryBuilder that has expressionBuilder properties', () => {
    expect(cqb).to.be.an.instanceof(ConditionalQueryBuilder);
  });

  beforeEach('resets conditional params', () => {
    cqb.params = cqb.buildExpressionParams();
  });

  describe('init', () => {
    it('inherits parents properties', () => {
      expect(cqb).to.include.keys('TableName', 'doc', 'db');
      expect(cqb.TableName).to.equal(tablename);
      expect(cqb.doc).to.equal(doc);
      expect(cqb.db).to.equal(db);
    });
  });

  describe('init multiple instances', () => {
    const a = DynamoDB.select('a');
    const b = DynamoDB.select('b');
    const c = DynamoDB.select('c');

    it('can inits multiple instances', () => {
      expect(a.params).to.deep.equal(b.params);
      expect(b.params).to.deep.equal(c.params);
    });
    it('does not share same param objects', () => {
      a.if('a', '>', 0);
      b.if('c', '<', 0);
      c.where('a', 'contains', 'a');
      expect(a.params).to.not.deep.equal(b.params);
      expect(b.params).to.not.deep.equal(c.params);
      expect(a.params).to.not.deep.equal(c.params);
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
        ExpressionAttributeNames: { '#a': 'a' },
        ExpressionAttributeValues: { ':a': 'b' },
        ConditionExpression: ['(#a = :a)']
      });
      cqb.if('c', '>', 'd');
      // expressions add up as we chain if methods to the builder
      expect(cqb.params).to.deep.include({
        ExpressionAttributeNames: { '#a': 'a', '#c': 'c' },
        ExpressionAttributeValues: { ':a': 'b', ':b': 'd' },
        ConditionExpression: ['(#a = :a)', '(#c > :b)']
      });
    });

    it('works with chained ifs as well', () => {
      cqb
        .if('uid', '=', 'aa')
        .if('name', '=', 'Fear')
        .if('age', '<', 1)
        .if('b', '>', 2)
        .if('c', '<>', 3)
        .if('e', '<=', 5);
      cqb.conditionCheck('(#uid = :a)');
      cqb.conditionCheck('(#name = :b)');
      cqb.conditionCheck('(#age < :c)');
      cqb.conditionCheck('(#b > :d)');
      cqb.conditionCheck('(#c <> :e)');
      cqb.conditionCheck('(#e <= :f)');
    });
  });

  describe('#between', () => {
    it('adds between(value AND value) condition', () => {
      cqb.between(1, 'age', 2);
      cqb.conditionCheck('(#age BETWEEN :a AND :b)');
    });
  });

  describe('#in', () => {
    it('adds (attr in array) expression from js array', () => {
      cqb.inList('age', [1, 2, 3, 5, 0]);
      cqb.conditionCheck('(#age IN (:a, :b, :c, :d, :e))');
    });
  });

  describe('#where', () => {
    describe('#typeIs', () => {
      it('adds typeIs(attr, type) condition', () => {
        cqb.where('maxAge', 'typeIs', 'N');
        cqb.conditionCheck('(attribute_type(#maxAge, :a))');
      });
    });

    describe('#contains', () => {
      it('adds contains(attr, substr) condition', () => {
        cqb.where('address', 'contains', 'paris');
        cqb.conditionCheck('(contains(#address, :a))');
      });
    });
  });

  describe('#createConditionList', () => {
    it('creates a list of condition from single attribute', () => {
      cqb.createConditionList('gender', 'exists');
      cqb.conditionCheck('(exists(#gender))');
    });
    it('creates a list of condition from array of attributes', () => {
      cqb.createConditionList(['gender', 'age', 'health'], 'condition');
      cqb.conditionCheck('(condition(#gender) AND condition(#age) AND condition(#health))');
    });
  });

  describe('#exists/#notExists', () => {
    it('relies on createConditionList', () => {
      cqb.exists('g');
      cqb.notExists('f');

      // store actual params and then resets
      const params = cqb.params;
      cqb.buildExpressionParams();

      cqb.createConditionList('g', 'attribute_exists');
      cqb.createConditionList('f', 'attribute_not_exists');
      expect(cqb.params).to.deep.include(params);
      expect(cqb.params).to.deep.include(params);
    });
  });
});
