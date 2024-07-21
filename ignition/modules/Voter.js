const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("VoterModule", (m) => {
    const deployer = m.getAccount(0);
    const candidates = ["Python", "Java", "C", "Solidity", "JavaScript"];

    const voter = m.contract("Voter", [candidates], {
        from: deployer,
    });

    return { voter };
});