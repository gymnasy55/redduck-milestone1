import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';

import { ERC20Tradable } from '../../typechain';

export type ERC20TradableSetupTestParams = {
  addLiquidity: boolean;
  price: BigNumber;
};

export type ERC20TradableSetupTest = {
  account: SignerWithAddress;
  deployer: SignerWithAddress;
  erc20t: ERC20Tradable;
  zeroSigner: SignerWithAddress;
};

export type ERC20TradableTokenDetails = {
  liquidity: {
    amount: BigNumber;
    tokenAmount: BigNumber;
  };
  divider: BigNumber;
  price: BigNumber;
};

export type TradableEventArgs = [string, BigNumber, BigNumber];
