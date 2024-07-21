require('@nomicfoundation/hardhat-ethers');
require('@nomicfoundation/hardhat-ignition-ethers');
const privateKey = '076741c3543beb469c11c784d1b47bef9bf0ee83da1bbf2a1684c26931343295';
module.exports = {
  solidity: "0.8.24",
  networks: {
    moonbase: {
      url: 'https://rpc.api.moonbase.moonbeam.network',
      chainId: 1287,
      accounts: [privateKey],
    },
  }
};
