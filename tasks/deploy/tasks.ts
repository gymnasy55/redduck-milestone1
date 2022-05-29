import colors from 'colors';
import { Wallet, providers } from 'ethers';
import { task, types } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment as HRE } from 'hardhat/types/runtime';

import {
  TASK_DEPLOY_ERC20,
  TASK_DEPLOY_ERC20_TRADABLE,
  TASK_DEPLOY_ERC20_TRADABLE_VOTES,
} from './task-names';
import {
  TaskDeployERC20Params,
  TaskDeployERC20TradableParams,
  TaskDeployERC20TradableVotesParams,
} from './types';

import { getGoerliAlchemyUrl } from '../../helpers/alchemy-helpers';
import { parseUnits } from '../../helpers/ethers-helpers';
import { PreActionResult, WithAlchemyKey, WithPrivateKey } from '../types';

const preAction = (
  hre: HRE,
  { privatekey, alchemykey }: WithAlchemyKey<WithPrivateKey>,
): PreActionResult => {
  const alchemyUrl = getGoerliAlchemyUrl(alchemykey);

  const provider = new providers.JsonRpcProvider(alchemyUrl);
  const signer = new Wallet(privatekey, provider);

  return { provider, signer };
};

task(TASK_DEPLOY_ERC20)
  .addParam('privatekey', 'Deployer private key', '', types.string)
  .addParam('alchemykey', 'Alchemy Key', '', types.string)
  .addParam('name', 'Token name', 'ERC20 Token', types.string)
  .addParam('symbol', 'Token symbol', 'ERC20', types.string)
  .addParam('decimals', 'Token decimals', 18, types.int)
  .addParam(
    'totalsupply',
    'Supply of token will be transferred to deployer',
    1_000_000_000,
    types.int,
  )
  .setAction(async (params: TaskDeployERC20Params, hre) => {
    const { signer } = preAction(hre, params);
    const signerAddress = await signer.getAddress();

    const factory = await hre.ethers.getContractFactory(
      'ERC20Mintable',
      signer,
    );
    const erc20 = await (
      await factory.deploy(params.name, params.symbol, params.decimals)
    ).deployed();
    const tx = await erc20.mint(
      signerAddress,
      parseUnits(params.totalsupply, params.decimals),
    );
    await tx.wait();

    console.log(
      colors.bold(colors.green('ERC20 contract successfully deployed:')),
    );
    console.log(colors.bold(colors.yellow('Address:')), erc20.address);
    console.log(colors.bold(colors.yellow('Name:')), params.name);
    console.log(colors.bold(colors.yellow('Symbol:')), params.symbol);
    console.log(colors.bold(colors.yellow('Decimals:')), params.decimals);
    console.log(
      colors.bold(colors.yellow('Total Supply:')),
      params.totalsupply,
    );
    console.log(
      colors.bold(colors.yellow('Address of total supply holder:')),
      signerAddress,
    );
  });

task(TASK_DEPLOY_ERC20_TRADABLE)
  .addParam('privatekey', 'Deployer private key', '', types.string)
  .addParam('alchemykey', 'Alchemy Key', '', types.string)
  .addParam('name', 'Token name', 'ERC20 Token', types.string)
  .addParam('symbol', 'Token symbol', 'ERC20', types.string)
  .addParam('decimals', 'Token decimals', 18, types.int)
  .addParam(
    'totalsupply',
    'Supply of token will be transferred to deployer',
    1_000_000_000,
    types.int,
  )
  .addParam('price', 'Price of token', 2, types.int)
  .setAction(async (params: TaskDeployERC20TradableParams, hre) => {
    const { signer } = preAction(hre, params);
    const signerAddress = await signer.getAddress();

    const factory = await hre.ethers.getContractFactory(
      'ERC20TradableMintable',
      signer,
    );
    const erc20t = await (
      await factory.deploy(
        params.name,
        params.symbol,
        params.decimals,
        params.price,
      )
    ).deployed();
    const tx = await erc20t.mint(
      signerAddress,
      parseUnits(params.totalsupply, params.decimals),
    );
    await tx.wait();

    console.log(
      colors.bold(
        colors.green('ERC20Tradable contract successfully deployed:'),
      ),
    );
    console.log(colors.bold(colors.yellow('Address:')), erc20t.address);
    console.log(colors.bold(colors.yellow('Name:')), params.name);
    console.log(colors.bold(colors.yellow('Symbol:')), params.symbol);
    console.log(colors.bold(colors.yellow('Decimals:')), params.decimals);
    console.log(
      colors.bold(colors.yellow('Total Supply:')),
      params.totalsupply,
    );
    console.log(colors.bold(colors.yellow('Price:')), params.price);
    console.log(
      colors.bold(colors.yellow('Address of total supply holder:')),
      signerAddress,
    );
  });

task(TASK_DEPLOY_ERC20_TRADABLE_VOTES)
  .addParam('privatekey', 'Deployer private key', '', types.string)
  .addParam('alchemykey', 'Alchemy Key', '', types.string)
  .addParam('name', 'Token name', 'ERC20 Token', types.string)
  .addParam('symbol', 'Token symbol', 'ERC20', types.string)
  .addParam('decimals', 'Token decimals', 18, types.int)
  .addParam(
    'totalsupply',
    'Supply of token will be transferred to deployer',
    1_000_000_000,
    types.int,
  )
  .addParam('price', 'Initial price of token', 2, types.int)
  .addParam('capitalsharerate', 'Capital share rate to vote', 5, types.int)
  .setAction(async (params: TaskDeployERC20TradableVotesParams, hre) => {
    const { signer } = preAction(hre, params);
    const signerAddress = await signer.getAddress();

    const factory = await hre.ethers.getContractFactory(
      'ERC20TradableVotesMintable',
      signer,
    );
    const erc20tv = await (
      await factory.deploy(
        params.name,
        params.symbol,
        params.decimals,
        params.price,
        params.capitalsharerate,
      )
    ).deployed();
    const tx = await erc20tv.mint(
      signerAddress,
      parseUnits(params.totalsupply, params.decimals),
    );
    await tx.wait();

    console.log(
      colors.bold(
        colors.green('ERC20TradableVotes contract successfully deployed:'),
      ),
    );
    console.log(colors.bold(colors.yellow('Address:')), erc20tv.address);
    console.log(colors.bold(colors.yellow('Name:')), params.name);
    console.log(colors.bold(colors.yellow('Symbol:')), params.symbol);
    console.log(colors.bold(colors.yellow('Decimals:')), params.decimals);
    console.log(
      colors.bold(colors.yellow('Total Supply:')),
      params.totalsupply,
    );
    console.log(colors.bold(colors.yellow('Initial price:')), params.price);
    console.log(
      colors.bold(colors.yellow('Capital share rate:')),
      params.capitalsharerate,
    );
    console.log(
      colors.bold(colors.yellow('Address of total supply holder:')),
      signerAddress,
    );
  });
