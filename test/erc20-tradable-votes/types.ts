import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';

import { ERC20TradableVotes } from '../../typechain';

export type ERC20TradableVotesTokenDetails = {
  divider: BigNumber;
  price: BigNumber;
  capitalShareRate: number;
  suggestedPrice: BigNumber;
  duration: BigNumber;
};

export type ERC20TradableVotesSetupTestParams = {};

export type ERC20TradableVotesSetupTest = {
  account: SignerWithAddress;
  deployer: SignerWithAddress;
  erc20tv: ERC20TradableVotes;
  zeroSigner: SignerWithAddress;
};

export type VotingStartedEventArgs = [string, BigNumber, BigNumber, BigNumber];
