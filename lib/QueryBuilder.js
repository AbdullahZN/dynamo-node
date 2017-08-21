
module.exports = class QueryBuilder {

    constructor(TableName, doc, db) {
        this.TableName = TableName;
        this.doc = doc;
        this.db = db;
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

  // Table operations
  queryTable(params) {
      return this.doc('query', params);
  }

  scanTable(params) {
    return this.doc('scan', params);
  }

  batchGetItem(params) {
    return this.doc('batchGet', params).then(({ Responses }) => Responses);
  }

  batchWriteItem(params) {
    return this.doc('batchWrite', params).then((data) => data);
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

};
