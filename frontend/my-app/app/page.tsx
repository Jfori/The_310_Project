'use client';
import { useState, useEffect } from 'react';
import Web3 from 'web3';


type Tally = {
    Python: number;
    Java: number;
    C: number;
    Solidity: number;
    JavaScript: number;
};

type Confirmation = {
    account: string;
    transactionHash?: string;
};


const contractABI = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "candidates",
                "type": "string[]"
            },
            {
                "name": "ranks",
                "type": "uint256[]"
            }
        ],
        "name": "submitVotes",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "getLiveTally",
        "outputs": [
            {
                "components": [
                    {
                        "name": "",
                        "type": "string[]"
                    },
                    {
                        "name": "",
                        "type": "uint256[]"
                    }
                ],
                "name": "",
                "type": "tuple"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    // Other contract methods and events...
];
const contractAddress = '0xA790DBada5ebEcB3648713a54968a31a60e1a726'; // Replace with your actual contract address

const candidates = ["Python", "Java", "C", "Solidity", "JavaScript"];
const votingDate = new Date('2024-07-21T00:00:00'); // Example voting day
const resultDate = new Date('2024-07-23T00:00:00'); // Example result day

export default function Home() {
    const [ranks, setRanks] = useState(Array(candidates.length).fill(''));
    const [submitted, setSubmitted] = useState(false);
    const [confirmSubmit, setConfirmSubmit] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [results, setResults] = useState(null);
    const [confirmation, setConfirmation] = useState(null);
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [liveTally, setLiveTally] = useState({});

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);
        } else {
            console.log('Please install MetaMask!');
        }
    }, []);

    useEffect(() => {
        if (submitted || currentTime >= resultDate) {
            fetchLiveTally();
        }
    }, [submitted, currentTime]);

    const fetchLiveTally = async () => {
        if (web3) {
            try {
                const contract = new web3.eth.Contract(contractABI, contractAddress);
                const [candidatesList, pointsList] = await contract.methods.getLiveTally().call();
                const tally = {};
                candidatesList.forEach((candidate, index) => {
                    tally[candidate] = pointsList[index];
                });
                setLiveTally(tally);
            } catch (error) {
                console.error("Error fetching live tally:", error);
            }
        }
    };

    const handleLogin = async () => {
        if (web3) {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const accounts = await web3.eth.getAccounts();
                const account = accounts[0];
                setAccount(account);
                setLoggedIn(true);
            } catch (error) {
                console.error("User denied account access or other error:", error);
            }
        }
    };

    const handleRankChange = (index, value) => {
        const newRanks = [...ranks];
        newRanks[index] = value;
        setRanks(newRanks);
    };

    const handleSubmit = () => {
        setConfirmSubmit(true);
    };

    const handleConfirmSubmit = async () => {
        setConfirmSubmit(false);

        if (web3 && account) {
            try {
                const contract = new web3.eth.Contract(contractABI, contractAddress);
                const candidatesToSubmit = candidates;
                const ranksToSubmit = ranks.map(rank => parseInt(rank));

                contract.methods.submitVotes(candidatesToSubmit, ranksToSubmit).send({ from: account })
                    .on('transactionHash', (hash) => {
                        // Transition to confirmation page as soon as transaction is broadcast
                        setSubmitted(true);
                        setConfirmation({ account, transactionHash: hash });
                        fetchLiveTally();
                    })
                    .on('error', (error) => {
                        console.error("Error during vote submission:", error);
                    });
            } catch (error) {
                console.error("Error during vote submission:", error);
            }
        }
    };

    const handleGoBack = () => {
        setConfirmSubmit(false);
    };

    const handleClear = () => {
        setRanks(Array(candidates.length).fill(''));
    };

    const isRankDisabled = (rank) => {
        return ranks.includes(rank.toString());
    };

    const calculateResults = () => {
        const points = {
            "Python": 0,
            "Java": 0,
            "C": 0,
            "Solidity": 0,
            "JavaScript": 0,
        };

        ranks.forEach((rank, index) => {
            if (rank === '1') points[candidates[index]] += 3;
            if (rank === '2') points[candidates[index]] += 2;
            if (rank === '3') points[candidates[index]] += 1;
        });

        setResults(points);
    };

    useEffect(() => {
        if (currentTime >= votingDate && currentTime < resultDate && !results) {
            calculateResults();
        }
    }, [currentTime, votingDate, resultDate, results]);

    const getUserChosenOrder = () => {
        return candidates
            .map((candidate, index) => ({ candidate, rank: ranks[index] }))
            .sort((a, b) => a.rank - b.rank)
            .map(item => item.candidate);
    };

    const isVotingDay = () => {
        const start = new Date(votingDate);
        const end = new Date(votingDate);
        end.setDate(end.getDate() + 1);
        return currentTime >= start && currentTime < end;
    };

    const isResultDay = () => {
        return currentTime >= resultDate;
    };

    return (
        <div style={{ padding: '20px' }}>
            {currentTime < votingDate ? (
                <div style={{ textAlign: 'center', marginTop: '50px' }}>
                    <h2>Voting has not opened yet.</h2>
                    <p>Voting will open on: {votingDate.toLocaleDateString('en-GB')}</p>
                </div>
            ) : isVotingDay() ? (
                <>
                    <h1>Ballot Page</h1>
                    {!loggedIn ? (
                        <div style={{ textAlign: 'center', marginTop: '50px' }}>
                            <h2>Please log in to vote</h2>
                            <button onClick={handleLogin} style={{ marginTop: '20px' }}>Log in with MetaMask</button>
                        </div>
                    ) : !submitted ? (
                        <>
                            {candidates.map((candidate, index) => (
                                <div key={index} style={{ marginBottom: '20px' }}>
                                    <label style={{ marginRight: '10px' }}>{candidate}:</label>
                                    {[1, 2, 3, 4, 5].map((rank) => (
                                        <label key={rank} style={{ marginRight: '10px' }}>
                                            <input
                                                type="radio"
                                                value={rank}
                                                checked={ranks[index] === rank.toString()}
                                                onChange={(e) => handleRankChange(index, e.target.value)}
                                                disabled={isRankDisabled(rank) && ranks[index] !== rank.toString()}
                                            />
                                            {rank}
                                        </label>
                                    ))}
                                </div>
                            ))}
                            <button onClick={handleSubmit} style={{ marginTop: '20px', marginRight: '10px' }}>Submit Ballot</button>
                            <button onClick={handleClear} style={{ marginTop: '20px' }}>Clear Selections</button>
                            <p>Voting ends on: {votingDate.toLocaleDateString('en-GB')}</p>

                            {confirmSubmit && (
                                <div style={{ textAlign: 'center', marginTop: '50px', border: '1px solid #080808', padding: '20px', backgroundColor: '#080808' }}>
                                    <h2 style={{ color: '#fff' }}>Confirm Your Vote</h2>
                                    <ul>
                                        {getUserChosenOrder().map((candidate, index) => (
                                            <li key={index} style={{ color: '#fff' }}>
                                                {index + 1}. {candidate}
                                            </li>
                                        ))}
                                    </ul>
                                    <div style={{ margin: '40px 0' }}></div> {/* Adjusted the gap */}
                                    <p style={{ color: '#fff' }}>Are you sure you want to submit your ballot?</p>
                                    <p style={{ color: '#fff' }}>You cannot change your vote once it is submitted.</p>
                                    <div style={{ margin: '40px 0' }}></div> {/* Adjusted the gap */}
                                    <button onClick={handleConfirmSubmit} style={{ marginRight: '20px' }}>Yes, Submit</button>
                                    <button onClick={handleGoBack}>Go Back</button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', marginTop: '50px' }}>
                            <h2>Thanks, your vote has been counted!</h2>
                            <p>Results will be released on: {resultDate.toLocaleDateString('en-GB')}</p>
                            {confirmation && (
                                <div>
                                    <h3>Your Vote:</h3>
                                    <ul>
                                        {getUserChosenOrder().map((candidate, index) => (
                                            <li key={index}>
                                                {index + 1}. {candidate}
                                            </li>
                                        ))}
                                    </ul>
                                    <p>Submitted from account: {confirmation.account}</p>
                                </div>
                            )}
                        </div>
                    )}
                    {submitted && (
                        <div style={{ marginTop: '50px' }}>
                            <h2>Live Tally</h2>
                            <ul>
                                {Object.entries(liveTally).map(([candidate, points]) => (
                                    <li key={candidate}>{candidate}: {points} points</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            ) : currentTime < resultDate ? (
                <div style={{ textAlign: 'center', marginTop: '50px' }}>
                    <h2>Voting has ended.</h2>
                    <p>Results will be released on: {resultDate.toLocaleDateString('en-GB')}</p>
                </div>
            ) : (
                <div style={{ textAlign: 'center', marginTop: '50px' }}>
                    <h2>Voting Results</h2>
                    {Object.keys(liveTally).length ? (
                        <div>
                            <h3>Points:</h3>
                            <ul>
                                {Object.entries(liveTally).map(([candidate, points]) => (
                                    <li key={candidate}>{candidate}: {points} points</li>
                                ))}
                            </ul>
                            <p>Winner: {Object.keys(liveTally).reduce((a, b) => liveTally[a] > liveTally[b] ? a : b)}</p>
                        </div>
                    ) : (
                        <p>No votes have been submitted yet.</p>
                    )}
                </div>
            )}
        </div>
    );
}
