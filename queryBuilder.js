
const getChar       = (int)         => String.fromCharCode(int + 97);
const RETURN_VALUES = {
    updated: 'UPDATED_NEW',
    new: 'ALL_NEW'
}
// Polyfills
Object.values = Object.values || ((obj) => Object.keys(obj).map(key => obj[key]));

module.exports = class QueryBuilder {
    constructor(TableName, doc, db) {
        this.TableName = TableName;
        this.doc = doc;
        this.db = db;
        this.ExpressionValues = {};
        this.UpdateExpression = 'SET ';
    }

    *expressionValueGenerator(count) {
        while(true)
            yield `:${getChar(count++)}`;
    }

    getChar(int) {
        return String.fromCharCode(int + 97);
    }

    getExpressionValues() {
        return this.ExpressionValues;
    }

    setExpressionValues(params) {
        const updateKeys = Object.keys(params);

        this.UpdateExpression += updateKeys
            .map((key, index) => `${key} = :${getChar(index)}`).join(', ');

        this.ExpressionValues = Object.values(params).reduce((acc, value, key) => {
            acc[`:${getChar(key)}`] = value;
            return acc;
        }, {});
    }

    buildBaseParams(params) {
        return Object.assign({ TableName: this.TableName}, params);
    }

    buildUpdateParams() {
        return {
            UpdateExpression: this.UpdateExpression,
            ExpressionAttributeValues: this.ExpressionValues,
            ReturnValues: RETURN_VALUES['updated']
        };
    }

    addItem(params) {
        return this.doc('put', params);
    }

    getItem(params) {
        return this.doc('get', params).then(({ Item }) => Item)
    }

    updateItem(params) {
        return this.doc('update', params).then(({ Attributes }) => Attributes);
    }

    deleteItem(params) {
        return this.doc('delete', params);
    }

    getItemObject(Key) {
        return {
            get:    ()      => this.getItem(Key),
            delete: ()      => this.deleteItem(Key),
            update: params  => this.updateItem(Key, params),
        };
    }

    createTable(params) {
        params.TableName = this.TableName;
        return this.db('createTable', params)
            .then(({ TableDescription }) => TableDescription);
    }

    deleteTable() {
        return this.db('deleteTable', { TableName: this.TableName });
    }

    getTableName() {
        return this.TableName;
    }

}
