import { BigNumber } from 'ethers';

export type TokenDetails<T extends object = {}> = {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: BigNumber;
} & T;

export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];

export type CharNumber =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9';

export type StringNumber<T extends string> = `${T}${CharNumber}`;
