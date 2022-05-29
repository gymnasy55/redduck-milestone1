import { utils, BigNumber, providers, ContractReceipt } from 'ethers';

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

export const calcGasValue = (receipt: ContractReceipt): BigNumber =>
  receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);

export const increaseTime = async (
  provider: providers.JsonRpcProvider,
  seconds: number,
): Promise<void> =>
  provider
    .send('evm_increaseTime', [seconds])
    .then(() => provider.send('evm_mine', []));
