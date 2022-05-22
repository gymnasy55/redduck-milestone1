import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { constants } from 'ethers';
import hre from 'hardhat';

import { parseUnits } from '../helpers/ethers-helpers';
import { ERC20, ERC20Mintable__factory } from '../typechain';

interface ERC20SetupTest {
  account: SignerWithAddress;
  deployer: SignerWithAddress;
  erc20: ERC20;
  zeroSigner: SignerWithAddress;
}

describe('ERC20 contract test', () => {
  const expectedName = 'ERC20 Token';
  const expectedSymbol = 'ERC20';
  const expectedDecimals = 18;
  const expectedTotalSupply = parseUnits(1_000_000_000, expectedDecimals);
  const expectedApproveAmount = parseUnits(100, expectedDecimals);

  const setupTest = async (): Promise<ERC20SetupTest> => {
    const [deployer, account] = await hre.ethers.getSigners();
    const erc20 = await new ERC20Mintable__factory(deployer).deploy(
      expectedName,
      expectedSymbol,
      expectedDecimals,
    );
    const zeroSigner = await hre.ethers.getSigner(constants.AddressZero);
    await erc20.mint(deployer.address, expectedTotalSupply);

    return {
      account,
      deployer,
      erc20,
      zeroSigner,
    };
  };

  it('Initial state should be correct', async () => {
    const { deployer, erc20 } = await setupTest();

    const [
      actualName,
      actualSymbol,
      actualTotalSupply,
      actualDecimals,
      deployerBalance,
    ] = await Promise.all([
      erc20.name(),
      erc20.symbol(),
      erc20.totalSupply(),
      erc20.decimals(),
      erc20.balanceOf(deployer.address),
    ]);

    expect(actualName).eq(expectedName);
    expect(actualSymbol).eq(expectedSymbol);
    expect(actualTotalSupply.toString()).eq(expectedTotalSupply.toString());
    expect(actualDecimals).eq(expectedDecimals);
    expect(deployerBalance.toString()).eq(expectedTotalSupply.toString());
  });

  it('Approve should revert', async () => {
    const { deployer, erc20, zeroSigner } = await setupTest();

    await expect(
      erc20
        .connect(zeroSigner)
        .approve(deployer.address, expectedApproveAmount),
    ).revertedWith('owner is zero address');
    await expect(
      erc20.approve(zeroSigner.address, expectedApproveAmount),
    ).revertedWith('spender is zero address');
  });

  it('Approve should return true, change allowance and emit Approval event', async () => {
    const { deployer, erc20, account } = await setupTest();

    const approveResult = await erc20.callStatic.approve(
      account.address,
      expectedApproveAmount,
    );

    expect(approveResult).eq(true);
    await expect(erc20.approve(account.address, expectedApproveAmount))
      .emit(erc20, 'Approval')
      .withArgs(deployer.address, account.address, expectedApproveAmount);

    const allowance = await erc20.allowance(deployer.address, account.address);
    expect(allowance.toString()).eq(expectedApproveAmount.toString());
  });

  it('Transfer should revert', async () => {
    const { deployer, erc20, account, zeroSigner } = await setupTest();

    await expect(
      erc20
        .connect(zeroSigner)
        .transfer(deployer.address, expectedApproveAmount),
    ).revertedWith('transfer from zero address');
    await expect(
      erc20.transfer(zeroSigner.address, expectedApproveAmount),
    ).revertedWith('transfer to zero address');
    await expect(
      erc20.connect(account).transfer(deployer.address, expectedApproveAmount),
    ).revertedWith('transfer amount exceeds balance');
  });

  it('Transfer should return true, change balances and emit Transfer event', async () => {
    const { deployer, erc20, account } = await setupTest();

    const transferResult = await erc20.callStatic.transfer(
      account.address,
      expectedApproveAmount,
    );

    expect(transferResult).eq(true);
    await expect(erc20.transfer(account.address, expectedApproveAmount))
      .emit(erc20, 'Transfer')
      .withArgs(deployer.address, account.address, expectedApproveAmount);

    const deployerBalance = await erc20.balanceOf(deployer.address);
    const accountBalance = await erc20.balanceOf(account.address);

    expect(deployerBalance.toString()).eq(
      expectedTotalSupply.sub(expectedApproveAmount).toString(),
    );
    expect(accountBalance.toString()).eq(expectedApproveAmount.toString());
  });

  it('TransferFrom should revert', async () => {
    const { deployer, erc20, account } = await setupTest();

    await expect(
      erc20.transferFrom(
        deployer.address,
        account.address,
        expectedApproveAmount,
      ),
    ).revertedWith('transfer exceeds allowance');

    await expect(erc20.approve(account.address, expectedApproveAmount))
      .emit(erc20, 'Approval')
      .withArgs(deployer.address, account.address, expectedApproveAmount);
  });

  it('TransferFrom should return true, change balances, change allowances and emit Transfer event', async () => {
    const { deployer, erc20, account } = await setupTest();

    await expect(erc20.approve(account.address, expectedApproveAmount))
      .emit(erc20, 'Approval')
      .withArgs(deployer.address, account.address, expectedApproveAmount);

    const transferFromResult = await erc20.callStatic.transferFrom(
      deployer.address,
      account.address,
      expectedApproveAmount,
    );

    expect(transferFromResult).eq(true);
    await expect(
      erc20.transferFrom(
        deployer.address,
        account.address,
        expectedApproveAmount,
      ),
    )
      .emit(erc20, 'Approval')
      .withArgs(deployer.address, account.address, constants.Zero)
      .and.emit(erc20, 'Transfer')
      .withArgs(deployer.address, account.address, expectedApproveAmount);

    const allowance = await erc20.allowance(deployer.address, account.address);
    const deployerBalance = await erc20.balanceOf(deployer.address);
    const accountBalance = await erc20.balanceOf(account.address);

    expect(allowance.toString()).eq(constants.Zero.toString());
    expect(deployerBalance.toString()).eq(
      expectedTotalSupply.sub(expectedApproveAmount).toString(),
    );
    expect(accountBalance.toString()).eq(expectedApproveAmount.toString());
  });
});
