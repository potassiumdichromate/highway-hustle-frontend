import { ethers } from "ethers";
import { toast } from "sonner";

export const MARKETPLACE_ABI = [
  "function purchaseAsset(bytes32 assetHash, string userIdentifier) external payable",
  "function hasPurchased(bytes32 assetHash, string userIdentifier) view returns (bool)",
  "event AssetPurchased(bytes32 indexed assetHash, string indexed userIdentifier, uint256 amount, address indexed buyer)"
];

export const MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS || "0xB4a16C3BeA243b963dE6F8D5BFDaC38367a30D9f";

export async function purchaseVehicle(
  wallet: any, // Privy wallet object
  assetHash: string,
  userIdentifier: string,
  priceInOG: string
) {
  try {
    console.log("🛠️ [contract-utils] Starting purchaseVehicle...");
    console.log("🛠️ [contract-utils] Asset Hash:", assetHash);
    console.log("🛠️ [contract-utils] User ID:", userIdentifier);
    console.log("🛠️ [contract-utils] Price (OG):", priceInOG);

    // 1. Switch chain if necessary
    const chainId = parseInt(import.meta.env.VITE_CHAIN_ID || "16661");
    console.log("🛠️ [contract-utils] Switching to chain:", chainId);
    await wallet.switchChain(chainId);

    // 2. Get provider and signer
    console.log("🛠️ [contract-utils] Getting provider/signer...");
    const provider = await wallet.getEthersProvider();
    const signer = await provider.getSigner();
    console.log("🛠️ [contract-utils] Signer address:", await signer.getAddress());

    // 3. Create contract instance
    console.log("🛠️ [contract-utils] Target Contract:", MARKETPLACE_ADDRESS);
    const contract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

    // 4. Send transaction
    const priceInWei = ethers.parseEther(priceInOG.replace(/[^0-9.]/g, ''));
    console.log("🛠️ [contract-utils] Value in Wei:", priceInWei.toString());
    
    toast.info("Wallet prompt initiated. Please sign the transaction.");
    
    const tx = await contract.purchaseAsset(assetHash, userIdentifier, {
      value: priceInWei
    });

    console.log("✅ [contract-utils] Transaction sent!", tx.hash);
    return { success: true, txHash: tx.hash, tx };
  } catch (error: any) {
    console.error("❌ [contract-utils] Error:", error);
    return { success: false, error: error.message || "Unknown transaction error" };
  }
}
