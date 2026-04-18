import { WalletTracker } from "@/components/dashboard/WalletTracker";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wallet | Vaultly",
  description: "Track physical wallet cash.",
};

export default function WalletPage() {
  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Pocket Wallet</h1>
        <p className="text-sm font-medium text-muted-foreground max-w-2xl">
          Keep track of your physical cash. Set your initial balance, record on-the-go spends, and attach receipts to keep every penny accounted for.
        </p>
      </div>
      <WalletTracker />
    </div>
  );
}
