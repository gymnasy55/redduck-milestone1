// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract ERC20 is IERC20, IERC20Metadata {
    mapping(address => uint256) internal _balances;
    mapping(address => mapping(address => uint256)) internal _allowances;

    uint256 internal _totalSupply;

    string internal _name;
    string internal _symbol;
    uint8 internal _decimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) {
        (_name, _symbol, _decimals) = (name_, symbol_, decimals_);
    }

    function name() public view override returns (string memory) {
        return _name;
    }

    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount)
        public
        override
        returns (bool)
    {
        _transfer(msg.sender, to, amount);

        return true;
    }

    function allowance(address owner, address spender)
        public
        view
        override
        returns (uint256)
    {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount)
        public
        override
        returns (bool)
    {
        _approve(msg.sender, spender, amount);

        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        uint256 currentAllowance = allowance(from, to);
        require(currentAllowance >= amount, "transfer exceeds allowance");

        _approve(from, to, currentAllowance - amount);
        _transfer(from, to, amount);

        return true;
    }

    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) private {
        require(owner != address(0), "owner is zero address");
        require(spender != address(0), "spender is zero address");

        _allowances[owner][spender] = amount;

        emit Approval(owner, spender, amount);
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) private {
        require(from != address(0), "transfer from zero address");
        require(to != address(0), "transfer to zero address");
        uint256 balanceFrom = _balances[from];
        require(balanceFrom >= amount, "transfer amount exceeds balance");

        _balances[from] = balanceFrom - amount;
        _balances[to] += amount;

        emit Transfer(from, to, amount);
    }
}
