/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft, Gift, Lock, RefreshCw, Smartphone } from 'lucide-react';
import { dbService } from '../services/db';
import { TransactionItem, UserProfile } from '../types';

interface WalletViewProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function WalletView({ onBack, onNavigate }: WalletViewProps) {
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [transactions, setTransactions] = React.useState<TransactionItem[]>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const loadData = () => {
    const user = dbService.getCurrentUser();
    setProfile(user);
    if (user) {
      setTransactions(dbService.getTransactions(user.id));
    }
  };

  React.useEffect(() => {
    loadData();
    window.addEventListener('starconnect_db_update', loadData);
    return () => window.removeEventListener('starconnect_db_update', loadData);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadData();
      setIsRefreshing(false);
    }, 800);
  };

  if (!profile) return null;

  // Star conversion rate: 1 star = ৳0.80 BDT cashout
  const estimatedBDT = Math.round(profile.starBalance * 0.8);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-zinc-950 overflow-y-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200/50 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 mr-1"
          >
            <ArrowLeft className="w-6 h-6 text-slate-800 dark:text-neutral-200" />
          </button>
          <div className="flex items-center gap-1.5">
            <Wallet className="w-5 h-5 text-amber-500" />
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white">ভার্চুয়াল ওয়ালেট</h1>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          className={`p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-transform ${isRefreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Main Glassy Balance Card */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white rounded-[28px] p-6 shadow-xl shadow-amber-500/15 relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-6 -translate-y-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex justify-between items-center z-10 relative">
            <span className="text-xs font-bold tracking-widest text-amber-100 uppercase">মোট ব্যালেন্স (স্টার)</span>
            <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase">
              {profile.role === 'creator' ? 'কন্টেন্ট ক্রিয়েটর' : 'স্টার ভিউয়ার'}
            </div>
          </div>

          <div className="my-5 flex items-baseline gap-2 z-10 relative">
            <span className="text-4xl font-extrabold font-mono tracking-tight">{profile.starBalance}</span>
            <span className="text-lg font-black text-amber-200">⭐ STAR</span>
          </div>

          <div className="border-t border-white/20 pt-4 flex justify-between items-center z-10 relative text-xs">
            <div>
              <p className="text-amber-200 font-medium">সমমূল্য বিডিটি (আনুমানিক)</p>
              <p className="text-lg font-bold font-mono text-white mt-0.5">৳ {estimatedBDT} BDT</p>
            </div>
            
            {profile.role === 'creator' && (
              <div className="text-right">
                <p className="text-amber-200 font-medium select-none flex items-center justify-end gap-1">
                  <Lock className="w-3 h-3 text-amber-300" /> পেন্ডিং ব্যালেন্স
                </p>
                <p className="text-lg font-bold font-mono text-white mt-0.5">৳ {Math.round(profile.pendingBalanceStars * 0.8)} BDT</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Quick Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('BUY_STARS')}
            className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/10 transition-all text-xs"
          >
            <ArrowUpRight className="w-4 h-4 shrink-0" />
            <span>স্টার কিনুন 📥</span>
          </button>

          <button
            onClick={() => {
              if (profile.role !== 'creator') {
                alert('ক্যাশবুক ও উইথড্র সিস্টেম ব্যবহার করতে হলে আপনাকে অবশ্যই ক্রিয়েটর হতে হবে। দয়া করে সেটিংসে গিয়ে KYC ফর্ম জমা দিন। 🛡️');
                return;
              }
              onNavigate('WITHDRAW');
            }}
            className="bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-amber-600 dark:text-amber-400 border border-amber-250 font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all text-xs shadow-sm"
          >
            <ArrowDownLeft className="w-4 h-4 shrink-0" />
            <span>টাকা তুলুন 💸</span>
          </button>
        </div>

        {/* Metrics Grid Analytics */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-[24px] p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>ওয়ালেট সামারি বিশ্লেষণ</span>
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-zinc-400 block uppercase">সর্বমোট অর্জিত স্টার</span>
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                ⭐ {profile.totalStarsEarned}
              </span>
            </div>
            
            <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-zinc-400 block uppercase">সর্বমোট খরচকৃত স্টার</span>
              <span className="text-lg font-bold font-mono text-rose-500 dark:text-rose-400 mt-1 block">
                ⭐ {profile.totalStarsSpent}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Transaction history list row */}
        <div className="space-y-3">
          <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest pl-1">লেনদেনের ইতিহাস (Transaction History)</h2>

          {transactions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-[24px] border border-neutral-150 p-5 text-neutral-400">
              <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">কোনো লেনদেন রেকর্ড পাওয়া যায়নি।</p>
              <p className="text-[11px] mt-1 text-slate-400">পিকচার আনলক বা স্টার পার্চেজ করলে এখানে হিস্ট্রি চলে আসবে।</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isEarn = tx.type === 'post_earn' || tx.type === 'receive_gift' || tx.type === 'buy_stars';
                return (
                  <div
                    key={tx.id}
                    className="bg-white dark:bg-neutral-900 p-4 border border-neutral-100 dark:border-neutral-800 rounded-2xl flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${isEarn ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                        {tx.type === 'buy_stars' && <Smartphone className="w-4 h-4" />}
                        {tx.type === 'post_earn' && <Lock className="w-4 h-4" />}
                        {tx.type === 'unlock_post' && <Lock className="w-4 h-4" />}
                        {tx.type === 'send_gift' && <Gift className="w-4 h-4" />}
                        {tx.type === 'receive_gift' && <Gift className="w-4 h-4" />}
                        {tx.type === 'withdraw' && <Wallet className="w-4 h-4" />}
                      </div>

                      <div>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 block">
                          {tx.type === 'buy_stars' && 'স্টার রিচার্জ (বিকাশ/নগদ)'}
                          {tx.type === 'post_earn' && `ছবি আনলক আয় [${tx.referenceName}]`}
                          {tx.type === 'unlock_post' && `এক্সক্লুসিভ ছবি আনলক`}
                          {tx.type === 'send_gift' && `স্টার গিফট [${tx.referenceName}]`}
                          {tx.type === 'receive_gift' && `স্টার উপহার পেয়েছেন`}
                          {tx.type === 'withdraw' && 'ক্যাশ আউট রিকোয়েস্ট'}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 font-mono">
                          {new Date(tx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-black font-mono block ${isEarn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isEarn ? '+' : '-'}{tx.amountStars} ⭐
                      </span>
                      {tx.amountBDT && (
                        <span className="text-[10px] font-bold text-slate-500 block">
                          ৳{tx.amountBDT} BDT
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
