import { assert, expect } from 'chai';
import { BigNumber, constants, Event } from 'ethers';
import hre from 'hardhat';

import {
  ERC20TradableSetupTest,
  ERC20TradableSetupTestParams,
  ERC20TradableTokenDetails,
  TradableEventArgs,
} from './types';

import {
  calcGasValue,
  getBalanceAndTokenBalance,
  parseUnits,
  setBalance,
} from '../../helpers/ethers-helpers';
import { TokenDetails } from '../../helpers/types';
import { ERC20TradableMintable__factory } from '../../typechain';

describe('ERC20Tradable contract test', () => {
  const details: TokenDetails<ERC20TradableTokenDetails> = {
    name: 'ERC20 Tradable Token',
    symbol: 'ERC20T',
    decimals: 18,
    totalSupply: parseUnits(1_000_000_000, 18),
    liquidity: {
      amount: parseUnits(1_000_000, 18),
      tokenAmount: parseUnits(1_000_000, 18),
    },
    divider: BigNumber.from(10).pow(18),
    price: constants.Two.div(constants.One).mul(BigNumber.from(10).pow(18)),
  };

  const setupTest = async (
    params?: Partial<ERC20TradableSetupTestParams>,
  ): Promise<ERC20TradableSetupTest> => {
    const [deployer, account] = await hre.ethers.getSigners();
    const erc20t = await new ERC20TradableMintable__factory(deployer).deploy(
      details.name,
      details.symbol,
      details.decimals,
      params?.price ?? details.price.div(details.divider),
    );
    const zeroSigner = await hre.ethers.getSigner(constants.AddressZero);
    await erc20t.mint(deployer.address, details.totalSupply);
    await setBalance(
      hre.ethers.provider,
      deployer.address,
      details.liquidity.amount.mul(10),
    );

    if (params?.addLiquidity) {
      await erc20t.approve(erc20t.address, details.liquidity.tokenAmount);
      await erc20t.addLiquidity(details.liquidity.tokenAmount, {
        value: details.liquidity.amount,
      });
    }

    return {
      account,
      deployer,
      erc20t,
      zeroSigner,
    };
  };

  describe('Initial state', () => {
    it('Initial state should be correct', async () => {
      const { erc20t } = await setupTest();

      const [divider, price] = await Promise.all([
        erc20t.divider(),
        erc20t.price(),
      ]);

      expect(divider.toString()).eq(details.divider.toString());
      expect(price.toString()).eq(details.price.toString());
    });
  });

  describe('AddLiquidity', () => {
    it('AddLiquidity should revert', async () => {
      const { erc20t } = await setupTest();

      await erc20t.approve(erc20t.address, details.liquidity.tokenAmount);

      await expect(
        erc20t.addLiquidity(details.liquidity.tokenAmount, {
          value: 0,
        }),
      ).revertedWith('amount must be positive');
      await expect(
        erc20t.addLiquidity(details.liquidity.tokenAmount, {
          value: 0,
        }),
      ).revertedWith('amount must be positive');
      await expect(
        erc20t.addLiquidity(0, {
          value: details.liquidity.amount,
        }),
      ).revertedWith('tokenAmount must be positive');
    });

    it('AddLiquidity should change liquidity, balances, emit LiquidityChanged event', async () => {
      const { deployer, erc20t } = await setupTest();

      await erc20t.approve(erc20t.address, details.liquidity.tokenAmount);

      const amountBefore = await hre.ethers.provider.getBalance(
        deployer.address,
      );
      const tokenAmountBefore = await erc20t.balanceOf(deployer.address);

      const result = await erc20t.callStatic.addLiquidity(
        details.liquidity.tokenAmount,
        {
          value: details.liquidity.amount,
        },
      );

      const receipt = await (
        await erc20t.addLiquidity(details.liquidity.tokenAmount, {
          value: details.liquidity.amount,
        })
      ).wait();

      const events = receipt.events?.filter(
        (e: Event) => e.event === 'LiquidityChanged',
      );
      if (!events || events.length === 0 || !events[0].args) {
        assert.fail('LiquidityChanged event has not been emitted');
      }
      const [eSender, eTokenAmount, eAmount] = events[0]
        .args as TradableEventArgs;

      const gasValue = calcGasValue(receipt);
      const amountAfter = await hre.ethers.provider.getBalance(
        deployer.address,
      );
      const tokenAmountAfter = await erc20t.balanceOf(deployer.address);
      const liquidity = await erc20t.liquidity();

      expect(eSender).eq(deployer.address);
      expect(eTokenAmount.toString()).eq(
        details.liquidity.tokenAmount.toString(),
      );
      expect(eAmount.toString()).eq(details.liquidity.amount.toString());
      expect(result).eq(true);
      expect(liquidity.amount.toString(), 'Liquidity amounts do not equal').eq(
        details.liquidity.amount.toString(),
      );
      expect(
        liquidity.tokenAmount.toString(),
        'Liquidity token amounts do not equal',
      ).eq(details.liquidity.tokenAmount.toString());
      expect(amountAfter.toString(), 'Balances are not equal').eq(
        amountBefore.sub(liquidity.amount).sub(gasValue).toString(),
      );
      expect(tokenAmountAfter.toString(), 'Token balances are not equal').eq(
        tokenAmountBefore.sub(liquidity.tokenAmount).toString(),
      );
    });
  });

  describe('Buy', () => {
    it('Buy should revert', async () => {
      const { erc20t } = await setupTest({ addLiquidity: true });

      await expect(erc20t.buy({ value: constants.Zero })).revertedWith(
        'amount must be positive',
      );
      await expect(erc20t.buy({ value: constants.One })).revertedWith(
        'tokenAmount must be positive',
      );

      await erc20t.buy({ value: details.liquidity.amount.div(2) });

      await expect(
        erc20t.buy({ value: details.liquidity.amount.div(2).mul(3) }),
      ).revertedWith('not enough liquidity');
    });

    it('Buy should change liquidity, balances, emit LiquidityChanged and Buy events', async () => {
      const { deployer, erc20t } = await setupTest({ addLiquidity: true });

      const [amountBefore, tokenAmountBefore] = await getBalanceAndTokenBalance(
        hre.ethers.provider,
        deployer.address,
        erc20t,
      );

      const result = await erc20t.callStatic.buy({
        value: details.liquidity.amount,
      });

      const receipt = await (
        await erc20t.buy({ value: details.liquidity.amount })
      ).wait();

      const [lcEvents, bEvents] = [
        receipt.events?.filter((e: Event) => e.event === 'LiquidityChanged'),
        receipt.events?.filter((e: Event) => e.event === 'Buy'),
      ];

      if (!lcEvents || lcEvents.length === 0 || !lcEvents[0].args) {
        assert.fail('LiquidityChanged event has not been emitted');
      }

      if (!bEvents || bEvents.length === 0 || !bEvents[0].args) {
        assert.fail('Buy event has not been emitted');
      }

      const [
        [lcSender, lcTokenAmount, lcAmount],
        [bSender, bTokenAmount, bAmount],
      ] = [
        lcEvents[0].args as TradableEventArgs,
        bEvents[0].args as TradableEventArgs,
      ];

      const gasValue = calcGasValue(receipt);

      const [amountAfter, tokenAmountAfter] = await getBalanceAndTokenBalance(
        hre.ethers.provider,
        deployer.address,
        erc20t,
      );

      expect(result, 'result is not true').eq(true);
      expect(lcSender, 'lcSender is not deployer address').eq(deployer.address);
      expect(bSender, 'bSender is not deployer address').eq(deployer.address);
      expect(lcTokenAmount.toString(), 'lcTokenAmount is not correct').eq(
        details.liquidity.tokenAmount
          .sub(details.liquidity.amount.div(details.price.div(details.divider)))
          .toString(),
      );
      expect(bTokenAmount.toString(), 'bTokenAmount is not correct').eq(
        details.liquidity.amount
          .div(details.price.div(details.divider))
          .toString(),
      );
      expect(lcAmount.toString(), 'lcAmount is not correct').eq(
        details.liquidity.amount.add(details.liquidity.amount).toString(),
      );
      expect(bAmount.toString(), 'bAmount is not correct').eq(
        details.liquidity.amount.toString(),
      );
      expect(amountAfter.toString(), 'amountAfter is not correct').eq(
        amountBefore.sub(gasValue).sub(details.liquidity.amount).toString(),
      );
      expect(tokenAmountAfter.toString(), 'tokenAmountAfter is not correct').eq(
        tokenAmountBefore
          .add(details.liquidity.amount.div(details.price.div(details.divider)))
          .toString(),
      );
    });
  });

  describe('Sell', () => {
    it('Sell should revert', async () => {
      const { erc20t: erc20t0 } = await setupTest({
        addLiquidity: true,
        price: constants.Zero,
      });

      await erc20t0.approve(erc20t0.address, details.liquidity.tokenAmount);

      await expect(erc20t0.sell(constants.Zero)).revertedWith(
        'tokenAmount must be positive',
      );
      await expect(erc20t0.sell(constants.One)).revertedWith(
        'amount must be positive',
      );

      const { erc20t } = await setupTest({
        addLiquidity: true,
      });

      await erc20t.approve(erc20t.address, details.liquidity.tokenAmount);
      await expect(erc20t.sell(details.liquidity.tokenAmount)).revertedWith(
        'not enough liquidity',
      );
    });

    it('Sell should change liquidity, balances, emit LiquidityChanged and Sell events', async () => {
      const { deployer, erc20t } = await setupTest({ addLiquidity: true });

      const [amountBefore, tokenAmountBefore] = await getBalanceAndTokenBalance(
        hre.ethers.provider,
        deployer.address,
        erc20t,
      );

      const toSell = details.liquidity.tokenAmount.div(3);
      const toBuy = toSell.mul(details.price).div(details.divider);

      const approveReceipt = await (
        await erc20t.approve(erc20t.address, toSell)
      ).wait();

      const result = await erc20t.callStatic.sell(toSell);

      const receipt = await (await erc20t.sell(toSell)).wait();

      const [lcEvents, sEvents] = [
        receipt.events?.filter((e: Event) => e.event === 'LiquidityChanged'),
        receipt.events?.filter((e: Event) => e.event === 'Sell'),
      ];

      if (!lcEvents || lcEvents.length === 0 || !lcEvents[0].args) {
        assert.fail('LiquidityChanged event has not been emitted');
      }

      if (!sEvents || sEvents.length === 0 || !sEvents[0].args) {
        assert.fail('Sell event has not been emitted');
      }

      const [
        [lcSender, lcTokenAmount, lcAmount],
        [sSender, sAmount, sTokenAmount],
      ] = [
        lcEvents[0].args as TradableEventArgs,
        sEvents[0].args as TradableEventArgs,
      ];

      const gasValue = calcGasValue(receipt).add(calcGasValue(approveReceipt));

      const [amountAfter, tokenAmountAfter] = await getBalanceAndTokenBalance(
        hre.ethers.provider,
        deployer.address,
        erc20t,
      );

      expect(result, 'result is not true').eq(true);
      expect(lcSender, 'lcSender is not deployer address').eq(deployer.address);
      expect(sSender, 'sSender is not deployer address').eq(deployer.address);
      expect(lcTokenAmount.toString(), 'lcTokenAmount is not correct').eq(
        details.liquidity.tokenAmount.add(toSell).toString(),
      );
      expect(lcAmount.toString(), 'lcAmount is not correct').eq(
        details.liquidity.amount.sub(toBuy).toString(),
      );
      expect(sTokenAmount.toString(), 'sTokenAmount is not correct').eq(
        toSell.toString(),
      );
      expect(sAmount.toString(), 'sAmount is not correct').eq(toBuy.toString());
      expect(amountAfter.toString(), 'amountAfter is not correct').eq(
        amountBefore.add(toBuy).sub(gasValue).toString(),
      );
      expect(tokenAmountAfter.toString(), 'tokenAmountAfter is not correct').eq(
        tokenAmountBefore.sub(toSell).toString(),
      );
    });
  });

  describe('Release', () => {
    it('Release should revert', async () => {
      const { deployer, erc20t, zeroSigner } = await setupTest({
        addLiquidity: true,
      });

      await expect(erc20t.release(zeroSigner.address)).revertedWith(
        'recipient is zero address',
      );
      await expect(erc20t.release(deployer.address)).revertedWith(
        'nothing to transfer',
      );
    });

    it('Release should change balances', async () => {
      const { deployer, erc20t } = await setupTest({
        addLiquidity: true,
      });

      const releaseAmount = parseUnits(10);
      const releaseTokenAmount = parseUnits(100, details.decimals);

      await deployer.sendTransaction({
        to: erc20t.address,
        value: releaseAmount,
      });
      await erc20t.transfer(erc20t.address, releaseTokenAmount);

      let [amountBefore, tokenAmountBefore] = await getBalanceAndTokenBalance(
        hre.ethers.provider,
        deployer.address,
        erc20t,
      );

      let result = await erc20t.callStatic.release(deployer.address);

      expect(result, 'result is not true').eq(true);
      let receipt = await (await erc20t.release(deployer.address)).wait();

      let gasValue = calcGasValue(receipt);

      let [amountAfter, tokenAmountAfter] = await getBalanceAndTokenBalance(
        hre.ethers.provider,
        deployer.address,
        erc20t,
      );

      expect(amountAfter.toString(), 'amountAfter is not correct').eq(
        amountBefore.add(releaseAmount).sub(gasValue).toString(),
      );
      expect(tokenAmountAfter.toString(), 'tokenAmountAfter is not correct').eq(
        tokenAmountBefore.add(releaseTokenAmount).toString(),
      );

      await deployer.sendTransaction({
        to: erc20t.address,
        value: releaseAmount,
      });
      [amountBefore, tokenAmountBefore] = await getBalanceAndTokenBalance(
        hre.ethers.provider,
        deployer.address,
        erc20t,
      );
      result = await erc20t.callStatic.release(deployer.address);
      expect(result, 'result is not true').eq(true);
      receipt = await (await erc20t.release(deployer.address)).wait();
      gasValue = calcGasValue(receipt);
      [amountAfter, tokenAmountAfter] = await getBalanceAndTokenBalance(
        hre.ethers.provider,
        deployer.address,
        erc20t,
      );
      expect(amountAfter.toString(), 'amountAfter is not correct').eq(
        amountBefore.add(releaseAmount).sub(gasValue),
      );
      expect(
        tokenAmountBefore.toString(),
        'tokenAmountAfter is not correct',
      ).eq(tokenAmountAfter.toString());

      await erc20t.transfer(erc20t.address, releaseTokenAmount);
      [amountBefore, tokenAmountBefore] = await getBalanceAndTokenBalance(
        hre.ethers.provider,
        deployer.address,
        erc20t,
      );
      result = await erc20t.callStatic.release(deployer.address);
      expect(result, 'result is not true').eq(true);
      receipt = await (await erc20t.release(deployer.address)).wait();
      gasValue = calcGasValue(receipt);
      [amountAfter, tokenAmountAfter] = await getBalanceAndTokenBalance(
        hre.ethers.provider,
        deployer.address,
        erc20t,
      );
      expect(amountAfter.toString(), 'amountAfter is not correct').eq(
        amountBefore.sub(gasValue),
      );
      expect(tokenAmountAfter.toString(), 'tokenAmountAfter is not correct').eq(
        tokenAmountBefore.add(releaseTokenAmount).toString(),
      );
    });
  });
});
