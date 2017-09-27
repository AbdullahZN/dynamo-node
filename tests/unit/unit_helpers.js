const { expect } = require('chai');

module.exports = {

  checkConditionExpression(test) {
    expect(this.params.ConditionExpression).to.include.members([test]);
  },

};
