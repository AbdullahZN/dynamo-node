const ExpressionBuilder = require('./ExpressionBuilder');

const RETURN_VALUES = {
    updated: 'UPDATED_NEW',
    new: 'ALL_NEW',
    old: 'ALL_OLD'
};

module.exports = class QueryBuilder extends ExpressionBuilder {
    constructor(TableName, doc, db) {
        super();
        this.TableName = TableName;
        this.doc = doc;
        this.db = db;
    }

    // Param builders
    buildParams(params = {}, toReturn = 'old') {
        const base = {
            TableName: this.TableName,
            ReturnValues: RETURN_VALUES[toReturn]
        };

        return Object.assign(base, this.buildExpressionParams(), params);
    }

    buildUpdateParams(params = {}) {
        params.UpdateExpression = this.setUpdateExpression();
        return this.buildParams(params, 'updated');
    }

    // List special
    addToList(newList) {
        this.addListAppendExpression(newList);
        return this;
    }

    removeFromList(items) {
        this.addListRemoveExpression(items);
        return this;
    }

    // queries
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
