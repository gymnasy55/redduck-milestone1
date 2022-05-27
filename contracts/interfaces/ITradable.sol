// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.9;

interface ITradable {
    event Buy(address indexed account, uint256 tokenAmount, uint256 amount);
    event Sell(address indexed account, uint256 amount, uint256 tokenAmount);
    event LiquidityChanged(
        address indexed account,
        uint256 tokenAmount,
        uint256 amount
    );

    function price() external view returns (uint256);

    function liquidity()
        external
        view
        returns (uint256 amount, uint256 tokenAmount);

    function addLiquidity(uint256 tokenAmount) external payable returns (bool);

    function buy() external payable returns (bool);

    function sell(uint256 tokenAmount) external returns (bool);

    /**
     * @dev send surplus of token and eth to recipient
     */
    function release(address recipient) external returns (bool);
}
