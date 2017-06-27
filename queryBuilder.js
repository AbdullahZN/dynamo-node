
class QueryBuilder {
    constructor(type, table) {
        console.log(table);
        this.type = type;
    }

    where(attribute, condition) {
        this.ConditionExpression = conditionExpression[condition](attribute)
        return this;
    }

    and(attribute, condition) {
        this.ConditionExpression += ' AND ' + conditionExpression[condition](attribute);
        return this;
    }

    or(attribute, condition) {
        this.ConditionExpression += ' OR ' + conditionExpression[condition](attribute);
        return this;
    }

    not(attribute, condition) {
        this.ConditionExpression += ' NOT ' + conditionExpression[condition](attribute);
        return this;
    }

    execute() {
        console.log(this.ConditionExpression);
    }
};

module.exports = QueryBuilder;
