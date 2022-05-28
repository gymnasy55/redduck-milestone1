// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.9;

/**
 * @title ITradable
 * @notice interface for Tradable tokens.
 * @author Ilya Kubariev <ilya.kubariev@redduck.io>
 */
interface ITradable {
    /**
     * @notice emits whenever {buy} called.
     * @param account - initiator of {buy} tokens.
     * @param tokenAmount - token amount that account received.
     * @param amount - ether amount that account spent.
     */
    event Buy(address indexed account, uint256 tokenAmount, uint256 amount);

    /**
     * @notice emits whenever {sell} called.
     * @param account - initiator of {sell} tokens.
     * @param amount - ether amount that account received.
     * @param tokenAmount - token amount that account sold.
     */
    event Sell(address indexed account, uint256 amount, uint256 tokenAmount);

    /**
     * @notice emits whenever {addLiquidity}, {buy} or {sell} called.
     * @param account - initiator of {addLiquidity}, {buy} or {sell} tokens.
     * @param amount - ether amount of new liquidity.
     * @param tokenAmount - token amount of new liquidity.
     */
    event LiquidityChanged(
        address indexed account,
        uint256 tokenAmount,
        uint256 amount
    );

    /**
     * @return currect price of token.
     */
    function price() external view returns (uint256);

    /**
     * @return amount - ether amount of liquidity.
     * @return tokenAmount - token amount of liquidity.
     */
    function liquidity()
        external
        view
        returns (uint256 amount, uint256 tokenAmount);

    /**
     * @notice add ether and token liquidity.
     * @dev to ether liquidity will be added `msg.value`.
     * @param tokenAmount - token amount to add to liquidity.
     * @return true if succeeded.
     */
    function addLiquidity(uint256 tokenAmount) external payable returns (bool);

    /**
     * @notice buy token with ether at {price}.
     * @dev to ether liquidity will be added `msg.value`.
     * @return true if succeeded.
     */
    function buy() external payable returns (bool);

    /**
     * @notice sell token to ether at {price}.
     * @dev to token liquidity will be added `tokenAmount`.
     * @param tokenAmount - sell this amount of tokens.
     * @return true if succeeded.
     */
    function sell(uint256 tokenAmount) external returns (bool);

    /**
     * @notice send surplus of tokens and eth.
     * @param recipient - surplus destination address.
     * @return true if succeeded.
     */
    function release(address recipient) external returns (bool);
}
