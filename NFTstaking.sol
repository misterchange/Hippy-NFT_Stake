// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ERC721staking is ReentrancyGuard{
    using SafeERC20 for IERC20;


// Interfaces for ERC20 and ERC721 
  IERC20 public immutable rewardsToken;
  IERC721 public immutable nftCollection;

// Constructor function to set the rewards token and the NFT Collection address
    constructor(IERC721 _nftCollection, IERC20 _rewardsToken) {
        nftCollection = _nftCollection;
        rewardsToken = _rewardsToken;
    }

    struct StakedToken {
        address Staker;
        uint256 tokenId;
    }

//Staker info
    struct Staker {
        uint256 amountStaked; //Amount of tokens staked by the Staker

        StakedToken[] stakedTokens; //Staked Tokens

        uint256 timeOfLastUpdate; //Last time of the rewards were calculated for the user

        uint256 unclaimedRewards; //{Calculated,but unclaimed rewards by the user}
    }

//Rewards per hour per Token deposited in wei
//Rewards are calculated every hour
uint256 private rewardsPerHour = 100000;

//Mapping of User Address to staker info
mapping(address => Staker) public stakers;

//Mapping of Token Id  to staker 
mapping (uint256=>address) public stakerAddress;

function stake  (uint256 _tokenId) external nonReentrant {
// If wallet has tokens staked , calculate  the rewards before adding new token 
if (stakers[msg.sender].amountStaked > 0){
    uint256 rewards = calculateRewards(msg.sender);
    stakers [msg.sender].unclaimedRewards += rewards;
}

//wallet must be owning the token they are trying to stake

require (
    nftCollection.ownerOf(_tokenId) ==msg.sender,
    "You don't own this NFT!"
);

//Transfer the token from the wallet to smart contract
nftCollection.transferFrom(msg.sender, address(this), _tokenId);

//Create a Staked Token 
StakedToken memory stakedToken = StakedToken(msg.sender, _tokenId);

//add the Toke to the Staked Tokens Array
stakers[msg.sender].stakedTokens.push(stakedToken);

//Increment the amount staked in this wallet
stakers[msg.sender].amountStaked++;

//Update the mapping of the Token Id to the stakers address
stakerAddress[_tokenId] = msg.sender;

//update the timeOfLastUpdate for the staker
stakers [msg.sender].timeOfLastUpdate = block.timestamp;

}

function withdraw(uint256 _tokenId) external nonReentrant{
    //Make sure the usewr has atleast one token staked before withdrawing
    require(
        stakers[msg.sender].amountStaked > 0 ,
        "You have no Tokens staked"
    );

    //wallet must own the token they are trying to withdraw
    require(stakerAddress[_tokenId] == msg.sender, "You don't own this NFT!");  

    //update the reward for the user , as the amount of token decreases when withdrawn.
    uint256 rewards = calculateRewards(msg.sender);
    stakers[msg.sender].unclaimedRewards += rewards;

    //Find the index of the Token Id in the stakedTokens array
    uint256 index=0;
    for (uint256 i=0;i<stakers[msg.sender].stakedTokens.length; i++){
        if (stakers[msg.sender].stakedTokens[i].tokenId == _tokenId){
            index=i;
            break;
        }
    } 

    //Remove the NFT from the staked NFT or Token list array
    // stakers[msg.sender].stakedTokens[index].staker = address(0);//
    stakers[msg.sender].stakedTokens[index].Staker = address(0);


    //Decremremt the amount staked for this wallet
    stakers[msg.sender].amountStaked--;

    //Update the Mapping of the TokenId to the be address(0) to indicate that the token is no longer staked
    stakerAddress[_tokenId] = address(0);

    //Transfer the NFT back to the Withdraw
    nftCollection.transferFrom(address(this) , msg.sender, _tokenId);

    //update the timeofLastUpdate for the withdrawer
    stakers[msg.sender].timeOfLastUpdate = block.timestamp;
}

function claimRewards() external {
    uint256 rewards = calculateRewards(msg.sender) + 
    stakers[msg.sender].unclaimedRewards;

    require(rewards>0,"You have no rewards to claim");

    stakers[msg.sender].timeOfLastUpdate = block.timestamp;
    stakers[msg.sender].unclaimedRewards = 0;

    rewardsToken.safeTransfer(msg.sender, rewards);
}

function calculateRewards(address _staker)
    internal
    view
    returns(uint256 _rewards)
    {
        return(((
            ((block.timestamp-stakers[_staker].timeOfLastUpdate)*
            stakers[_staker].amountStaked)
        )*rewardsPerHour)/3600);
    } 

    function avialabeRewards(address _staker) public view returns (uint256) {
         uint256 rewards = calculateRewards(_staker)+
         stakers[_staker].unclaimedRewards;
         return rewards;
    }

    // function getStakedTokens (address _user) public view returns(StakedToken[] memory) {
    //     //check if we know the user
    //      if (stakers[_user].amountStaked > 0 ) {
    //         //Return all the tokens in the stakedToken Array for the user thgat are not -1
    //         StakedToken[] memory _stakedToken = new StakedToken[](stakers[_user].amountStaked);
    //         uint256 _index =0;

    //         for(uint256 j=0;j<stakers[_user].stakedTokens.length;j++){
    //             if(stakers[_user].stakedTokens[j].staker != (address(0))){
    //                 _stakedTokens[_index] = stakers[_user].stakedTokens[j];
    //                 _index++;
    //             }
    //         }
    //         return _stakedTokens;
    //      }

    //      //otherwise return empty array
    //      else{
    //         return new StakedTokens[](0);
    //      }

    // }

 function getStakedTokens(address _user) public view returns (StakedToken[] memory) {
        // Check if we know this user
        if (stakers[_user].amountStaked > 0) {
            // Return all the tokens in the stakedToken Array for this user that are not -1
            StakedToken[] memory _stakedTokens = new StakedToken[](stakers[_user].amountStaked);
            uint256 _index = 0;

            for (uint256 j = 0; j < stakers[_user].stakedTokens.length; j++) {
                if (stakers[_user].stakedTokens[j].Staker != (address(0))) {
                    _stakedTokens[_index] = stakers[_user].stakedTokens[j];
                    _index++;
                }
            }

            return _stakedTokens;
        }
        
        // Otherwise, return empty array
        else {
            return new StakedToken[](0);
        }
    }


}