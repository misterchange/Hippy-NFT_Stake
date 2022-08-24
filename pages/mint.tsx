import { useAddress, useMetamask ,useNFTDrop } from "@thirdweb-dev/react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";

const Mint: NextPage =() => {
    const router = useRouter();
    //Get the wallet address
    const address = useAddress();

    //function to connect the users metamask wallet
    const connectWithMetamask = useMetamask();

    //Get the NFT Collection Contract
    const nftDropContract = useNFTDrop(
        "0xcB0d1404fb93b1319b7F8e9Dd8C4d110B7cd1310"
    ); 

    async function claimNft(){
        try {
          const tx = await nftDropContract?.claim(1);
          console.log(tx);
          alert("NFT Claimed");
          router.push('/stake');  
        } catch (error) {
          console.error(error);
          alert(error);
        }
    }

    return(
        <div className= {styles.container}>
        {!address ?(
            <button className={`${styles.mainButton} ${styles.spacerBottom}`} 
            onClick={connectWithMetamask}
            >
                Connect Wallet
            </button>
        ):(
            <button className={`${styles.mainButton} ${styles.spacerBottom}`}
            onClick={() => claimNft()}
            >
                Claim An NFT
            </button>
        )}
        </div>
    );


};

export default Mint;