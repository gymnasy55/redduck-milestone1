import { Signer, providers } from 'ethers';

export type WithAlchemyKey<T extends object = {}> = {
  alchemykey: string;
} & T;

export type WithPrivateKey<T extends object = {}> = {
  privatekey: string;
} & T;

export type PreActionResult = {
  provider: providers.JsonRpcProvider;
  signer: Signer;
};
