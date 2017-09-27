
Object.values = Object.values || (obj => Object.keys(obj).map(key => obj[key]));

const getChar = int => String.fromCharCode(int + 97);

function* expressionValueGenerator(count) {
  while (true) {
    yield `${getChar(count++)}`;
  }
}

module.exports = class ExpressionBuilder {
  // Inits generator with its first value 'a'
  constructor() {
    this.expressionGenValue = expressionValueGenerator(0);
  }

  addCondition(condition) {
    this.params.ConditionExpression.push(`(${condition})`);
  }

  addKeyCondition(condition) {
    this.params.KeyConditionExpression.push(`(${condition})`);
  }

  newUpdateExpression(expression) {
    this.params.UpdateExpression.push(expression);
  }

  filterExpressionNames(name) {
    return `#${`${name}`
      .replace(/[^a-zA-Z.0-9]/g, '')
      .replace(/\./g, '.#')}`;
  }

  async createDynamoSet(val) {
    return this.doc('createSet', val)
  }

  addExpressionValue(value, repeat = 1) {
    const expression = `:${this.expressionGenValue.next().value.repeat(repeat)}`;
    if (value instanceof Set) {
      value = this.doc('createSet')
    }

    this.params.ExpressionAttributeValues[expression] = value;
    return expression;
  }

  addExpressionName(attributeName) {
    const values = attributeName.split('.');
    // from a.b.c to [#a,#b,#c]
    const names = this.filterExpressionNames(attributeName).split('.');
    names.forEach((name, index) => { this.params.ExpressionAttributeNames[name] = values[index]; });
    // to #a.#b.#c
    return names.join('.');
  }

  addUpdateExpression(params) {
    Object.keys(params).forEach((key) => {
      const name = this.addExpressionName(key);
      const value = this.addExpressionValue(params[key], 2);
      this.params.UpdateExpression.push(`${name} = ${value}`);
    });
  }

  addRemoveExpression(attributes) {
    attributes.forEach(attribute =>
      this.params.UpdateExpression.push(`${this.addExpressionName(attribute)}`)
    );
  }

  addToSet(set) {
    Object.keys(set).forEach((index) => {
      const name = this.addExpressionName(index);
      const dynamoSet = this.docClient.createSet(set[index]);
      const value = this.addExpressionValue(dynamoSet, 1);
      this.params.UpdateExpression.push(`${name} ${value}`);
    });
    this.options.updateType = 'ADD';
    return this;
  }

  addListAppendExpression(newList) {
    Object.keys(newList).forEach((key) => {
      const name = this.addExpressionName(key);
      const value = this.addExpressionValue(newList[key], 3);
      this.params.UpdateExpression.push(`${name} = list_append(${name}, ${value})`);
    });
  }

  addListRemoveExpression(items) {
    Object.keys(items).forEach((key) => {
      const name = this.addExpressionName(key);
      this.params.UpdateExpression.push(items[key].map(index => `${name}[${index}]`).join(', '));
    });
    this.options.updateType = 'REMOVE';
  }

  addProjectionExpression(attributes) {
    const projections = this.params.ProjectionExpression;
    const attributeNames = attributes.map(attr => this.addExpressionName(attr));
    this.params.ProjectionExpression = projections.concat(attributeNames);
  }

  /**
     * Mathematical operation on DynamoDB N types
     * allowed operations are +, -, /, *, %
     * following this format : ( a = a [+, -, /, *, %] b )
     * eg. price = price - 1
     *
     * @param  {String} a   left operand
     * @param  {String} op  operator
     * @param  {Number} b   right operand
     *
     * @return {undefined}
     */
  newOperationExpression(a, op, b) {
    const name = this.addExpressionName(a);
    const value = this.addExpressionValue(b);
    this.newUpdateExpression(`${name} = ${name} ${op} ${value}`);
  }

  buildExpressionParams() {
    this.expressionGenValue = expressionValueGenerator(0);
    this.options = {
      updateType: 'SET',
    };
    this.params = {
      ExpressionAttributeValues: {},
      ExpressionAttributeNames: {},
      ConditionExpression: [],
      KeyConditionExpression: [],
      UpdateExpression: [],
      ProjectionExpression: [],
    };
    return this.params;
  }
};
