// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CryptoRoast {
    struct Roast {
        address user;
        string roastType;
        uint256 timestamp;
        uint256 score;
    }
    
    mapping(address => Roast[]) public userRoasts;
    mapping(string => uint256) public roastCounts;
    
    Roast[] public allRoasts;
    
    event RoastGenerated(
        address indexed user,
        string roastType,
        uint256 score,
        uint256 timestamp
    );
    
    function recordRoast(string calldata roastType, uint256 score) external {
        Roast memory roast = Roast({
            user: msg.sender,
            roastType: roastType,
            timestamp: block.timestamp,
            score: score
        });
        
        userRoasts[msg.sender].push(roast);
        allRoasts.push(roast);
        roastCounts[roastType]++;
        
        emit RoastGenerated(msg.sender, roastType, score, block.timestamp);
    }
    
    function getUserRoastCount(address user) external view returns (uint256) {
        return userRoasts[user].length;
    }
    
    function getLatestRoast(address user) external view returns (Roast memory) {
        require(userRoasts[user].length > 0, "No roasts");
        return userRoasts[user][userRoasts[user].length - 1];
    }
    
    function getTopRoastType() external view returns (string memory, uint256) {
        // Simplified - in production would iterate properly
        return ("Degen", roastCounts["Degen"]);
    }
}
