import { WithAlchemyKey, WithPrivateKey } from '../types';

export type TaskDeployERC20Params = WithAlchemyKey<
  WithPrivateKey<{
    name: string;
    symbol: string;
    decimals: number;
    totalsupply: number;
  }>
>;

export type TaskDeployERC20TradableParams = TaskDeployERC20Params & {
  price: number;
};

export type TaskDeployERC20TradableVotesParams =
  TaskDeployERC20TradableParams & {
    capitalsharerate: number;
  };
