import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Car, Zap, Gauge, Timer, ChevronRight, Loader2, ShieldCheck } from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { toast } from "sonner";
import { ethers } from "ethers";
import { usePrivyWalletTools } from "@/hooks/usePrivyWalletTools";
import logo from "@/assets/logo-flame.png";

// Import images
import cyberCoupe from "../assets/cars/coupe.png";
import hyperDrift from "../assets/cars/f1.png";
import stealthInterceptor from "../assets/cars/ctr.png";
import builtCar from "../assets/cars/built-car.png";
import protoRacer from "../assets/cars/lamborghini.png";
import jeepImg from "../assets/cars/jeep.png";
import suvImg from "../assets/cars/suv.png";
import muscleImg from "../assets/cars/muscle.png";
import pickupImg from "../assets/cars/pickup.png";

const CAR_ID_TO_INDEX: Record<string, number> = {
  "coupe": 0,
  "pickup": 5,
  "suv": 6,
  "jeep": 8,
  "lamborghini": 10,
  "ctr": 11,
  "muscle": 12,
  "f1": 13,
  "van": 7,
  "sierra": 9
};

const INDEX_TO_CAR_ID: Record<number, string> = {
  0: "coupe",
  5: "pickup",
  6: "suv",
  8: "jeep",
  10: "lamborghini",
  11: "ctr",
  12: "muscle",
  13: "f1",
  7: "van",
  9: "sierra"
};

export const Route = createFileRoute("/marketplace")({
  component: FullMarketplace,
});

interface MarketplaceItem {
  id: string;
  name: string;
  img: any;
  price: string;
  priceOG: string;
  hash: string;
  stats: {
    speed: number;
    accel: number;
    handl: number;
  };
  color: string;
}

import CustomLoginModal from "@/components/CustomLoginModal";

