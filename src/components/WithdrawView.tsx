/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Wallet, Send, ShieldCheck, HelpCircle, AlertCircle } from 'lucide-react';
import { dbService } from '../services/db';
import { WithdrawalRequest, UserProfile } from '../types';

interface WithdrawViewProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export default function WithdrawView({ onBack, onSuccess }: WithdrawViewProps) {
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [history, setHistory] = React.useState<WithdrawalRequest[]>([]);
  
  // Withdraw Input States
  const [starsToWithdraw, setStarsToWithdraw] = React.useState('');
  const [method, setMethod] = React.useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const loadData = () => {
    const user = dbService.getCurrentUser();
    setProfile(user);
    if (user) {
      setHistory(dbService.getWithdrawalHistory(user.id));
    }
  };

  React.useEffect(() => {
    loadData();
    window.addEventListener('starconnect_db_update', loadData);
    return () => window.removeEventListener('starconnect_db_update', loadData);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const stars = parseInt(starsToWithdraw);
    if (isNaN(stars) || stars <= 0) {
      setErrorMessage('সঠিক স্টারের পরিমাণ দিন!');
      return;
    }

    if (!accountNumber) {
      setErrorMessage('লেনদেন মোবাইল ওয়ালেট নম্বর প্রদান করুন!');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const res = dbService.submitWithdrawal(stars, method, accountNumber);
      if (res.success) {
        alert('আপনার ক্যাশ আউট রিকোয়েস্টটি পেন্ডিং আকারে দাখিল করা হয়েছে। অ্যাডমিন টিম অতিসত্বর বিকাশ/নগদের মাধ্যমে পেমেন্ট রিলিজ করবে। 💸🔐');
        setStarsToWithdraw('');
        setAccountNumber('');
        loadData();
        onSuccess?.();
      } else {
        setErrorMessage(res.error || 'আবেদন প্রক্রিয়াকরণে কোনো ত্রুটি ঘটেছে।');
      }
    }, 1500);
  };

  if (!profile) return null;

  const currentWithdrawableBDT = Math.round(profile.pendingBalanceStars * 0.8);
  const enteredStarsValue = parseInt(starsToWithdraw) || 0;
  const estimatedBDTValue = Math.round(enteredStarsValue * 0.8);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-zinc-950 overflow-y-auto pb-16">
      
      {/* Header */}
      <div className="flex items-center px-4 py-3.5 border-b border-neutral-200/50 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-20">
        <button
          onClick={onBack}
          className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 mr-2"
        >
          <ArrowLeft className="w-6 h-6 text-slate-800 dark:text-neutral-200" />
        </button>
        <Wallet className="w-5 h-5 text-amber-500 mr-1.5" />
        <h1 className="text-base font-extrabold text-slate-900 dark:text-white">টাকা পেমেন্ট বা ক্যাশ-আউট</h1>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Wallet Cashout Info Cards */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-150 rounded-[24px] p-5 shadow-sm">
          <span className="text-[10px] font-black text-zinc-400 block uppercase tracking-wider pl-0.5">আপনার উইথড্রযোগ্য পেন্ডিং ব্যালেন্স</span>
          <div className="my-2 flex items-baseline gap-1.5 select-none text-amber-600 dark:text-amber-400 font-extrabold text-2xl font-mono">
            <span>⭐ {profile.pendingBalanceStars}</span>
            <span className="text-xs font-semibold text-zinc-400">স্টারস</span>
          </div>
          <div className="flex items-baseline gap-1 select-none text-zinc-500 text-xs mt-1">
            <span>সমমূল্য ক্যাশ আউট মান:</span>
            <span className="font-extrabold text-slate-800 dark:text-white font-mono">৳{currentWithdrawableBDT} BDT</span>
          </div>
        </div>

