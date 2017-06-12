// Helpers
const getChar = (int) => String.fromCharCode(int + 97);

// Polyfills
Object.values = Object.values || ((obj) => Object.keys(obj).map(key => obj[key]));

module.exports = function(update, TableName, Key) {
    const updateKeys = Object.keys(update);

    const updateExpression = updateKeys
        .map((key, index) => ` ${key} = :${getChar(index)},`)
        .join('')
        .slice(0, -1);
    const ExpressionValues = Object.values(update)
        .reduce((acc, value, index) => (acc[`:${getChar(index)}`] = value) && acc, {});

    return {
        TableName,
        Key,
        UpdateExpression: `set${updateExpression}`,
        ExpressionAttributeValues: ExpressionValues,
        ReturnValues: "UPDATED_NEW"
    };
};