function FullMarketplace() {
  const { login } = usePrivy();
  const navigate = useNavigate();
  const { activeWallet, sendPrivyTransaction, switchToZeroG, canUsePrivy, allowedChain, privyAuthenticated } = usePrivyWalletTools();
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<MarketplaceItem[]>([]);
  const [equippedId, setEquippedId] = useState<string>("coupe");
  const [isLoading, setIsLoading] = useState(true);
  const [isGarageLoading, setIsGarageLoading] = useState(false);
  const [isEquipping, setIsEquipping] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const fetchMarketplace = async () => {
    try {
      setIsLoading(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4500/api";
      const token = localStorage.getItem("hh_auth_token");
      
      const response = await fetch(`${baseUrl}/marketplace/assets?pageSize=100`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success && Array.isArray(result.assets)) {
        const mappedItems = mapBackendAssets(result.assets);
        setItems(mappedItems);
      }
    } catch (error) {
      console.error("❌ Error fetching marketplace:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPurchases = async () => {
    if (!activeWallet?.address) {
      setPurchasedItems([]);
      return;
    }
    
    try {
      setIsGarageLoading(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4500/api";
      const identifier = activeWallet.address.toLowerCase();
      
      console.log("🔍 Fetching garage for:", identifier);
      const token = localStorage.getItem("hh_auth_token");
      const response = await fetch(`${baseUrl}/marketplace/user/${identifier}/purchases`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await response.json();
      
      let ownedIds = ["coupe", "pickup"]; // Always start with free cars
      
      if (result.success && Array.isArray(result.purchases)) {
        ownedIds = [...new Set([...ownedIds, ...result.purchases])];
      }
      
      console.log("🚗 Owned Vehicle IDs:", ownedIds);
      
      // Critical fix: Ensure starter cars are treated as valid items even if not in the catalog
      const ownedItems = items.filter(item => ownedIds.includes(item.id));
      
      // Manual injection for starter cars if missing from catalog
      if (ownedIds.includes("coupe") && !ownedItems.find(i => i.id === "coupe")) {
        ownedItems.push({
          id: "coupe",
          name: "CYBER COUPE",
          img: cyberCoupe,
          price: "FREE",
          priceOG: "0",
          hash: "0x0",
          stats: { speed: 85, accel: 90, handl: 78 },
          color: "text-neon-pink"
        });
      }
      if (ownedIds.includes("pickup") && !ownedItems.find(i => i.id === "pickup")) {
        ownedItems.push({
          id: "pickup",
          name: "PICKUP TRUCK",
          img: pickupImg,
          price: "FREE",
          priceOG: "0",
          hash: "0x0",
          stats: { speed: 65, accel: 60, handl: 55 },
          color: "text-neon-cyan"
        });
      }
      
      setPurchasedItems(ownedItems);

      // Fetch equipped status
      const playerResponse = await fetch(`${baseUrl}/player/vehicle?user=${identifier}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const playerResult = await playerResponse.json();
      if (playerResult.success && playerResult.data?.selectedPlayerCarIndex !== undefined) {
        const id = INDEX_TO_CAR_ID[playerResult.data.selectedPlayerCarIndex] || "coupe";
        setEquippedId(id);
      }
    } catch (error) {
      console.error("❌ Error fetching purchases:", error);
      const freeItems = items.filter(item => item.id === "coupe");
      if (freeItems.length === 0) {
        freeItems.push({
          id: "coupe",
          name: "CYBER COUPE",
          img: cyberCoupe,
          price: "FREE",
          priceOG: "0",
          hash: "0x0",
          stats: { speed: 85, accel: 90, handl: 78 },
          color: "text-neon-pink"
        });
      }
      setPurchasedItems(freeItems);
    } finally {
      setIsGarageLoading(false);
    }
  };

  const handleEquip = async (asset: MarketplaceItem) => {
    if (!activeWallet?.address) return;
    
    const index = CAR_ID_TO_INDEX[asset.id];
    if (index === undefined) {
      toast.error("This car cannot be equipped yet.");
      return;
    }

    try {
      setIsEquipping(asset.id);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4500/api";
      const identifier = activeWallet.address.toLowerCase();
      const token = localStorage.getItem("hh_auth_token");

      const response = await fetch(`${baseUrl}/player/vehicle?user=${identifier}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          selectedPlayerCarIndex: index
        })
      });

      const result = await response.json();
      if (result.success) {
        setEquippedId(asset.id);
        toast.success(`${asset.name} equipped!`);
      } else {
        throw new Error(result.error || "Failed to equip");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to equip vehicle");
    } finally {
      setIsEquipping(null);
    }
  };

  useEffect(() => {
    fetchMarketplace();
  }, []);

  useEffect(() => {
    if (items.length > 0 && activeWallet?.address) {
      fetchPurchases();
    }
  }, [items, activeWallet?.address]);

  const mapBackendAssets = (assets: any[]) => {
    const imgMap: Record<string, any> = {
      "coupe": cyberCoupe, "suv": suvImg, "sierra": stealthInterceptor, "van": builtCar, "lamborghini": protoRacer,
      "ctr": stealthInterceptor, "f1": hyperDrift, "jeep": jeepImg, "muscle": muscleImg, "pickup": pickupImg
    };
    const statsMap: Record<string, any> = {
      "coupe": { speed: 85, accel: 90, handl: 78 }, "suv": { speed: 82, accel: 85, handl: 95 }, "sierra": { speed: 95, accel: 92, handl: 80 }, "van": { speed: 60, accel: 55, handl: 50 }, "lamborghini": { speed: 98, accel: 98, handl: 92 },
      "ctr": { speed: 85, accel: 90, handl: 78 }, "f1": { speed: 82, accel: 85, handl: 95 }, "jeep": { speed: 60, accel: 55, handl: 50 }, "pickup": { speed: 65, accel: 60, handl: 55 }
    };
    const colorMap: Record<string, string> = {
      "coupe": "text-neon-pink", "suv": "text-neon-yellow", "sierra": "text-neon-cyan", "van": "text-neon-green", "lamborghini": "text-primary",
      "ctr": "text-neon-pink", "f1": "text-neon-yellow", "jeep": "text-neon-cyan"
    };

    return assets.map((a: any) => ({
      id: a.id,
      name: a.name.toUpperCase(),
      img: imgMap[a.id] || cyberCoupe,
      price: `${a.price} OG`,
      priceOG: a.price,
      hash: a.hash,
      stats: statsMap[a.id] || { speed: 70, accel: 70, handl: 70 },
      color: colorMap[a.id] || "text-white"
    }));
  };

  const handleAcquire = async (asset: MarketplaceItem) => {
    if (!canUsePrivy || !activeWallet?.address) {
      toast.error("Wallet required. Please connect your wallet to purchase.");
      setShowLoginModal(true);
      return;
    }

    const marketplaceContract = import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS;
    if (!marketplaceContract) {
      toast.error("Marketplace contract not configured in environment.");
      return;
    }

    if (purchasingId) return;
    setPurchasingId(asset.id);

    try {
      // Step 1: Switch to 0G
      await switchToZeroG();

      // Step 2: Encode purchaseAsset call
      const userIdentifier = activeWallet.address.toLowerCase();
      const PURCHASE_ABI = ['function purchaseAsset(bytes32 assetHash, string userIdentifier) external payable'];
      const iface = new ethers.Interface(PURCHASE_ABI);
      const data = iface.encodeFunctionData('purchaseAsset', [asset.hash, userIdentifier]);

      toast.info(`Purchasing ${asset.name} for ${asset.price}...`);

      // Step 3: Send via Privy Transaction logic
      const priceInWei = ethers.parseEther(asset.priceOG.replace(/[^0-9.]/g, ''));
      
      const receipt = await sendPrivyTransaction(
        {
          to: marketplaceContract,
          value: BigInt(priceInWei.toString()),
          data,
          chainId: allowedChain.decimalChainId,
        },
        {
          address: activeWallet.address,
          uiOptions: { showWalletUIs: true },
        },
      );

      const txHash = typeof receipt === 'string' ? receipt : (receipt as any)?.transactionHash || (receipt as any)?.hash;
      toast.success("Transaction sent! Confirming on 0G...");

      // Step 4: Verify with Backend
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4500/api";
      const verifyResponse = await fetch(`${baseUrl}/marketplace/purchase/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash,
          assetId: asset.id,
          userIdentifier
        })
      });

      const verifyResult = await verifyResponse.json();

      if (verifyResult.success) {
        toast.success(`${asset.name} unlocked! Check your garage.`);
        fetchPurchases();
      } else {
        toast.warning("Verification is pending. Your garage will update shortly.");
      }
    } catch (error: any) {
      console.error("❌ Purchase failed:", error);
      toast.error(error.message || "Purchase failed. Please try again.");
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#020208] text-foreground font-sans selection:bg-primary/30">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-neon-blue/20 to-transparent blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 transition hover:opacity-80">
            <img src={logo} alt="Logo" className="h-10 w-auto" />
            <span className="font-display text-xl font-black tracking-widest text-white uppercase">Highway Hustle</span>
          </Link>
          
          <Link to="/" className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-muted-foreground hover:text-white transition">
            <ArrowLeft className="h-3 w-3" />
            BACK TO HOME
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-20 relative z-10">
        <div className="mb-16 text-center">
          <h1 className="font-display text-6xl font-black tracking-[0.2em] text-gradient-chrome uppercase">Global Marketplace</h1>
          <p className="mt-4 text-[10px] font-bold tracking-[0.5em] text-neon-cyan uppercase">Premium Vehicular Assets • On-Chain Verified on 0G Network</p>
        </div>

        {/* My Garage Section */}
        {privyAuthenticated && (
          <div className="mb-20">
            <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="font-display text-2xl font-black tracking-widest text-white uppercase flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-neon-green animate-pulse" />
                MY GARAGE
              </h2>
              <span className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                {purchasedItems.length} VEHICLES OWNED
              </span>
            </div>

            {isGarageLoading ? (
              <div className="flex py-10 justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
              </div>
            ) : purchasedItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {purchasedItems.map((car) => (
                  <div key={`garage-${car.id}`} className="group relative rounded-2xl border border-neon-green/20 bg-neon-green/[0.02] p-2 transition hover:bg-neon-green/[0.05]">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#0a0a1a]">
                      <img src={car.img} alt={car.name} className="h-full w-full object-cover opacity-80" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                      <div className="absolute top-3 right-3 rounded-md bg-neon-green px-2 py-1 text-[8px] font-black tracking-widest text-black uppercase shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                        OWNED
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => handleEquip(car)}
                          disabled={equippedId === car.id || isEquipping === car.id}
                          className={`flex h-10 w-full items-center justify-center gap-2 rounded-lg border font-bold tracking-[0.2em] text-[9px] transition-all duration-300 ${
                            equippedId === car.id 
                              ? "border-neon-green/30 bg-neon-green/10 text-neon-green" 
                              : "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 active:scale-95"
                          }`}
                        >
                          {isEquipping === car.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : equippedId === car.id ? (
                            <>
                              <ShieldCheck className="h-4 w-4" />
                              EQUIPPED
                            </>
                          ) : (
                            "EQUIP VEHICLE"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/5 bg-white/[0.01] py-10 text-center">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase italic">No vehicles in garage yet</p>
              </div>
            )}
          </div>
        )}

        <div className="mb-8 border-b border-white/5 pb-4">
          <h2 className="font-display text-2xl font-black tracking-widest text-white uppercase">Marketplace Catalog</h2>
        </div>

        {isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-neon-cyan border-t-transparent shadow-neon-cyan" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((car) => (
              <div key={car.id} className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-2 transition hover:bg-white/[0.05] hover:border-primary/30">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#0a0a1a]">
                  <img src={car.img} alt={car.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 rounded-md bg-background/80 px-2 py-1 backdrop-blur-md">
                    <span className={`font-display text-xs font-bold ${car.color}`}>{car.price}</span>
                  </div>
                </div>
                
                <div className="mt-4 p-4">
                  <h3 className="font-display text-lg font-black tracking-tight text-white group-hover:text-primary transition uppercase">{car.name}</h3>
                  
                  <div className="mt-6 space-y-4">
                    <StatBar label="SPEED" value={car.stats.speed} color="bg-neon-pink" />
                    <StatBar label="ACCEL" value={car.stats.accel} color="bg-neon-cyan" />
                    <StatBar label="HANDLING" value={car.stats.handl} color="bg-neon-yellow" />
                  </div>

                  <button 
                    onClick={() => handleAcquire(car)}
                    disabled={purchasingId === car.id}
                    className="mt-8 w-full rounded-xl bg-primary/10 py-4 text-[10px] font-bold tracking-[0.3em] text-primary transition hover:bg-primary hover:text-white uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {purchasingId === car.id ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        PROCESSING...
                      </>
                    ) : (
                      "Purchase Asset"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CustomLoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  );
}

function StatBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
        <span>{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
        <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
