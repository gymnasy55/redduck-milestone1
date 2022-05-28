import { utils, BigNumber, providers, ContractReceipt } from 'ethers';

import { IERC20 } from '../typechain';

export const parseUnits = (
  value: string | number,
  decimals: number = 18,
): BigNumber => utils.parseUnits(value.toString(), decimals);

export const setBalance = (
  provider: providers.JsonRpcProvider,
  address: string,
  amount: BigNumber,
): Promise<any> => {
  if (!utils.isAddress(address)) {
    throw new Error(`Address is not valid. Address: ${address}`);
  }

  return provider.send('hardhat_setBalance', [
    address,
    amount.toHexString().replace('0x0', '0x'),
  ]);
};

export const getBalanceAndTokenBalance = (
  provider: providers.JsonRpcProvider,
  address: string,
  erc20: IERC20,
): Promise<[BigNumber, BigNumber]> =>
  Promise.all([provider.getBalance(address), erc20.balanceOf(address)]);

export const calcGasValue = (receipt: ContractReceipt): BigNumber =>
  receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);

export const increaseTime = async (
  provider: providers.JsonRpcProvider,
  seconds: number,
): Promise<void> =>
  provider
    .send('evm_increaseTime', [seconds])
    .then(() => provider.send('evm_mine', []));
