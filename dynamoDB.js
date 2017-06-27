const AWS = require("aws-sdk");
const getUpdateExpression = require('./expressions');
// Helpers
const stringify     = (object)      => JSON.stringify(object, null, 2);

const getPromise = (func) => {
    return (method, params) => {
        return new Promise( (resolve, reject) => {
            func[ method ](params, (err, data) => {
                err
                ? reject(new Error(`DynamoDB > ${stringify(err)}`))
                : resolve(data);
            });
        });
    };
};

// Exports DynamoDB function that returns an object of methods
module.exports      = (configPath) => {

    if (! (configPath || process.env.AWS_ACCESS_KEY_ID) )
        return console.error("No AWS_ACCESS_KEY_ID found");

    // Immediately init DynamoDB from config file
    if (configPath)
        AWS.config.loadFromPath(configPath);
    AWS.config.update({ region: 'eu-central-1' });

    // gets docClient function to return promise
    const query = getPromise(new AWS.DynamoDB.DocumentClient());
    const db = getPromise(new AWS.DynamoDB());

    // handles object

    const getTableMethods = (TableName) => ({

        // CRUD Methods
        add: (Item) => query('put', { TableName, Item }),

        get: (Key)  => query('get', { TableName, Key }).then(({ Item }) => Item),

        update: (Key, updateObject = {}) => {
            return query('update', getUpdateExpression(updateObject, TableName, Key))
                .then(({ Attributes }) => Attributes);
        },

        delete: (Key) => query('delete', { TableName, Key }),

        // Tables
        createTable: (params) => {
            params.TableName = TableName;
            return db('createTable', params)
                .then(({ TableDescription }) => TableDescription);
        },

        deleteTable: () => db('deleteTable', { TableName }),

        // Utils
        getItemObject(Key) {
            return {
                get:    ()      => this.get(Key),
                delete: ()      => this.delete(Key),
                update: params  => this.update(Key, params),
            }
        },

        getTableName() {
            return TableName;
        }
    });

    return {
        // Select Table and return method object for further queries
        select: (TableName) => getTableMethods(TableName),
    }

}
