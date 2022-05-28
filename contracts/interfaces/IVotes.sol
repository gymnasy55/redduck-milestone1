// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.9;

interface IVotes {
    event VotingStart(
        address indexed account,
        uint256 suggestedPrice,
        uint64 duration,
        uint256 votingNumber
    );
    event Vote(address indexed account, bool decision, uint256 power);
    event VotingEnd(
        address indexed account,
        uint256 previousPrice,
        uint256 price,
        uint256 acceptPower,
        uint256 declinePower
    );

    function price() external view returns (uint256);

    function suggestedPrice() external view returns (uint256);

    function capitalShareRate() external view returns (uint8);

    function acceptPower() external view returns (uint256);

    function rejectPower() external view returns (uint256);

    function votingStartedTime() external view returns (uint64);

    function votingDuration() external view returns (uint64);

    function lastVotingNumber() external view returns (uint256);

    function isWhale(address whale) external view returns (bool);

    function startVoting(uint256 suggestedPrice, uint64 duration)
        external
        returns (bool);

    function vote(bool decision) external returns (bool);

    function endVoting() external returns (bool);
}