        {/* Withdrawal Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 rounded-[28px] p-5 border border-neutral-100 dark:border-neutral-850 shadow-sm space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 border-b border-neutral-50 dark:border-neutral-800 pb-2 flex items-center gap-1.5">
            <Send className="w-4 h-4 text-amber-500" /> 
            <span>উইথড্র রিকোয়েস্ট ফর্ম</span>
          </h2>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-100/65 dark:bg-rose-950/20 dark:border-rose-900/30 p-3.5 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-450 text-xs">
              <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase block pl-1">কত স্টার তুলতে চান? (সর্বনিম্ন ৫০০)</label>
            <input
              type="number"
              required
              min={500}
              placeholder="যেমন: ১৫০০"
              value={starsToWithdraw}
              onChange={(e) => setStarsToWithdraw(e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-neutral-250 dark:border-neutral-800 rounded-xl px-4 py-3 text-xs font-mono font-bold block text-slate-800 dark:text-white focus:outline-amber-500"
            />
            {enteredStarsValue > 0 && (
              <span className="text-[10px] font-bold text-amber-600 block pl-1">
                আপনি পাবেন (উত্তোলন সমমূল্য): <b>৳{estimatedBDTValue} BDT</b> (১ স্টার = ৳০.৮ বিডিটি)
              </span>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase block pl-1">টাকা পাঠানোর মাধ্যম</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('bKash')}
                className={`py-2.5 rounded-xl text-center text-xs font-black transition active:scale-95 border cursor-pointer ${
                  method === 'bKash'
                    ? 'border-[#D12053] bg-[#D12053]/5 text-[#D12053] font-extrabold shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-zinc-400'
                }`}
              >
                bKash 🍒
              </button>
              <button
                type="button"
                onClick={() => setMethod('Nagad')}
                className={`py-2.5 rounded-xl text-center text-xs font-black transition active:scale-95 border cursor-pointer ${
                  method === 'Nagad'
                    ? 'border-[#EC5B24] bg-[#EC5B24]/5 text-[#EC5B24] font-extrabold shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-zinc-400'
                }`}
              >
                Nagad 🍊
              </button>
              <button
                type="button"
                onClick={() => setMethod('Rocket')}
                className={`py-2.5 rounded-xl text-center text-xs font-black transition active:scale-95 border cursor-pointer ${
                  method === 'Rocket'
                    ? 'border-[#8C3494] bg-[#8C3494]/5 text-[#8C3494] font-extrabold shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-zinc-400'
                }`}
              >
                Rocket 🍇
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase block pl-1">{method} পার্সোনাল নম্বর</label>
            <input
              type="tel"
              required
              placeholder="যেমন: ০১XXXXXXXXX"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-neutral-250 dark:border-neutral-800 rounded-xl px-4 py-3 text-xs block text-slate-800 dark:text-white focus:outline-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-98 relative shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="animate-pulse">অনুমতি ও ভেরিফিকেশন যাচাই করা হচ্ছে...</span>
            ) : (
              <>
                <Send className="w-4.5 h-4.5" />
                <span>উইথড্র রিকোয়েস্ট সাবমিট করুন</span>
              </>
            )}
          </button>
        </form>

        {/* Withdrawal Guidelines and Info */}
        <div className="bg-slate-100 dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl space-y-2 text-[10.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          <p className="flex items-center gap-1 font-bold text-slate-700 dark:text-zinc-200">
            <ShieldCheck className="w-4.5 h-4.5 text-amber-500 shrink-0" />
            <span>অফিসিয়াল উইথড্রয়্যাল কন্ডিশনস</span>
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>ক্যাশ আউট রিকোয়েস্ট সাবমিট হওয়ার ২৪-৪৮ ঘণ্টার মধ্যে এডমিন দ্বারা যাচাই করে অনুমোদিত করা হয়।</li>
            <li>১টি স্টারের বিনিময় মূল্য ৳০.৮০ বিডিটি। (২০% ফ্ল্যাট ফি প্লাটফর্ম সিকিউরিটি সলিউশন ও ক্লাউড মডারেটর চার্জ বাবদ কর্তিত হয়)।</li>
            <li>যেকোনো ত্রুটিপূর্ণ অ্যাকাউন্ট বা সন্দেহজনক ট্রানজেকশন বাতিল বা হোল্ড করে রাখা হতে পারে।</li>
          </ul>
        </div>

        {/* History List logs */}
        <div className="space-y-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">টাকা তোলার রেকর্ডস (Withdrawal Log)</h2>

          {history.length === 0 ? (
            <p className="text-xs text-neutral-400 text-center py-8 bg-white dark:bg-neutral-900 border border-neutral-200 rounded-[24px]">এখনো কোনো ক্যাশআউট রিকোয়েস্ট হিস্ট্রি নেই।</p>
          ) : (
            <div className="space-y-2.5">
              {history.map((req) => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-neutral-900 p-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm flex justify-between items-center"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 block">
                      {req.method} ক্যাশ আউট উত্তোলন
                    </span>
                    <span className="text-[9px] font-bold font-mono text-zinc-400 block">
                      অ্যাকাউন্ট: {req.accountNumber}
                    </span>
                    <span className="text-[10px] font-bold font-mono text-zinc-400 block">
                      {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-right space-y-1.5">
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-200 block font-mono">
                      ৳{req.amountBDT} BDT
                    </span>
                    <span className="text-[9.5px] font-bold text-zinc-400 block font-mono">
                      ({req.amountStars} Stars)
                    </span>
                    
                    <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full ${
                      req.status === 'pending'
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/20'
                        : req.status === 'approved'
                        ? 'bg-green-100 text-green-600 dark:bg-green-950/20'
                        : 'bg-rose-100 text-rose-600 dark:bg-rose-950/20'
                    }`}>
                      {req.status === 'pending' && 'পেন্ডিং'}
                      {req.status === 'approved' && 'অনুমোদিত'}
                      {req.status === 'rejected' && 'বাতিল'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
