const AWS = require("aws-sdk");

// Helpers
const stringify     = (object)      => JSON.stringify(object, null, 2);
const getChar       = (int)         => String.fromCharCode(int + 97);
const Err           = (err, msg)    => new Error(`${msg} > ${stringify(err)}`);

// Polyfills
Object.values = Object.values || ((obj) => Object.keys(obj).map(key => obj[key]));

// Exports DynamoDB function that returns an object of methods
module.exports      = (configPath) => {
    AWS.config.loadFromPath(configPath);
    const docClient = new AWS.DynamoDB.DocumentClient();
    const dynamo    = new AWS.DynamoDB();

    const getMethods = (TableName) => ({

        // CRUD Methods
        add(Item) {
            return new Promise((resolve, reject) => {
                docClient.put({ TableName, Item }, (err, data) => {
                    err && reject(Err(err, `DynamoDB: Error adding to ${TableName}`));
                    resolve('added Item');
                })
            });
        },

        get(Key) {
            return new Promise((resolve, reject) => {
                docClient.get({ TableName, Key }, (err, data) => {
                    err && reject(Err(err, `DynamoDB: Error querying from ${TableName}`));
                    resolve(data);
                });
            });
        },

        update(Key, update = {}) {
            const updateKeys = Object.keys(update);
            if (!updateKeys.length)
                return Promise.reject(new Error('Update object is empty'));
            const updateExpression = updateKeys
                .map((key, index) => ` ${key} = :${getChar(index)},`)
                .join('')
                .slice(0, -1);
            const ExpressionValues = Object.values(update)
                .reduce((acc, value, index) => (acc[`:${getChar(index)}`] = value) && acc, {});
            const params = {
                TableName,
                Key,
                UpdateExpression: `set${updateExpression}`,
                ExpressionAttributeValues: ExpressionValues,
                ReturnValues: "UPDATED_NEW"
            };

            return new Promise((resolve, reject) => {
                docClient.update(params, (err, data) => {
                    err && reject(Err(err, `DynamoDB: Error updating in ${TableName}`));
                    resolve(data);
                });
            });
        },

        delete(Key) {
            return new Promise((resolve, reject) => {
                docClient.delete({ TableName, Key }, (err, data) => {
                    err && reject(Err(err, `DynamoDB: Unable to delete item in ${TableName}`))
                    resolve('delete Item');
                });
            });
        },

        // Tables
        createTable(params) {
            params.TableName = TableName;
            return new Promise((resolve, reject) =>
                dynamo.createTable(params, (err, data) => err ? reject(err) : resolve(data))
            ).catch(err => logErr(err, `DynamoDB: Unable to create ${TableName}`));
        },

        deleteTable() {
            return new Promise((resolve, reject) =>
                dynamo.deleteTable({ TableName }, (err, data) => err ? reject(err) : resolve(true))
            ).catch(err => logErr(err, `DynamoDB: Unable to delete ${TableName}`));
        },

        // Utils
        getTableName: () => TableName,
    });

    return {

        // Select Table and return method object for further queries
        select: (TableName) => getMethods(TableName),
    }

}
