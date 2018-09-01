const ExpressionBuilder = require('./ExpressionBuilder');

module.exports = class QueryBuilder extends ExpressionBuilder {
  constructor(TableName, { doc, db, docClient }) {
    super();
    this.TableName = TableName;
    this.doc = doc;
    this.db = db;
    this.docClient = docClient;
  }

  addToList(newList) {
    this.addListAppendExpression(newList);
    return this;
  }

  removeFromList(items) {
    this.addListRemoveExpression(items);
    return this;
  }

  // Item operations
  addItem(params) {
    return this.doc('put', params);
  }

  getItem(params) {
    return this.doc('get', params).then(({ Item }) => Item);
  }

  updateItem(params) {
    return this.doc('update', params).then(({ Attributes }) => Attributes);
  }

  deleteItem(params) {
    return this.doc('delete', params);
  }

  /**
   * DynamoDB Query operation
   *
   * Process Query via AWS DynamoDB.DocumentClient
   *
   * http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html
   *
   * @param  {Object}   params  builded operation params
   * @return {Promise}          wraps AWS SDK DynamoDB operation's result
   */
  queryTable(params) {
    return this.doc('query', params);
  }

  /**
   * DynamoDB Scan operation
   *
   * Process Scan via AWS DynamoDB.DocumentClient
   *
   * http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Scan.html
   *
   * @param  {Object}   params  builded operation params
   * @return {Promise}          wraps AWS SDK DynamoDB operation's result
   */
  scanTable(params) {
    return this.doc('scan', params);
  }

  /**
   * DynamoDB BatchGet operation via AWS DynamoDB.DocumentClient
   *
   * http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchGetItem.html
   *
   * @param  {Object}   params  builded operation params
   * @return {Promise}          wraps AWS SDK DynamoDB operation's result
   */
  batchGetItem(params) {
    return this.doc('batchGet', params).then(({ Responses }) => Responses);
  }

  /**
   * DynamoDB BatchWrite operation via AWS DynamoDB.DocumentClient
   *
   * http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html
   *
   * @param  {Object}   params  builded operation params
   * @return {Promise}          wraps AWS SDK DynamoDB operation's result
   */
  batchWriteItem(params) {
    return this.doc('batchWrite', params).then(data => data);
  }

  /**
   * DynamoDB createTable operation via AWS DynamoDB
   *
   * http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_CreateTable.html
   *
   * @param  {Object}   params  builded operation params
   * @return {Promise}          wraps AWS SDK DynamoDB operation's result
   */
  createTable(params) {
    Object.assign(params, { TableName: this.TableName });
    return this.db('createTable', params)
      .then(({ TableDescription }) => TableDescription);
  }

  /**
   * DynamoDB deleteTable operation via AWS DynamoDB
   *
   * http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DeleteTable.html
   *
   * @param  {Object}   params  builded operation params
   * @return {Promise}          wraps AWS SDK DynamoDB operation's result
   */
  deleteTable() {
    return this.db('deleteTable', { TableName: this.TableName });
  }

  getTableName() {
    return this.TableName;
  }
};
