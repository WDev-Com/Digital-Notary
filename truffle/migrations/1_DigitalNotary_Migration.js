const SimpleDigitalNotary = artifacts.require("SimpleDigitalNotary");

module.exports = function (deployer) {
  deployer.deploy(SimpleDigitalNotary, { gas: 4000000 }); // Increased gas limit
};
