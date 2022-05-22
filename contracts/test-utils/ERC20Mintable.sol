// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.9;

import "../ERC20/ERC20.sol";

contract ERC20Mintable is ERC20 {
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    )
        ERC20(name_, symbol_, decimals_)
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
