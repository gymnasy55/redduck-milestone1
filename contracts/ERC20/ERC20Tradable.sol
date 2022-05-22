// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.9;

import "./ERC20.sol";
import "../interfaces/ITradable.sol";

contract ERC20Tradable is ITradable, ERC20 {
    uint256 public constant DIVIDER = 10**18;

    uint256 internal _token0;
    uint256 internal _token1;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    )
        ERC20(name_, symbol_, decimals_)
    // solhint-disable-next-line no-empty-blocks
    {

    }

    function price() public view returns (uint256) {
        return (DIVIDER * _token0) / (_token1 > 0 ? _token1 : 1);
    }

    function liquidity()
        public
        view
        returns (uint256 amount, uint256 tokenAmount)
    {
        (amount, tokenAmount) = (_token0, _token1);
    }

    function addLiquidity(uint256 tokenAmount) external payable returns (bool) {
        uint256 amount = msg.value;
        require(amount > 0, "amount must be positive");
        require(tokenAmount > 0, "tokenAmount must be positive");

        _changeLiquidity(amount, tokenAmount, _add, _add);

        return true;
    }

    function buy() external payable returns (bool) {
        uint256 amount = msg.value;
        require(amount > 0, "amount must be positive");
        uint256 tokenAmount = amount / price() / DIVIDER;
        require(tokenAmount > 0, "tokenAmount must be positive");
        require(_token1 - tokenAmount > 0, "not enough liquidity");

        _changeLiquidity(amount, tokenAmount, _add, _sub);

        address sender = msg.sender;
        _transfer(address(this), sender, tokenAmount);

        emit Buy(sender, tokenAmount, amount);

        return true;
    }

    function sell(uint256 tokenAmount) external returns (bool) {
        require(tokenAmount > 0, "tokenAmount must be positive");
        uint256 amount = (tokenAmount * price()) / DIVIDER;
        require(amount > 0, "amount must be positive");
        require(_token0 - amount > 0, "not enough liquidity");

        _changeLiquidity(amount, tokenAmount, _sub, _add);

        address sender = msg.sender;
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, ) = sender.call{value: tokenAmount}("");
        require(success, "transfer failed");

        emit Sell(sender, amount, tokenAmount);

        return true;
    }

    function release(address recipient) external returns (bool) {
        address addr = address(this);
        uint256 freeAmount = addr.balance - _token0;
        uint256 freeTokenAmount = balanceOf(addr) - _token1;

        if (freeAmount > 0) {
            // solhint-disable-next-line avoid-low-level-calls
            (bool success, ) = recipient.call{value: freeAmount}("");
            require(success, "transfer failed");
        }

        if (freeTokenAmount > 0) {
            _transfer(addr, recipient, freeTokenAmount);
        }

        return true;
    }

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
