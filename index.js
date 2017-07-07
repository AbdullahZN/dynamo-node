const AWS = require("aws-sdk");
const ConditionalQueryBuilder = require('./ConditionalQueryBuilder');

const stringify = (object) => JSON.stringify(object, null, 2);

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
module.exports      = (region, configPath) => {
    if (! (configPath || process.env.AWS_ACCESS_KEY_ID) )
        return console.error("No AWS_ACCESS_KEY_ID found");

    // Immediately init DynamoDB from config file
    configPath && AWS.config.loadFromPath(configPath);
    AWS.config.update({ region });
    // gets docClient function to return promise
    const db = getPromise(new AWS.DynamoDB());
    const doc = getPromise(new AWS.DynamoDB.DocumentClient());

    return {
        // Select Table and return method object for further queries
        select: (TableName) => {
            return new ConditionalQueryBuilder(TableName, doc, db);
        },

    };

}
