import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { ERC20 } from '../../typechain';

export type ERC20SetupTest = {
  account: SignerWithAddress;
  deployer: SignerWithAddress;
  erc20: ERC20;
  zeroSigner: SignerWithAddress;
};
