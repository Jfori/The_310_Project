// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voter {
    struct Vote {
        string candidate;
        uint256 rank;
    }

    mapping(address => Vote[]) public votes;
    mapping(string => uint256) public tally;
    string[] public candidatesList;

    constructor(string[] memory initialCandidates) {
        candidatesList = initialCandidates;
    }

    function submitVotes(string[] memory candidates, uint256[] memory ranks) public {
        require(candidates.length == ranks.length, "Candidates and ranks length mismatch");

        // Clear previous votes for the sender
        delete votes[msg.sender];

        for (uint i = 0; i < candidates.length; i++) {
            votes[msg.sender].push(Vote(candidates[i], ranks[i]));
            tally[candidates[i]] += ranks[i]; // Update the tally
        }
    }

    function getLiveTally() public view returns (string[] memory, uint256[] memory) {
        uint256[] memory points = new uint256[](candidatesList.length);
        for (uint i = 0; i < candidatesList.length; i++) {
            points[i] = tally[candidatesList[i]];
        }
        return (candidatesList, points);
    }
}
