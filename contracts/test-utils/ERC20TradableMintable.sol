// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.9;

import "../ERC20/ERC20.sol";
import "../ERC20/ERC20Tradable.sol";
import "./ERC20Mintable.sol";

contract ERC20TradableMintable is ERC20Tradable {
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 price_
    )
        ERC20Tradable(name_, symbol_, decimals_, price_)
    // solhint-disable-next-line no-empty-blocks
    {

    }

    function mint(address account, uint256 amount) public {
        require(account != address(0), "mint to zero address");

        _totalSupply += amount;
        _balances[account] += amount;

        emit Transfer(address(0), account, amount);
    }
}
