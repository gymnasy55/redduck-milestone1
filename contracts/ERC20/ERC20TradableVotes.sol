// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.9;

import "./ERC20Tradable.sol";
import "../interfaces/IVotes.sol";

contract ERC20TradableVotes is IVotes, ERC20Tradable {
    uint8 internal immutable _capitalShareRate;

    uint64 internal _duration;
    uint64 internal _votingStartedTime;
    uint256 internal _suggestedPrice;
    uint256 internal _acceptPower;
    uint256 internal _rejectPower;
    uint256 internal _votingNumber;
    mapping(uint256 => mapping(address => bool)) internal _votes;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 price_,
        uint8 capitalShareRate_
    ) ERC20Tradable(name_, symbol_, decimals_, price_) {
        _capitalShareRate = capitalShareRate_;
    }

    function price()
        public
        view
        override(IVotes, ERC20Tradable)
        returns (uint256)
    {
        return _price * divider;
    }

    function suggestedPrice() public view returns (uint256) {
        return _suggestedPrice * divider;
    }

    function capitalShareRate() public view returns (uint8) {
        return _capitalShareRate;
    }

    function acceptPower() public view returns (uint256) {
        return _acceptPower;
    }

    function rejectPower() public view returns (uint256) {
        return _rejectPower;
    }

    function votingStartedTime() public view returns (uint64) {
        return _votingStartedTime;
    }

    function votingDuration() public view returns (uint64) {
        return _duration;
    }

    function lastVotingNumber() public view returns (uint256) {
        return _votingNumber;
    }

    function isWhale(address whale) public view returns (bool) {
        return balanceOf(whale) >= _totalSupply / (100 / _capitalShareRate);
    }

    function startVoting(uint256 suggestedPrice_, uint64 duration)
        external
        onlyWhale(msg.sender)
        returns (bool)
    {
        require(
            _votingStartedTime == 0 && _duration == 0,
            "voting has already started"
        );
        require(suggestedPrice_ > 0, "suggestedPrice must be positive");
        require(duration > 0, "duration must be positive");

        (_suggestedPrice, _duration, _votingStartedTime) = (
            suggestedPrice_,
            duration,
            _time()
        );
        _votingNumber++;

        emit VotingStart(msg.sender, suggestedPrice_, duration, _votingNumber);
        return true;
    }

    function vote(bool decision) external onlyWhale(msg.sender) returns (bool) {
        uint64 time = _time();
        require(
            _votingStartedTime > 0 && _duration > 0,
            "voting has not been started"
        );
        require(time <= _votingStartedTime + _duration, "voting ended");
        address sender = msg.sender;
        require(!_votes[_votingNumber][sender], "already voted");

        uint256 power = balanceOf(sender);

        if (decision) {
            _acceptPower += power;
        } else {
            _rejectPower += power;
        }

        _votes[_votingNumber][sender] = true;

        emit Vote(sender, decision, power);
        return true;
    }

    function endVoting() external returns (bool) {
        uint64 time = _time();
        require(
            _votingStartedTime > 0 && _duration > 0,
            "voting has not been started"
        );
        require(time > _votingStartedTime + _duration, "voting is in progress");

        emit VotingEnd(
            msg.sender,
            _price,
            _suggestedPrice,
            _acceptPower,
            _rejectPower
        );

        if (_acceptPower > _rejectPower) {
            _price = _suggestedPrice;
        }

        delete _suggestedPrice;
        delete _duration;
        delete _votingStartedTime;
        delete _acceptPower;
        delete _rejectPower;

        return true;
    }

    function _time() internal view returns (uint64) {
        // solhint-disable-next-line not-rely-on-time
        return uint64(block.timestamp);
    }

    modifier onlyWhale(address whale) {
        require(isWhale(whale), "not a whale");
        _;
    }
}
