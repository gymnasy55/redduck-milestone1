import { utils, BigNumber } from 'ethers';

export const parseUnits = (
  value: string | number,
  decimals: number = 18,
): BigNumber => utils.parseUnits(value.toString(), decimals);
