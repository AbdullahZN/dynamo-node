const AWS = require("aws-sdk");

// Helpers
const stringify     = (object)      => JSON.stringify(object, null, 2);
const getChar       = (int)         => String.fromCharCode(int + 97);
const logErr        = (err, msg)    => console.log(`${msg} > ${stringify(err)}`);

// Polyfills
Object.values = Object.values || ((obj) => Object.keys(obj).map(key => obj[key]));

// Exports DynamoDB function that returns an object of methods
module.exports      = (configPath) => {
    AWS.config.loadFromPath(configPath);
    const docClient = new AWS.DynamoDB.DocumentClient();
    const dynamo    = new AWS.DynamoDB();

    return {

        // CRUD Methods
        add({ TableName, Item }) {
            return new Promise((resolve, reject) =>
                docClient.put({ TableName, Item }, (err, data) => err ? reject(err) : resolve(true))
            ).catch(err => logErr(err, `DynamoDB: Error adding to ${TableName}`));
        },

        get({ TableName, Key }) {
            return new Promise((resolve, reject) =>
                docClient.get({ TableName, Key }, (err, data) => err ? reject(err) : resolve(data))
            ).catch(err => logErr(err, `DynamoDB: Error querying from ${TableName}`));
        },

        update({ TableName, update, Key }) {
            const updateExpression = Object.keys(update)
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

            return new Promise((resolve, reject) =>
                docClient.update(params, (err, data) => err ? reject(err) : resolve(data))
            ).catch(err => logErr(err, `DynamoDB: Error updating in ${TableName}`));
        },

        delete({ TableName, Key }) {
            return new Promise((resolve, reject) =>
                docClient.delete({ TableName, Key }, (err, data) => err ? reject() : resolve(true))
            ).catch(err => logErr(err, `DynamoDB: Unable to delete item in ${TableName}`));
        },

        // Tables
        createTable(params) {
            return new Promise((resolve, reject) =>
                dynamo.createTable(params, (err, data) => err ? reject() : resolve(data))
            ).catch(err => logErr(err, `DynamoDB: Unable to create ${params.TableName}`));
        },

        deleteTable({ TableName }) {
            return new Promise((resolve, reject) =>
                dynamo.deleteTable({ TableName }, (err, data) => err ? reject() : resolve(true))
            ).catch(err => logErr(err, `DynamoDB: Unable to delete ${TableName}`));
        }
    };
}
