import { BigNumber, providers } from 'ethers';

import { IERC20 } from '../typechain';

export const getBalanceAndTokenBalance = (
  provider: providers.JsonRpcProvider,
  address: string,
  erc20: IERC20,
): Promise<[BigNumber, BigNumber]> =>
  Promise.all([provider.getBalance(address), erc20.balanceOf(address)]);
