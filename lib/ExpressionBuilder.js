
Object.values = Object.values || ((obj) => Object.keys(obj).map(key => obj[key]));

const getChar = (int) => String.fromCharCode(int + 97);
const UPDATE_TYPES = {
    SET: 'SET',
    REMOVE: 'REMOVE'
};

function *expressionValueGenerator(count) {
    while(true)
      yield `${getChar(count++)}`;
}

module.exports = class ExpressionBuilder {
    constructor() {
        this.resetExpressions();
        this.resetExpressionValueGenerator();
    }

    buildExpressionParams() {
        const params = {};
        if (Object.keys(this.ExpressionValues).length)
            params.ExpressionAttributeValues = this.ExpressionValues;
        if (Object.keys(this.ExpressionNames).length)
            params.ExpressionAttributeNames = this.ExpressionNames;
        if (this.ConditionExpression.length)
            params.ConditionExpression = this.ConditionExpression.join(' AND ');
        if (this.IndexName)
            params.IndexName = this.IndexName;
        this.resetExpressionValueGenerator();
        this.resetExpressions();
        return params;
    }

    resetExpressions() {
        this.UpdateExpression = [];
        this.ConditionExpression = [];
        this.ExpressionValues = {};
        this.ExpressionNames = {};
        delete this.IndexName;
    }

    resetExpressionValueGenerator() {
        this.expression = expressionValueGenerator(0);
    }

    setUpdateExpression() {
        const expression = this.UpdateExpression.join(', ');
        const type = expression.indexOf('=') !== -1
            ? UPDATE_TYPES.SET
            : UPDATE_TYPES.REMOVE;
        return `${type} ${expression}`;
    }

    addCondition(condition) {
        this.ConditionExpression.push(`(${condition})`);
        return this;
    }

    newUpdateExpression(expression) {
        this.UpdateExpression.push(expression);
    }

    filterExpressionNames(name) {
        return '#' + `${name}`.replace(/[^a-zA-Z.0-9]/g, '').replace(/\./g, '.#');
    }

    addExpressionValue(value, repeat = 1) {
        const expression = ':' + this.expression.next().value.repeat(repeat);
        this.ExpressionValues[expression] = value;
        return expression;
    }

    addExpressionName(attributeName) {
        const values = attributeName.split('.');
        // from a.b.c to [#a,#b,#c]
        const names = this.filterExpressionNames(attributeName).split('.');
        names.forEach((name, index) => { this.ExpressionNames[name] = values[index] });
        // to #a.#b.#c
        return names.join('.');
    }

    addUpdateExpression(params) {
        Object.keys(params).forEach((key, index) =>
            this.newUpdateExpression(`${this.addExpressionName(key)} = ${this.addExpressionValue(params[key], 2)}`)
        );
    }

    addRemoveExpression(attributes) {
        attributes.forEach(attribute =>
            this.UpdateExpression.push(`${this.addExpressionName(attribute)}`)
        );
    }

    addListAppendExpression(newList) {
        Object.keys(newList).forEach((key, index) => {
            const value = this.addExpressionValue(newList[key], 3);
            const name = this.addExpressionName(key);
            this.UpdateExpression.push(`${name} = list_append(${name}, ${value})`);
        });
    }

    addListRemoveExpression(items) {
        Object.keys(items).forEach((key, index) => {
            const name = this.addExpressionName(key);
            this.UpdateExpression.push(items[key].map(index => `${name}[${index}]`).join(', '));
        });
    }

    newOperationExpression(attribute, op, amount) {
        const value = this.addExpressionValue(amount);
        const name = this.addExpressionName(attribute);
        this.newUpdateExpression(`${name} = ${name} ${op} ${value}`);
    }

    increment(attribute, value) {
        this.newOperationExpression(attribute, '+', value)
        return this;
    }

    decrement(attribute, value) {
        this.newOperationExpression(attribute, '-', value);
        return this;
    }

}
