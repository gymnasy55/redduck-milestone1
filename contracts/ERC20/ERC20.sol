// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/**
 * @title ERC20
 * @notice Default ERC20 implementation.
 * @author Ilya Kubariev <ilya.kubariev@redduck.io>
 */
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

    /**
     * @inheritdoc IERC20Metadata
     */
    function name() public view override returns (string memory) {
        return _name;
    }

    /**
     * @inheritdoc IERC20Metadata
     */
    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    /**
     * @inheritdoc IERC20Metadata
     */
    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /**
     * @inheritdoc IERC20
     */
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    /**
     * @inheritdoc IERC20
     */
    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    /**
     * @inheritdoc IERC20
     */
    function transfer(address to, uint256 amount)
        public
        override
        returns (bool)
    {
        _transfer(msg.sender, to, amount);

        return true;
    }

    /**
     * @inheritdoc IERC20
     */
    function allowance(address owner, address spender)
        public
        view
        override
        returns (uint256)
    {
        return _allowances[owner][spender];
    }

    /**
     * @inheritdoc IERC20
     */
    function approve(address spender, uint256 amount)
        public
        override
        returns (bool)
    {
        _approve(msg.sender, spender, amount);

        return true;
    }

    /**
     * @inheritdoc IERC20
     */
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

    /**
     * @dev internal function to change allowances.
     * @param owner - change allowance for this address.
     * @param spender - address of spender of funds.
     * @param amount - token amount to allow to transfer.
     */
    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal {
        require(owner != address(0), "owner is zero address");
        require(spender != address(0), "spender is zero address");

        _allowances[owner][spender] = amount;

        emit Approval(owner, spender, amount);
    }

    /**
     * @dev internal function to change balances.
     * @param from - reduce from this address.
     * @param to - add to this address.
     * @param amount - token amount to change.
     */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal {
        require(from != address(0), "transfer from zero address");
        require(to != address(0), "transfer to zero address");
        uint256 balanceFrom = _balances[from];
        require(balanceFrom >= amount, "transfer amount exceeds balance");

        _balances[from] = balanceFrom - amount;
        _balances[to] += amount;

        emit Transfer(from, to, amount);
    }
}
