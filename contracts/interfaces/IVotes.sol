// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.9;

/**
 * @title IVotes
 * @notice interface for Votes tokens.
 * @author Ilya Kubariev <ilya.kubariev@redduck.io>
 */
interface IVotes {
    /**
     * @notice emits whenever {startVoting} called.
     * @param account - initiator of {startVoting}.
     * @param suggestedPrice - price that was suggested.
     * @param duration - duration of started voting in seconds.
     * @param votingNumber - number of started voting.
     */
    event VotingStart(
        address indexed account,
        uint256 suggestedPrice,
        uint64 duration,
        uint256 votingNumber
    );

    /**
     * @notice emits whenever {vote} called.
     * @param account - initiator of {vote}.
     * @param decision - accept or reject.
     * @param power - power of `account` vote.
     */
    event Vote(address indexed account, bool decision, uint256 power);

    /**
     * @notice emits whenever {endVoting} called.
     * @param account - initiator of {endVoting}.
     * @param previousPrice - price that was before voting.
     * @param price - new price.
     * @param acceptPower - power for accepting voting.
     * @param declinePower - power for rejecting voting.
     */
    event VotingEnd(
        address indexed account,
        uint256 previousPrice,
        uint256 price,
        uint256 acceptPower,
        uint256 declinePower
    );

    /**
     * @return currect price of token.
     */
    function price() external view returns (uint256);

    /**
     * @return currect suggested price of token (zero if no voting in progress).
     */
    function suggestedPrice() external view returns (uint256);

    /**
     * @return capital share rate that is needed to participate in voting.
     */
    function capitalShareRate() external view returns (uint8);

    /**
     * @return accept power for current voting (zero if no voting in progress).
     */
    function acceptPower() external view returns (uint256);

    /**
     * @return reject power for current voting (zero if no voting in progress).
     */
    function rejectPower() external view returns (uint256);

    /**
     * @return time when current voting started (zero if no voting in progress).
     */
    function votingStartedTime() external view returns (uint64);

    /**
     * @return duration of current voting (zero if no voting in progress).
     */
    function votingDuration() external view returns (uint64);

    /**
     * @return number of last voting started.
     */
    function lastVotingNumber() external view returns (uint256);

    /**
     * @param whale - address to check
     * @return true if `whale` is whale, false if not.
     */
    function isWhale(address whale) external view returns (bool);

    /**
     * @param suggestedPrice - price to vote.
     * @param duration - duration of new vote.
     * @return true if succeeded.
     */
    function startVoting(uint256 suggestedPrice, uint64 duration)
        external
        returns (bool);

    /**
     * @param decision - accept or reject current voting.
     * @return true if succeeded.
     */
    function vote(bool decision) external returns (bool);

    /**
     * @notice end current voting.
     * @return true if succeeded.
     */
    function endVoting() external returns (bool);
}
