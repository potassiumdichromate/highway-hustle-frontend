import { useEffect, useState, useCallback } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { 
  ArrowLeft, Car, Zap, Gauge, Timer, ChevronRight, 
  Loader2, ShieldCheck, ShoppingCart, Activity,
  Shield, ExternalLink, Box, Database, Sparkles
} from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { toast } from "sonner";
import { ethers } from "ethers";
import { usePrivyWalletTools } from "@/hooks/usePrivyWalletTools";
import logo from "@/assets/logo-flame.png";
import ogLogo from "@/assets/og-logo.png";
import NeuralBackground from "@/components/NeuralBackground";

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

import LoginModal from "@/components/LoginModal";

function FullMarketplace() {
  const { login, authenticated } = usePrivy();
  const navigate = useNavigate();
  const { activeWallet, sendPrivyTransaction, switchToZeroG, canUsePrivy, allowedChain, privyAuthenticated } = usePrivyWalletTools();
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const closeLoginModal = useCallback(() => setShowLoginModal(false), []);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<MarketplaceItem[]>([]);
  const [equippedId, setEquippedId] = useState<string>("coupe");
  const [isLoading, setIsLoading] = useState(true);
  const [isGarageLoading, setIsGarageLoading] = useState(false);
  const [isEquipping, setIsEquipping] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    if (authenticated) closeLoginModal();
  }, [authenticated, closeLoginModal]);

  const fetchMarketplace = useCallback(async () => {
    try {
      setIsLoading(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://highway-hustle-backend.onrender.com/api";
      
      // Ensure we have a valid token for the current user
      if (activeWallet?.address) {
        const loginResponse = await fetch(`${baseUrl}/player/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            walletAddress: activeWallet.address,
            privyMetaData: { address: activeWallet.address, type: "wallet" }
          })
        });
        const loginResult = await loginResponse.json();
        if (loginResult.success && loginResult.data?.token) {
          localStorage.setItem("hh_auth_token", loginResult.data.token);
        }
      }

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
  }, [activeWallet]);

  const fetchPurchases = useCallback(async () => {
    if (!activeWallet?.address || items.length === 0) {
      if (activeWallet?.address) setPurchasedItems([]);
      return;
    }
    
    try {
      setIsGarageLoading(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://highway-hustle-backend.onrender.com/api";
      const identifier = activeWallet.address.toLowerCase();
      const token = localStorage.getItem("hh_auth_token");
      
      const response = await fetch(`${baseUrl}/marketplace/user/${identifier}/purchases`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await response.json();
      
      let ownedIds = ["coupe", "pickup"]; // Always start with free cars
      
      if (result.success && Array.isArray(result.purchases)) {
        ownedIds = [...new Set([...ownedIds, ...result.purchases])];
      }
      
      // Filter from catalog
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
    } finally {
      setIsGarageLoading(false);
    }
  }, [activeWallet?.address, items]);

  const handleEquip = async (asset: MarketplaceItem) => {
    if (!activeWallet?.address) return;
    
    const index = CAR_ID_TO_INDEX[asset.id];
    if (index === undefined) {
      toast.error("This car cannot be equipped yet.");
      return;
    }

    try {
      setIsEquipping(asset.id);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://highway-hustle-backend.onrender.com/api";
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
        toast.success(`${asset.name} equipped! Verified by 0G EVM.`);
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
    if (privyAuthenticated) {
      fetchMarketplace();
    } else {
      setIsLoading(false);
    }
  }, [privyAuthenticated, fetchMarketplace]);

  useEffect(() => {
    if (items.length > 0 && activeWallet?.address) {
      fetchPurchases();
    }
  }, [items, activeWallet?.address, fetchPurchases]);

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

    const marketplaceContract = import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS || "0xB4a16C3BeA243b963dE6F8D5BFDaC38367a30D9f";
    
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

      toast.info(`Purchasing ${asset.name} via 0G EVM...`);

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
      toast.success("Transaction sent! Anchoring on 0G Chain...");

      // Step 4: Verify with Backend
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://highway-hustle-backend.onrender.com/api";
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
        toast.success(`${asset.name} unlocked! Ownership recorded on 0G.`);
        fetchPurchases();
      } else {
        toast.warning("Verification is pending. Your ownership will be finalized soon.");
      }
    } catch (error: any) {
      console.error("❌ Purchase failed:", error);
      toast.error(error.message || "Purchase failed. Check 0G balance.");
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050510] text-foreground font-sans selection:bg-primary/30 relative">
      <NeuralBackground />

      <div className="relative z-10 pb-20">
        <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050510]/60 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
            <Link to="/" className="flex items-center gap-3 transition hover:opacity-80">
              <img src={logo} alt="Logo" className="h-10 w-auto" />
              <span className="font-display text-xl font-black tracking-widest text-white uppercase italic">Highway Hustle</span>
            </Link>
            
            <Link to="/" className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-display text-[10px] font-bold tracking-[0.2em] text-muted-foreground transition hover:border-neon-cyan hover:text-white hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
              BACK TO HOME
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-6 py-20 relative z-10">
          <div className="mb-20 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-neon-cyan/10 ring-1 ring-neon-cyan/30 mb-8 animate-pulse">
              <ShoppingCart className="h-8 w-8 text-neon-cyan" />
            </div>
            <h1 className="font-display text-7xl font-black tracking-tight text-white uppercase italic mb-4">Global Marketplace</h1>
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                <ShieldCheck className="h-3 w-3 text-neon-cyan" />
                <span className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase italic">0G EVM VERIFIED</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Database className="h-3 w-3 text-neon-pink" />
                <span className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase italic">DA ANCHORED</span>
              </div>
            </div>
          </div>

          {/* My Garage Section */}
          {privyAuthenticated && (
            <div className="mb-24">
              <div className="mb-10 flex items-center justify-between border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                    <Car className="h-5 w-5 text-neon-green" />
                  </div>
                  <h2 className="font-display text-3xl font-black tracking-widest text-white uppercase italic">Private Garage</h2>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-black tracking-[0.4em] text-muted-foreground uppercase">{purchasedItems.length} ASSETS COLLECTED</span>
                   <div className="h-1 w-32 bg-white/5 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-neon-green" style={{ width: `${(purchasedItems.length / items.length) * 100}%` }} />
                   </div>
                </div>
              </div>

              {isGarageLoading ? (
                <div className="flex py-20 justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-neon-green" />
                </div>
              ) : purchasedItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {purchasedItems.map((car) => (
                    <div key={`garage-${car.id}`} className="group relative rounded-3xl border border-white/5 bg-[#0a0a1a]/60 backdrop-blur-md p-4 transition hover:border-neon-green/30 hover:bg-[#0a0a1a] shadow-2xl">
                      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-black">
                        <img src={car.img} alt={car.name} className="h-full w-full object-cover opacity-60 group-hover:scale-105 transition duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] to-transparent" />
                        <div className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-neon-green text-[8px] font-black tracking-widest text-black uppercase italic shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                          DEPLOYMENT READY
                        </div>
                      </div>
                      
                      <div className="mt-6 space-y-6">
                        <div className="flex flex-col">
                          <h3 className="font-display text-xl font-black text-white italic uppercase tracking-wider">{car.name}</h3>
                          <div className="flex items-center gap-1.5 mt-1">
                             <Activity className="h-2.5 w-2.5 text-neon-green" />
                             <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Ownership Hash Verified</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleEquip(car)}
                          disabled={equippedId === car.id || isEquipping === car.id}
                          className={`group/btn relative flex h-12 w-full items-center justify-center gap-3 rounded-xl border font-black tracking-[0.3em] text-[10px] transition-all duration-500 uppercase italic overflow-hidden ${
                            equippedId === car.id 
                              ? "border-neon-green/30 bg-neon-green/5 text-neon-green shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]" 
                              : "border-white/10 bg-white/5 text-white hover:border-white/30 hover:bg-white/10"
                          }`}
                        >
                          {isEquipping === car.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : equippedId === car.id ? (
                            <>
                              <ShieldCheck className="h-4 w-4 text-neon-green" />
                              ACTIVE DEPLOYMENT
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 group-hover/btn:animate-pulse" />
                              EQUIP ASSET
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-24 text-center border-dashed backdrop-blur-md">
                  <Car className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-[10px] font-black tracking-[0.5em] text-muted-foreground uppercase italic">Your neural garage is empty</p>
                </div>
              )}
            </div>
          )}

          <div className="mb-12 flex items-center justify-between border-b border-white/5 pb-6">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                 <Box className="h-5 w-5 text-neon-cyan" />
               </div>
               <h2 className="font-display text-3xl font-black tracking-widest text-white uppercase italic">Asset Catalog</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-neon-cyan border-t-transparent shadow-[0_0_30px_rgba(34,211,238,0.2)]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((car) => (
                <div key={car.id} className="group relative rounded-3xl border border-white/5 bg-[#0a0a1a]/60 backdrop-blur-md p-4 transition-all duration-500 hover:border-neon-cyan/40 hover:bg-[#0a0a1a] hover:-translate-y-2 shadow-2xl">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-black">
                    <img src={car.img} alt={car.name} className="h-full w-full object-cover transition duration-1000 group-hover:scale-110 group-hover:opacity-100 opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] to-transparent" />
                    <div className="absolute bottom-4 left-4 rounded-xl bg-black/60 border border-white/10 px-3 py-1.5 backdrop-blur-xl shadow-2xl">
                      <div className="flex items-center gap-2">
                         <img src={ogLogo} alt="0G" className="h-3 w-auto" />
                         <span className={`font-display text-sm font-black italic tracking-tighter ${car.color}`}>{car.price}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-2 space-y-8">
                    <div className="flex flex-col">
                      <h3 className="font-display text-2xl font-black text-white italic uppercase tracking-tighter group-hover:text-neon-cyan transition-colors">{car.name}</h3>
                      <div className="flex items-center gap-2 mt-1 opacity-60">
                         <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Protocol Series #00{CAR_ID_TO_INDEX[car.id]}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-5">
                      <StatBar label="MAX VELOCITY" value={car.stats.speed} color="bg-neon-pink" />
                      <StatBar label="ACCELERATION" value={car.stats.accel} color="bg-neon-cyan" />
                      <StatBar label="STABILITY" value={car.stats.handl} color="bg-neon-yellow" />
                    </div>

                    <button 
                      onClick={() => handleAcquire(car)}
                      disabled={purchasingId === car.id}
                      className="group/buy relative w-full rounded-xl bg-white text-black py-4 text-[10px] font-black tracking-[0.4em] transition-all duration-500 uppercase italic disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-neon-cyan/40"
                    >
                      <div className="absolute inset-0 bg-neon-cyan translate-y-full group-hover/buy:translate-y-0 transition-transform duration-500" />
                      <span className="relative z-10 flex items-center gap-2 group-hover/buy:text-black">
                        {purchasingId === car.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            ANCHORING ASSET...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4" />
                            ACQUIRE ASSET
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Global Footer Stats */}
        <div className="mx-auto max-w-6xl px-6 py-20 border-t border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-neon-cyan" />
                    <h4 className="text-xs font-black tracking-[0.3em] text-white uppercase italic">Secure Ownership</h4>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed tracking-wider opacity-60">
                    EVERY ASSET PURCHASE IS VERIFIED BY THE 0G NETWORK SMART CONTRACTS, ENSURING PERMANENT, IMMUTABLE OWNERSHIP.
                  </p>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-neon-pink" />
                    <h4 className="text-xs font-black tracking-[0.3em] text-white uppercase italic">Data Availability</h4>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed tracking-wider opacity-60">
                    VEHICLE METADATA AND PLAYER RECORDS ARE ANCHORED ON 0G DA TO GUARANTEE TRANSPARENCY AND FAIRNESS.
                  </p>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-neon-yellow" />
                    <h4 className="text-xs font-black tracking-[0.3em] text-white uppercase italic">Neural Sync</h4>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed tracking-wider opacity-60">
                    YOUR GARAGE IS CONSTANTLY SYNCED WITH THE 0G COMPUTE NETWORK FOR REAL-TIME DIAGNOSTICS AND INSIGHTS.
                  </p>
               </div>
            </div>
        </div>
      </div>

      {showLoginModal ? (
        <LoginModal open onClose={closeLoginModal} />
      ) : null}
    </div>
  );
}

function StatBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[9px] font-black tracking-[0.4em] text-muted-foreground uppercase italic">
        <span>{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5 border border-white/5">
        <div className={`h-full ${color} transition-all duration-1000 shadow-[0_0_10px_currentColor]`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
