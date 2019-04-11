const QueryBuilder = require('./QueryBuilder');

const { RETURN_VALUES } = require('./constants');

const toArray = x => (Array.isArray(x) ? x : [x]);

class ConditionalQueryBuilder extends QueryBuilder {
  constructor(...args) {
    super(...args);
    this.params = this.buildExpressionParams();
    this.options = {
      updateType: 'SET',
    };
  }

  useIndex(IndexName) {
    this.addParams({ IndexName });
    return this;
  }

  limit(limit) {
    this.options.Limit = limit;
    return this;
  }

  if(a, operator, b) {
    this.addCondition(`${this.addExpressionName(a)} ${operator} ${this.addExpressionValue(b)}`);
    return this;
  }

  between(x, attribute, y) {
    const attributeName = this.addExpressionName(attribute);
    const min = this.addExpressionValue(x);
    const max = this.addExpressionValue(y);

    this.addCondition(`${attributeName} BETWEEN ${min} AND ${max}`);
    return this;
  }

  inList(attribute, array) {
    const name = this.addExpressionName(attribute);
    const expressionArray = array.map(item => this.addExpressionValue(item));
    this.addCondition(`${name} IN (${expressionArray.join(', ')})`);
    return this;
  }

  project(attributes) {
    this.addProjectionExpression(toArray(attributes));
    return this;
  }

  // [ 'beginsWith', 'contains', 'typeIs' ]
  where(attribute, condition, value) {
    if (!this[condition]) {
      throw new Error(`${condition} is not a valid condition`);
    }

    this[condition](
      this.addExpressionName(attribute),
      this.addExpressionValue(value)
    );
    return this;
  }

  createConditionList(attributes, condition) {
    const conditionList = toArray(attributes).reduce((list, attribute) => {
      list.push(`${condition}(${this.addExpressionName(attribute)})`);
      return list;
    }, []);
    this.addCondition(conditionList.join(' AND '));
    return this;
  }

  exists(attributes) {
    return this.createConditionList(attributes, 'attribute_exists');
  }

  notExists(attributes) {
    return this.createConditionList(attributes, 'attribute_not_exists');
  }

  typeIs(attribute, type) {
    this.addCondition(`attribute_type(${attribute}, ${type})`);
  }

  contains(attribute, operand) {
    this.addCondition(`contains(${attribute}, ${operand})`);
  }

  beginsWith(attribute, substring) {
    this.addCondition(`begins_with(${attribute}, ${substring})`);
  }

  size(attribute) {
    this.addCondition(`size(${attribute})`);
    return this;
  }

  increment(attribute, value) {
    this.newOperationExpression(attribute, '+', value);
    return this;
  }

  decrement(attribute, value) {
    this.newOperationExpression(attribute, '-', value);
    return this;
  }

  query(key, op, condition) {
    this.addKeyCondition(
      `${this.addExpressionName(key)} ${op} ${this.addExpressionValue(condition)}`
    );

    const params = this.buildParams({}, 'NEW');
    return this.queryTable(this.buildFilterExpression(params));
  }

  scan() {
    const params = this.buildParams({}, 'NEW');
    return this.scanTable(this.buildFilterExpression(params));
  }

  add(Item) {
    return this.addItem(this.buildParams({ Item }));
  }

  get(Key) {
    return this.getItem(this.buildParams({ Key }));
  }

  update(Key, updateParams, toReturn = 'UPD') {
    updateParams && this.addUpdateExpression(updateParams);
    return this.updateItem(this.buildParams({ Key }, toReturn));
  }

  delete(Key) {
    return this.deleteItem(this.buildParams({ Key }));
  }

  removeAttribute(Key, attributes) {
    this.addRemoveExpression(attributes);
    this.options.updateType = 'REMOVE';
    return this.updateItem(this.buildParams({ Key }, 'NEW'));
  }

  // Query Parameters
  buildParams(params = {}, toReturn = 'OLD') {
    this.params.ProjectionExpression = this.params.ProjectionExpression.join(', ');
    this.deleteEmptyParams();
    this.params.UpdateExpression && this.buildUpdateExpression();
    this.params.ConditionExpression && this.buildConditionExpression();

    const buildedParams = Object.assign({
      TableName: this.TableName,
      ReturnValues: RETURN_VALUES[toReturn],
    }, this.params, params, this.options);
    this.params = this.buildExpressionParams();
    return buildedParams;
  }

  buildUpdateExpression() {
    if (!this.params.UpdateExpression.length) {
      return;
    }

    const expression = this.params.UpdateExpression.join(', ');
    this.params.UpdateExpression = `${this.options.updateType} ${expression}`;
  }

  buildConditionExpression() {
    const conditions = this.params.ConditionExpression;
    const keyConditions = this.params.KeyConditionExpression;

    if (conditions && conditions.length) {
      this.params.ConditionExpression = conditions.join(' AND ');
    }

    if (keyConditions && keyConditions.length) {
      this.params.KeyConditionExpression = keyConditions.join(' AND ');
    }
  }

  buildFilterExpression(params) {
    params.FilterExpression = params.ConditionExpression;
    delete params.ConditionExpression;
    return params;
  }

  deleteEmptyParams() {
    Object.keys(this.params).forEach((k) => {
      if (!Object.keys(this.params[k]).length) {
        delete this.params[k];
      }
    });
  }

  addParams(params) {
    Object.assign(this.params, params);
  }

  batchWrite(batchParams, type = 'Put', key = 'Item') {
    const RequestItems = {};

    // All keys in batchParams are Table names
    Object.keys(batchParams).forEach((tableName) => {
      RequestItems[tableName] = [];
      batchParams[tableName].forEach((Item) => {
        // PutRequest: { Item: Item } or DeleteRequest: { Key: Item }
        const request = { [`${type}Request`]: { [key]: Item } };
        RequestItems[tableName].push(request);
      });
    });

    return this.batchWriteItem({ RequestItems });
  }

  batchPut(batchParams) {
    return this.batchWrite(batchParams, 'Put', 'Item');
  }

  batchDelete(batchParams) {
    return this.batchWrite(batchParams, 'Delete', 'Key');
  }

  batchGet(batchParams) {
    const RequestItems = {};
    Object.keys(batchParams).forEach((tableName) => {
      RequestItems[tableName] = { Keys: [] };
      const currentTable = RequestItems[tableName];
      const providedKeys = batchParams[tableName].Keys;
      Object.keys(providedKeys)
        .forEach((key) => {
          providedKeys[key].forEach(keyValue => currentTable.Keys.push({ [key]: keyValue }));
        });
    });
    return this.batchGetItem({ RequestItems });
  }
}

module.exports = ConditionalQueryBuilder;
