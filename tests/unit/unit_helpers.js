const expect = require('chai').expect;

module.exports = {

  checkConditionExpression(test) {
    expect(this.params.ConditionExpression).to.include.members([ test ]);
  },

}
