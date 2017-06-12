const AWS = require("aws-sdk");
const getUpdateExpression = require('./expressions');
// Helpers
const stringify     = (object)      => JSON.stringify(object, null, 2);

// Exports DynamoDB function that returns an object of methods
module.exports      = (configPath) => {

    // Immediately init DynamoDB from config file
    AWS.config.loadFromPath(configPath);
    const docClient = new AWS.DynamoDB.DocumentClient();
    const dynamo    = new AWS.DynamoDB();

    // gets docClient function to return promise
    const query = (method, params) => {
        return new Promise( (resolve, reject) => {
            docClient[ method ](params, (err, data) => {
                err
                    ? reject(new Error(`DynamoDB > ${stringify(err)}`))
                    : resolve(data);
            });
        });
    };

    const db = (method, params) => {
        return new Promise( (resolve, reject) => {
            dynamo[ method ](params, (err, data) => {
                err
                    ? reject(new Error(`DynamoDB > ${stringify(err)}`))
                    : resolve(data);
            });
        });
    }

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
