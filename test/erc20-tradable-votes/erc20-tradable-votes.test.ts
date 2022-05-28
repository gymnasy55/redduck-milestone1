import { assert, expect } from 'chai';
import { BigNumber, constants, Event } from 'ethers';
import hre from 'hardhat';

import {
  ERC20TradableVotesSetupTest,
  ERC20TradableVotesSetupTestParams,
  ERC20TradableVotesTokenDetails,
  VotingStartedEventArgs,
} from './types';

import { increaseTime, parseUnits } from '../../helpers/ethers-helpers';
import { convertDaysToSeconds } from '../../helpers/math-helpers';
import { TokenDetails } from '../../helpers/types';
import { ERC20TradableVotesMintable__factory } from '../../typechain';

describe('ERC20TradableVotes contract test', () => {
  const details: TokenDetails<ERC20TradableVotesTokenDetails> = {
    name: 'ERC20 Tradable Votes Token',
    symbol: 'ERC20TV',
    decimals: 18,
    totalSupply: parseUnits(1_000_000_000, 18),
    divider: BigNumber.from(10).pow(18),
    price: constants.Two.div(constants.One).mul(BigNumber.from(10).pow(18)),
    capitalShareRate: 5,
    suggestedPrice: BigNumber.from(3).mul(BigNumber.from(10).pow(18)),
    duration: BigNumber.from(convertDaysToSeconds(5)),
  };

  const setupTest = async (
    params?: Partial<ERC20TradableVotesSetupTestParams>,
  ): Promise<ERC20TradableVotesSetupTest> => {
    const [deployer, account] = await hre.ethers.getSigners();
    const erc20tv = await new ERC20TradableVotesMintable__factory(
      deployer,
    ).deploy(
      details.name,
      details.symbol,
      details.decimals,
      details.price.div(details.divider),
      details.capitalShareRate,
    );
    const zeroSigner = await hre.ethers.getSigner(constants.AddressZero);
    await erc20tv.mint(deployer.address, details.totalSupply);
    await erc20tv.transfer(
      account.address,
      parseUnits(1_000, details.decimals),
    );

    return {
      account,
      deployer,
      erc20tv,
      zeroSigner,
    };
  };

  describe('Initial state', () => {
    it('Initial state should be correct', async () => {
      const { erc20tv } = await setupTest();

      const [
        capitalShareRate,
        price,
        suggestedPrice,
        acceptPower,
        rejectPower,
        votingNumber,
      ] = await Promise.all([
        erc20tv.capitalShareRate(),
        erc20tv.price(),
        erc20tv.suggestedPrice(),
        erc20tv.acceptPower(),
        erc20tv.rejectPower(),
        erc20tv.lastVotingNumber(),
      ]);

      expect(capitalShareRate).eq(details.capitalShareRate);
      expect(price.toString()).eq(details.price.toString());
      expect(suggestedPrice.toString()).eq(constants.Zero.toString());
      expect(acceptPower.toString()).eq(constants.Zero.toString());
      expect(rejectPower.toString()).eq(constants.Zero.toString());
      expect(votingNumber.toString()).eq(constants.Zero.toString());
    });
  });

  describe('IsWhale', () => {
    it('IsWhale should return correct value', async () => {
      const { account, deployer, erc20tv } = await setupTest();

      const [aWhale, dWhale] = await Promise.all([
        erc20tv.isWhale(account.address),
        erc20tv.isWhale(deployer.address),
      ]);

      expect(aWhale, 'Account should not be a whale').eq(false);
      expect(dWhale, 'Deployer should be a whale').eq(true);
    });
  });

  describe('StartVoting', () => {
    it('StartVoting should revert', async () => {
      const { account, erc20tv } = await setupTest();

      await expect(
        erc20tv
          .connect(account)
          .startVoting(
            details.suggestedPrice.div(details.divider),
            details.duration,
          ),
      ).revertedWith('not a whale');
      await expect(erc20tv.startVoting(0, details.duration)).revertedWith(
        'suggestedPrice must be positive',
      );
      await expect(
        erc20tv.startVoting(details.suggestedPrice.div(details.divider), 0),
      ).revertedWith('duration must be positive');

      await erc20tv.startVoting(
        details.suggestedPrice.div(details.divider),
        details.duration,
      );
      await expect(
        erc20tv.startVoting(
          details.suggestedPrice.div(details.divider),
          details.duration,
        ),
      ).revertedWith('voting has already started');
    });

    it('StartVoting should change suggestedPrice, duration, votingStartedTime, votingNumber, emit VotingStarted event', async () => {
      const { deployer, erc20tv } = await setupTest();

      const result = await erc20tv.callStatic.startVoting(
        details.suggestedPrice.div(details.divider),
        details.duration,
      );

      expect(result, 'result should be true').eq(true);

      const receipt = await (
        await erc20tv.startVoting(
          details.suggestedPrice.div(details.divider),
          details.duration,
        )
      ).wait();

      const events = receipt.events?.filter(
        (e: Event) => e.event === 'VotingStart',
      );
      if (!events || events.length === 0 || !events[0].args) {
        assert.fail('VotingStart event has not been emitted');
      }

      const [eSender, eSuggestedPrice, eDuration, eVotingNumber] = events[0]
        .args as VotingStartedEventArgs;

      expect(eSender).eq(deployer.address);
      expect(eSuggestedPrice.toString()).eq(
        details.suggestedPrice.div(details.divider).toString(),
      );
      expect(eDuration.toString()).eq(details.duration.toString());
      expect(eVotingNumber.toString()).eq(constants.One.toString());

      const [suggestedPrice, duration, votingStartedTime, votingNumber] =
        await Promise.all([
          erc20tv.suggestedPrice(),
          erc20tv.votingDuration(),
          erc20tv.votingStartedTime(),
          erc20tv.lastVotingNumber(),
        ]);

      expect(suggestedPrice.toString(), 'suggestedPrice is not correct').eq(
        details.suggestedPrice.toString(),
      );
      expect(duration.toString(), 'duration is not correct').eq(
        details.duration.toString(),
      );
      expect(
        votingStartedTime.toString(),
        'votingStartedTime is not correct',
      ).eq(
        (
          await hre.ethers.provider.getBlock(receipt.blockHash)
        ).timestamp.toString(),
      );
      expect(votingNumber.toString(), 'duration is not correct').eq(
        constants.One.toString(),
      );
    });
  });

  describe('Vote', () => {
    it('Vote should revert', async () => {
      const { account, erc20tv } = await setupTest();

      await expect(erc20tv.connect(account).vote(true)).revertedWith(
        'not a whale',
      );
      await expect(erc20tv.vote(true)).revertedWith(
        'voting has not been started',
      );
      await erc20tv.startVoting(
        details.suggestedPrice.div(details.divider),
        details.duration,
      );
      await erc20tv.vote(true);
      await expect(erc20tv.vote(true)).revertedWith('already voted');
      await increaseTime(hre.ethers.provider, details.duration.toNumber() + 1);
      await expect(erc20tv.vote(true)).revertedWith('voting ended');
    });

    it('Vote should change acceptPower, rejectPower, emit Vote event', async () => {
      const { account, deployer, erc20tv } = await setupTest();

      await erc20tv.transfer(
        account.address,
        parseUnits(50_000_000, details.decimals),
      );

      const dPower = await erc20tv.balanceOf(deployer.address);
      const aPower = await erc20tv.balanceOf(account.address);

      await erc20tv.startVoting(
        details.suggestedPrice.div(details.divider),
        details.duration,
      );

      const dResult = await erc20tv.callStatic.vote(true);
      const aResult = await erc20tv.connect(account).callStatic.vote(false);

      expect(dResult).eq(true);
      expect(aResult).eq(true);

      await expect(erc20tv.vote(true))
        .emit(erc20tv, 'Vote')
        .withArgs(deployer.address, true, dPower);

      await expect(erc20tv.connect(account).vote(false))
        .emit(erc20tv, 'Vote')
        .withArgs(account.address, false, aPower);

      const [acceptPower, rejectPower] = await Promise.all([
        erc20tv.acceptPower(),
        erc20tv.rejectPower(),
      ]);

      expect(acceptPower.toString()).eq(dPower.toString());
      expect(rejectPower.toString()).eq(aPower.toString());
    });
  });

  describe('EndVoting', () => {
    it('EndVoting should revert', async () => {
      const { erc20tv } = await setupTest();

      await expect(erc20tv.endVoting()).revertedWith(
        'voting has not been started',
      );

      await erc20tv.startVoting(
        details.suggestedPrice.div(details.divider),
        details.duration,
      );
      await expect(erc20tv.endVoting()).revertedWith('voting is in progress');
    });

    it('EndVoting should change price and should change suggestedPrice, duration, votingStartedTime, acceptPower, rejectPower, emit VotingEnd event', async () => {
      const { account, deployer, erc20tv } = await setupTest();

      await erc20tv.transfer(
        account.address,
        parseUnits(50_000_000, details.decimals),
      );

      const aPower = await erc20tv.balanceOf(account.address);
      const dPower = await erc20tv.balanceOf(deployer.address);

      await erc20tv.startVoting(
        details.suggestedPrice.div(details.divider),
        details.duration,
      );
      await erc20tv.connect(account).vote(false);
      await erc20tv.vote(true);

      await increaseTime(
        hre.ethers.provider,
        convertDaysToSeconds(details.duration.toNumber()) + 1,
      );

      const result = await erc20tv.callStatic.endVoting();

      expect(result).eq(true);
      await expect(erc20tv.endVoting())
        .emit(erc20tv, 'VotingEnd')
        .withArgs(
          deployer.address,
          details.price.div(details.divider),
          details.suggestedPrice.div(details.divider),
          dPower,
          aPower,
        );

      const [
        price,
        suggestedPrice,
        duration,
        votingStartedTime,
        acceptPower,
        rejectPower,
      ] = await Promise.all([
        erc20tv.price(),
        erc20tv.suggestedPrice(),
        erc20tv.votingDuration(),
        erc20tv.votingStartedTime(),
        erc20tv.acceptPower(),
        erc20tv.rejectPower(),
      ]);

      expect(price.toString()).eq(details.suggestedPrice.toString());
      expect(suggestedPrice.toString()).eq(constants.Zero.toString());
      expect(duration.toString()).eq(constants.Zero.toString());
      expect(votingStartedTime.toString()).eq(constants.Zero.toString());
      expect(acceptPower.toString()).eq(constants.Zero.toString());
      expect(rejectPower.toString()).eq(constants.Zero.toString());
    });

    it('EndVoting should not change price and should change suggestedPrice, duration, votingStartedTime, acceptPower, rejectPower, emit VotingEnd event', async () => {
      const { account, deployer, erc20tv } = await setupTest();

      await erc20tv.transfer(
        account.address,
        parseUnits(50_000_000, details.decimals),
      );

      const aPower = await erc20tv.balanceOf(account.address);
      const dPower = await erc20tv.balanceOf(deployer.address);

      await erc20tv.startVoting(
        details.suggestedPrice.div(details.divider),
        details.duration,
      );
      await erc20tv.connect(account).vote(true);
      await erc20tv.vote(false);

      await increaseTime(
        hre.ethers.provider,
        convertDaysToSeconds(details.duration.toNumber()) + 1,
      );

      const result = await erc20tv.callStatic.endVoting();

      expect(result).eq(true);
      await expect(erc20tv.endVoting())
        .emit(erc20tv, 'VotingEnd')
        .withArgs(
          deployer.address,
          details.price.div(details.divider),
          details.suggestedPrice.div(details.divider),
          aPower,
          dPower,
        );

      const [
        price,
        suggestedPrice,
        duration,
        votingStartedTime,
        acceptPower,
        rejectPower,
      ] = await Promise.all([
        erc20tv.price(),
        erc20tv.suggestedPrice(),
        erc20tv.votingDuration(),
        erc20tv.votingStartedTime(),
        erc20tv.acceptPower(),
        erc20tv.rejectPower(),
      ]);

      expect(price.toString()).eq(details.price.toString());
      expect(suggestedPrice.toString()).eq(constants.Zero.toString());
      expect(duration.toString()).eq(constants.Zero.toString());
      expect(votingStartedTime.toString()).eq(constants.Zero.toString());
      expect(acceptPower.toString()).eq(constants.Zero.toString());
      expect(rejectPower.toString()).eq(constants.Zero.toString());
    });
  });
});
