
const getChar       = (int)         => String.fromCharCode(int + 97);
const RETURN_VALUES = {
    updated: 'UPDATED_NEW',
    new: 'ALL_NEW',
    old: 'ALL_OLD'
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
            .map((key, index) => {
                const value = getChar(index);
                const expressionKey = `:${value}${value}`;
                this.ExpressionValues[expressionKey] = params[key];
                return `${key} = :${value}${value}`;
            }).join(', ');
    }

    addToList(newList) {
        this.UpdateExpression += Object.keys(newList).map((key, index) => {
            const value = getChar(index);
            const expressionKey = `:${value}${value}${value}`;
            this.ExpressionValues[expressionKey] = newList[key];
            const expressionName = this.addExpressionName(key);
            return `${expressionName} = list_append(${expressionName}, ${expressionKey})`;
        });
        return this;
    }

    removeFromList(items) {
        const removeExpression = Object.keys(items).map((key, index) => {
            const expressionName = this.addExpressionName(key);
            return items[key].map(index => `${expressionName}[${index}]`).join(', ');
        }).join(' AND ');

        this.UpdateExpression = `REMOVE ${removeExpression}`;
        return this;
    }

    buildBaseParams(params) {
        return Object.assign(
            { TableName: this.TableName, ReturnValues: RETURN_VALUES['old']},
            params
        );
    }

    buildUpdateParams() {
        const params = {};

        params.UpdateExpression = this.UpdateExpression;
        params.ReturnValues =  RETURN_VALUES['updated'];
        if (Object.keys(this.ExpressionValues).length)
            params.ExpressionAttributeValues = this.ExpressionValues;

        this.UpdateExpression = 'SET ';
        this.ExpressionValues = {};
        return params;
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
