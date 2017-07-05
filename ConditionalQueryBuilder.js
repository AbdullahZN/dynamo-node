
const QueryBuilder = require('./QueryBuilder');

module.exports = class ConditionalQueryBuilder extends QueryBuilder {
    constructor(...args) {
        super(...args);

        this.ConditionExpression = [];
        this.ExpressionValues = {};
        this.ExpressionNames = {};

        this.expression = '';
        this.resetExpressionValueGenerator();
    }

    resetExpressionValueGenerator() {
        this.expression = this.expressionValueGenerator(0);
    }

    getNextExpressionKey() {
        return this.expression.next().value;
    }

    addExpressionValue(attributeKey) {
        const expression = this.getNextExpressionKey();
        this.ExpressionValues[expression] = attributeKey;
        return expression;
    }

    addExpressionName(attributeName) {
        // from a.b.c to #a.#b.#c
        const names = `#${attributeName}`.replace(/\./g, '.#').split('.');
        const values = attributeName.split('.');
        names.forEach((name, index) => { this.ExpressionNames[name] = values[index]; });
        // back to initial state
        return names.join('.');
    }

    buildConditionalParams(baseParams) {
        const params = {};

        if (this.ConditionExpression.length)
            params.ConditionExpression = this.ConditionExpression.join(' AND ');
        if (Object.keys(this.ExpressionValues).length)
            params.ExpressionAttributeValues = this.ExpressionValues;
        if (Object.keys(this.ExpressionNames).length)
            params.ExpressionAttributeNames = this.ExpressionNames;

        this.ConditionExpression = [];
        this.ExpressionNames = {};
        this.ExpressionValues = {};
        this.resetExpressionValueGenerator();
        return Object.assign(params, this.buildBaseParams(baseParams));
    }

    add(Item) {
        const params = this.buildConditionalParams({ Item });
        return this.addItem(params);
    }

    get(Key) {
        return this.getItem(this.buildConditionalParams({ Key }));
    }

    removeAttribute(Key, attributes) {
        this.UpdateExpression = 'REMOVE ' + attributes.map(attribute => {
            return `${this.addExpressionName(attribute)}`;
        }).join(', ');
        const params = Object.assign(
            this.buildUpdateParams(),
            this.buildConditionalParams({ Key })
        );
        console.log(params);
        return this.doc('update', params);
    }

    update(Key, updateObject = {}, type) {
        if (type)
            this.UpdateExpression = type;
        this.setExpressionValues(updateObject);
        const params = Object.assign(
            this.buildUpdateParams(),
            this.buildConditionalParams({ Key })
        );
        console.log(params);
        return this.doc('update', params);
    }

    delete(Key) {
        return this.deleteItem(this.buildBaseParams({ Key }));
    }

    scan() {
        const params = this.buildConditionalParams();
        if (params.ConditionExpression) {
            params.FilterExpression = params.ConditionExpression;
            delete p['ConditionExpression'];
        }
        return this.doc('scan', params);
    }

    addCondition(condition) {
        this.ConditionExpression.push(condition);
        return this;
    }

    find(attribute) {
        return this.addCondition(attribute);
    }

    between(x, y) {
        const a = this.addExpressionValue(x);
        const b = this.addExpressionValue(y);
        return this.addCondition(`BETWEEN ${a} AND ${b}`);
    }

    in(array) {
        const expression_array = array.map(item => this.addExpressionValue(item));
        return this.addCondition(`IN ${ array.join(', ') }`);
    }

    if(a, operator, b) {
        this.addCondition(`${this.addExpressionName(a)} ${operator} ${this.addExpressionValue(b)}`);
        return this;
    }

    // [ 'beginsWith', 'contains', 'typeIs' ]
    where(attribute, condition, check) {
        if (!this[condition])
            throw new Error(`${condition} is not a valid condition`);
        const e = this.addExpressionValue(check);
        return this[condition](attribute, e);
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
