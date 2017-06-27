const AWS = require("aws-sdk");
const getUpdateExpression = require('./expressions');
const conditionExpression = require('./conditionExpressions');

// Helpers
const stringify     = (object)      => JSON.stringify(object, null, 2);

const getChar = (int) => String.fromCharCode(int + 97);

const expressionValueGenerator = function *() {
    let count = 0;
    yield getChar(count++);
};

class Query {
    constructor(TableName, doc, db) {
        this.TableName = TableName;
        this.doc = doc;
        this.db = db;

        this.e = expressionValueGenerator();
        this.ConditionExpression = [];
        this.ExpressionValues = {};
    }

    buildParams(params) {
        const queryParams = { TableName: this.TableName };
        Object.keys(params).forEach(property => {
            queryParams[property] = params[property];
        })
        if (this.ConditionExpression.length)
            queryParams.ConditionExpression = this.ConditionExpression.join(' ');
        this.ConditionExpression = [];
            console.log(queryParams);
        return queryParams;
    }

    add(Item) {
        return this.doc('put', this.buildParams({ Item }));
    }

    get(Key) {
        return this.doc('get', this.buildParams({ Key }))
            .then(({ Item }) => Item)
    }

    update(Key, updateObject = {}) {
        return this.doc('update', getUpdateExpression(updateObject, this.TableName, Key))
            .then(({ Attributes }) => Attributes);
    }

    delete(Key) {
        return this.doc('delete', this.buildParams({ Key }));
    }

    createTable(params) {
        params.TableName = this.TableName;
        return this.db('createTable', params)
            .then(({ TableDescription }) => TableDescription);
    }

    deleteTable() {
        return this.db('deleteTable', { TableName: this.TableName });
    }

    getItemObject(Key) {
        return {
            get:    ()      => this.get(Key),
            delete: ()      => this.delete(Key),
            update: params  => this.update(Key, params),
        };
    }

    getTableName() {
        return this.TableName;
    }

    addCondition(condition) {
        this.ConditionExpression.push(condition);
        return this;
    }

    find(attribute) {
        return this.addCondition(attribute);
    }

    between(x, y) {
        return this.addCondition(`BETWEEN ${x} AND ${y}`);
    }

    in(array) {
        return this.addCondition(`IN ${ array.join(', ') }`);
    }

    if(condition) {
        condition = condition.replace('!=', '<>');
        return this.addCondition(`${condition}`);
    }

    // [ 'beginsWith', 'contains', 'typeIs' ]
    where(attribute, condition, check) {
        const e = this.e.next().value;
        const attr = `:${check}`;
        this.ExpressionValues[attr] = e;
        console.log(e);
        return this[condition](attribute, e);
    }

    exists(attributes) {
        attributes.forEach(attribute => this.addCondition(`attribute_exists(${attribute})`))
        return this;
    }

    notExists(attributes) {
        attributes.forEach(attribute => this.addCondition(`attribute_not_exists(${attribute})`))
        return this;
    }

    typeIs(attribute, type) {
      return this.addCondition(`attribute_type(${attribute}, ${type})`);
    }

    contains(attribute, operand) {
      return this.addCondition(`contains(${attribute}, ${operand})`);
    }

    beginsWith(attribute, substring) {
        return this.addCondition(`begins_with(${attribute}, ${substring})`);
    }

    size(attribute){
      return this.addCondition(`size(${attribute})`);
    }

    and(attribute = '', condition) {
        if (condition)
            return this.addCondition('AND ' + this[condition](attribute));
        return this.addCondition(`AND ${attribute}`);
    }

    or(attribute = '', condition) {
        if (condition)
            return this.addCondition(' OR ' + this[condition](attribute));
        return this.addCondition(` OR ${attribute}`);
    }

    not(attribute = '', condition) {
        if (condition)
            return this.addCondition('NOT ' + this[condition](attribute));
        return this.addCondition(`NOT ${attribute}`);
    }
};

const getPromise = (func) => {
    return (method, params) => {
        return new Promise( (resolve, reject) => {
            func[ method ](params, (err, data) => {
                err
                ? reject(new Error(`DynamoDB > ${stringify(err)}`))
                : resolve(data);
            });
        });
    };
};

// Exports DynamoDB function that returns an object of methods
module.exports      = (configPath) => {
    // Immediately init DynamoDB from config file
    AWS.config.loadFromPath(configPath);

    // gets docClient function to return promise

    const doc = getPromise(new AWS.DynamoDB.DocumentClient());
    const db = getPromise(new AWS.DynamoDB());

    return {
        // Select Table and return method object for further queries
        select: (TableName) => new Query(TableName, doc, db),
    };

}
