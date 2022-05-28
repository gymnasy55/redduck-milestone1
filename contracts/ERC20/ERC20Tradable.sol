// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.9;

import "./ERC20.sol";
import "../interfaces/ITradable.sol";

/**
 * @title ERC20Tradable
 * @notice ERC20 contract that allows to trade tokens.
 * @author Ilya Kubariev <ilya.kubariev@redduck.io>
 */
contract ERC20Tradable is ITradable, ERC20 {
    /**
     * @return divider - returns divider for price.
     */
    uint256 public immutable divider;

    uint256 internal _token0;
    uint256 internal _token1;
    uint256 internal _price;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 price_
    ) ERC20(name_, symbol_, decimals_) {
        divider = 10**decimals_;
        _price = price_;
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    /**
     * @inheritdoc ITradable
     */
    function price() public view virtual returns (uint256) {
        return _price * divider;
    }

    /**
     * @inheritdoc ITradable
     */
    function liquidity()
        public
        view
        returns (uint256 amount, uint256 tokenAmount)
    {
        (amount, tokenAmount) = (_token0, _token1);
    }

    /**
     * @inheritdoc ITradable
     */
    function addLiquidity(uint256 tokenAmount) external payable returns (bool) {
        uint256 amount = msg.value;
        require(amount > 0, "amount must be positive");
        require(tokenAmount > 0, "tokenAmount must be positive");

        _changeLiquidity(amount, tokenAmount, _add, _add);

        transferFrom(msg.sender, address(this), tokenAmount);

        return true;
    }

    /**
     * @inheritdoc ITradable
     */
    function buy() external payable returns (bool) {
        uint256 amount = msg.value;
        require(amount > 0, "amount must be positive");
        uint256 tokenAmount = amount / (price() / divider);
        require(tokenAmount > 0, "tokenAmount must be positive");
        require(
            int256(_token1) - int256(tokenAmount) > 0,
            "not enough liquidity"
        );

        _changeLiquidity(amount, tokenAmount, _add, _sub);

        address sender = msg.sender;
        _transfer(address(this), sender, tokenAmount);

        emit Buy(sender, tokenAmount, amount);

        return true;
    }

    /**
     * @inheritdoc ITradable
     */
    function sell(uint256 tokenAmount) external returns (bool) {
        require(tokenAmount > 0, "tokenAmount must be positive");
        uint256 amount = (tokenAmount * price()) / divider;
        require(amount > 0, "amount must be positive");
        require(int256(_token0) - int256(amount) > 0, "not enough liquidity");

        _changeLiquidity(amount, tokenAmount, _sub, _add);

        address sender = msg.sender;
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, ) = sender.call{value: amount}("");
        require(success, "transfer failed");

        transferFrom(sender, address(this), tokenAmount);

        emit Sell(sender, amount, tokenAmount);

        return true;
    }

    /**
     * @inheritdoc ITradable
     */
    function release(address recipient) external returns (bool) {
        require(recipient != address(0), "recipient is zero address");
        address addr = address(this);
        uint256 freeAmount = addr.balance - _token0;
        uint256 freeTokenAmount = balanceOf(addr) - _token1;
        require(freeAmount > 0 || freeTokenAmount > 0, "nothing to transfer");

        if (freeTokenAmount > 0) {
            _transfer(addr, recipient, freeTokenAmount);
        }

        if (freeAmount > 0) {
            // solhint-disable-next-line avoid-low-level-calls
            (bool success, ) = recipient.call{value: freeAmount}("");
            require(success, "transfer failed");
        }

        return true;
    }

    /**
     * @dev internal func to change liquidity in different ways.
     * @param amount - ether amount to change in liquidity.
     * @param tokenAmount - token amount to change in liquidity.
     * @param op0 - function to apply to ether liquidity.
     * @param op1 - function to apply to token liquidity.
     */
    function _changeLiquidity(
        uint256 amount,
        uint256 tokenAmount,
        function(uint256, uint256) pure returns (uint256) op0,
        function(uint256, uint256) pure returns (uint256) op1
    ) internal {
        _token0 = op0(_token0, amount);
        _token1 = op1(_token1, tokenAmount);

        emit LiquidityChanged(msg.sender, _token1, _token0);
    }

    function _add(uint256 first, uint256 second)
        private
        pure
        returns (uint256)
    {
        return first + second;
    }

    function _sub(uint256 first, uint256 second)
        private
        pure
        returns (uint256)
    {
        return first - second;
    }
}
