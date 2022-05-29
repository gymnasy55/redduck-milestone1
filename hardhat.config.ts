import * as dotenv from 'dotenv';
import { HardhatUserConfig } from 'hardhat/config';

import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'hardhat-contract-sizer';
import './tasks';
import { getGoerliAlchemyUrl } from './helpers/alchemy-helpers';

dotenv.config();

const OPTIMIZER = process.env.OPTIMIZER === 'true';
const CI = process.env.CI === 'true';
const COVERAGE = process.env.COVERAGE === 'true';
const REPORT_GAS = process.env.REPORT_GAS === 'true';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

if (COVERAGE) {
  require('solidity-coverage');
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.9',
        settings: {
          optimizer: {
            enabled: OPTIMIZER,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      blockGasLimit: 10000000,
      allowUnlimitedContractSize: !OPTIMIZER,
    },
    goerli: {
      chainId: 5,
      gas: 12500000,
      gasPrice: 10 * 10 ** 9,
      url: getGoerliAlchemyUrl('<YOUR ALCHEMY KEY>'),
    },
  },
  gasReporter: {
    enabled: REPORT_GAS,
    currency: 'USD',
    outputFile: CI ? 'gas-report.txt' : undefined,
  },
  contractSizer: {
    runOnCompile: OPTIMIZER,
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};

export default config;
