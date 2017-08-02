
const QueryBuilder = require('./QueryBuilder');

module.exports = class ConditionalQueryBuilder extends QueryBuilder {
    constructor(...args) {
        super(...args);
    }

    useIndex(indexName) {
        this.IndexName = indexName;
        return this;
    }

    // Queries
    query(key, op, condition) {
        const name = this.addExpressionName(key);
        const cond = this.addExpressionValue(condition);
        this.addCondition(`${name} ${op} ${cond}`);

        const params = this.buildParams();
        params.ReturnValues = 'ALL_NEW';
        params.KeyConditionExpression = params.ConditionExpression;
        delete params.ConditionExpression;
        return this.doc('query', params)
    }

    scan() {
        const params = this.buildParams();
        params.ReturnValues = 'ALL_NEW';
        if (params.ConditionExpression) {
            params.FilterExpression = params.ConditionExpression;
            delete params['ConditionExpression'];
        }
        return this.doc('scan', params);
    }

    add(Item) {
        const params = this.buildParams({ Item });
        return this.addItem(params);
    }

    get(Key) {
      return this.getItem(this.buildParams({ Key }));
    }

    update(Key, updateParams) {
        updateParams && this.addUpdateExpression(updateParams);
        const params = this.buildUpdateParams({ Key });
        return this.doc('update', params).then(({ Attributes }) => Attributes);
    }

    delete(Key) {
        const params = this.buildParams({ Key })
        return this.deleteItem(params);
    }

    removeAttribute(Key, attributes) {
        this.addRemoveExpression(attributes)
        const params = this.buildUpdateParams({ Key });
        return this.doc('update', params);
    }

    // Conditions
    if(a, operator, b) {
        this.addCondition(`${this.addExpressionName(a)} ${operator} ${this.addExpressionValue(b)}`);
        return this;
    }

    between(x, y) {
        const a = this.addExpressionValue(x);
        const b = this.addExpressionValue(y);
        return this.addCondition(`BETWEEN ${a} AND ${b}`);
    }

    in(array) {
        const expression_array = array.map(item => this.addExpressionValue(item));
        return this.addCondition(`IN ${ expression_array.join(', ') }`);
    }

    // [ 'beginsWith', 'contains', 'typeIs' ]
    where(attribute, condition, value) {
        if (!this[condition])
            throw new Error(`${condition} is not a valid condition`);
        const name = this.addExpressionName(attribute);
        return this[condition](name, this.addExpressionValue(value));
    }

    createConditionList(attributes, condition) {
        if (!Array.isArray(attributes))
          attributes = [ attributes ];

        const conditionList = [];
        attributes.forEach(attribute => {
            conditionList.push(`${condition}(${this.addExpressionName(attribute)})`);
        });

        return this.addCondition(conditionList.join(' AND '));
    }

    exists(attributes) {
        return this.createConditionList(attributes, 'attribute_exists');
    }

    notExists(attributes) {
        return this.createConditionList(attributes, 'attribute_not_exists');
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

    and(condition = '') {
        return this.addCondition(`AND ${condition}`);
    }

    or(condition = '') {
        return this.addCondition(`OR ${condition}`);
    }
};
