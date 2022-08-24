import{
    ThirdwebNftMedia,
    useAddress,
    useMetamask,
    useNFTDrop,
    useToken,
    useTokenBalance,
    useOwnedNFTs,
    useContract,
} from "@thirdweb-dev/react";
import { BigNumber , ethers } from "ethers";
import type {NextPage} from "next";
import {useEffect,useState} from "react";
import styles from "../styles/Home.module.css"

const nftDropContractAddress = "0xcB0d1404fb93b1319b7F8e9Dd8C4d110B7cd1310";
const tokenContractAddress = "0x1d95c2C75CB2FB08E64ade2C591C9bf583535ce1";
const stakingContractAddress = "0x092b55e7998e8A9C67E58Dcec5c1CDC777b780D1";

const stake:NextPage = () => {

//wallet connection hooks
const address = useAddress();
const connectWithMetamask = useMetamask();

//contract hooks
const nftDropContract = useNFTDrop(nftDropContractAddress);
const tokenContract = useToken(tokenContractAddress);
const { contract , isLoading } = useContract(stakingContractAddress);

//Load Unstaked NFT'S
const{ data : ownedNfts } = useOwnedNFTs(nftDropContract,address);

//Load the balace of the tokens
const { data : tokenBalance } = useTokenBalance(tokenContract, address);

//CUSTOM CONTRACT FUNCTIONS
const [stakedNfts, setStakedNfts] = useState<any[]>([]);
const [claimableRewards, setClaimableRewards] = useState<BigNumber>();

useEffect(() =>{
    if(!contract) return;

    async function loadStakedNfts() {
        const stakedTokens = await contract?.call("getStakedTokens",address);

        //For each staked token,fetch it from the sdk
        const stakedNfts = await Promise.all(
            stakedTokens?.map(
                async (stakedToken: { staker:string; tokenId:BigNumber}) =>{
                    const nft = await nftDropContract?.get(stakedToken.tokenId);
                    return nft;
                }
            )
        );

        setStakedNfts(stakedNfts);
        console.log('setStakedNfts',stakedNfts);
    }

    if (address) {
        loadStakedNfts();
    }
},[address,contract,nftDropContract]);

useEffect(() => {
    if (!contract || !address) return;

    async function loadClaimableRewards() {
      const cr = await contract?.call("avialabeRewards", address);
      console.log("Loaded claimable rewards", cr);
      setClaimableRewards(cr);
    }

    loadClaimableRewards();
  }, [address, contract]);


   // Write Functions
  ///////////////////////////////////////////////////////////////////////////
  async function stakeNft(id: BigNumber) {
    if (!address) return;

    const isApproved = await nftDropContract?.isApproved(
      address,
      stakingContractAddress
    );
    // If not approved, request approval
    if (!isApproved) {
      await nftDropContract?.setApprovalForAll(stakingContractAddress, true);
    }
    const stake = await contract?.call("stake", id);
  }
  async function withdraw(id: BigNumber) {
    const withdraw = await contract?.call("withdraw", id);
  }

  async function claimRewards() {
    const claim = await contract?.call("claimRewards");
  }

  if (isLoading) {
    return <div>Loading</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Stake Your NFTs</h1>

      <hr className={`${styles.divider} ${styles.spacerTop}`} />

      {!address ? (
        <button className={styles.mainButton} onClick={connectWithMetamask}>
          Connect Wallet
        </button>
      ) : (
        <>
          <h2>Your Tokens</h2>

          <div className={styles.tokenGrid}>
            <div className={styles.tokenItem}>
              <h3 className={styles.tokenLabel}>Claimable Rewards</h3>
              <p className={styles.tokenValue}>
                <b>
                  {!claimableRewards
                    ? "Loading..."
                    : ethers.utils.formatUnits(claimableRewards, 18)}
                </b>{" "}
                {tokenBalance?.symbol}
              </p>
            </div>
            <div className={styles.tokenItem}>
              <h3 className={styles.tokenLabel}>Current Balance</h3>
              <p className={styles.tokenValue}>
                <b>{tokenBalance?.displayValue}</b> {tokenBalance?.symbol}
              </p>
            </div>
          </div>

          <button
            className={`${styles.mainButton} ${styles.spacerTop}`}
            onClick={() => claimRewards()}
          >
            Claim Rewards
          </button>

          <hr className={`${styles.divider} ${styles.spacerTop}`} />

          <h2>Your Staked NFTs</h2>
          <div className={styles.nftBoxGrid}>
            {stakedNfts?.map((nft) => (
              <div className={styles.nftBox} key={nft.metadata.id.toString()}>
                <ThirdwebNftMedia
                  metadata={nft.metadata}
                  className={styles.nftMedia}
                />
                <h3>{nft.metadata.name}</h3>
                <button
                  className={`${styles.mainButton} ${styles.spacerBottom}`}
                  onClick={() => withdraw(nft.metadata.id)}
                >
                  Withdraw
                </button>
              </div>
            ))}
          </div>

          <hr className={`${styles.divider} ${styles.spacerTop}`} />

          <h2>Your Unstaked NFTs</h2>

          <div className={styles.nftBoxGrid}>
            {ownedNfts?.map((nft) => (
              <div className={styles.nftBox} key={nft.metadata.id.toString()}>
                <ThirdwebNftMedia
                  metadata={nft.metadata}
                  className={styles.nftMedia}
                />
                <h3>{nft.metadata.name}</h3>
                <button
                  className={`${styles.mainButton} ${styles.spacerBottom}`}
                  onClick={() => stakeNft(nft.metadata.id)}
                >
                  Stake
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};


export default stake;





    



