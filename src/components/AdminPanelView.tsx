/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, Trash2, UserX, Award, Coins, FileCheck, Landmark } from 'lucide-react';
import { dbService } from '../services/db';
import { Report, Post, UserProfile, WithdrawalRequest, TransactionItem } from '../types';

interface AdminPanelViewProps {
  onBack: () => void;
}

type AdminTab = 'kyc' | 'withdrawals' | 'reports' | 'users' | 'referrals';

export default function AdminPanelView({ onBack }: AdminPanelViewProps) {
  const [activeTab, setActiveTab] = React.useState<AdminTab>('kyc');
  const [reports, setReports] = React.useState<Report[]>([]);
  const [allUsers, setAllUsers] = React.useState<UserProfile[]>([]);
  const [withdrawals, setWithdrawals] = React.useState<WithdrawalRequest[]>([]);
  const [transactions, setTransactions] = React.useState<TransactionItem[]>([]);
  const [refSettings, setRefSettings] = React.useState({
    isEnabled: true,
    signupBonusStars: 10,
    purchaseCommissionPercent: 10
  });

  const loadAdminData = () => {
    setReports(dbService.getReports());
    setAllUsers(dbService.getUsers());
    setWithdrawals(dbService.getWithdrawalHistory());
    setRefSettings(dbService.getReferralSettings());
    
    // Aggregate global transaction logs
    const allTxs: TransactionItem[] = [];
    dbService.getUsers().forEach(u => {
      allTxs.push(...dbService.getTransactions(u.id));
    });
    setTransactions(allTxs);
  };

  React.useEffect(() => {
    loadAdminData();
    window.addEventListener('starconnect_db_update', loadAdminData);
    return () => window.removeEventListener('starconnect_db_update', loadAdminData);
  }, []);

  // Admin Actions
  const handleApproveKyc = (userId: string) => {
    dbService.approveKyc(userId);
    alert('ক্রিয়েটরের KYC সফলভাবে অনুমোদিত হয়েছে এবং আইডি ভেরিফাই মেডেল দেওয়া হয়েছে! 🌟🎖️');
    loadAdminData();
  };

  const handleRejectKyc = (userId: string) => {
    dbService.rejectKyc(userId);
    alert('ক্রিয়েটরের KYC রিকোয়েস্টটি বাতিল করা হয়েছে। ❌');
    loadAdminData();
  };

  const handleApproveWithdrawal = (id: string) => {
    dbService.approveWithdrawal(id);
    alert('পেমেন্ট সফলভাবে রিলিজ করা হয়েছে এবং ক্রিয়েটরকে নোটিফিকেশন পাঠানো হয়েছে! 💸');
    loadAdminData();
  };

  const handleRejectWithdrawal = (id: string) => {
    dbService.rejectWithdrawal(id);
    alert('ক্যালআউট ট্রান্সফার বাতিল করে রিফান্ড করা হয়েছে। ⟲');
    loadAdminData();
  };

  const handleBanUser = (userId: string) => {
    const confirm = window.confirm('আপনি কি নিশ্চিত যে এই ব্যবহারকারীকে সাময়িকভাবে ব্যান ও রেস্ট্রিক্ট করতে চান?');
    if (confirm) {
      dbService.banUser(userId);
      alert('ইউজার প্রোফাইল সফলভাবে রেস্ট্রিক্ট করা হয়েছে। 🛑');
      loadAdminData();
    }
  };

  const handleResolveReport = (reportId: string) => {
    dbService.resolveReport(reportId);
    alert('টিকিট রিপোর্ট সফলভাবে মীমাংসা (Resolved) হয়েছে। ✅');
    loadAdminData();
  };

  // Computations
  const totalStarsSold = transactions
    .filter(t => t.type === 'buy_stars' && t.status === 'completed')
    .reduce((sum, curr) => sum + curr.amountStars, 0);

  const totalRevenueBDT = transactions
    .filter(t => t.type === 'buy_stars' && t.status === 'completed')
    .reduce((sum, curr) => sum + (curr.amountBDT || 0), 0);

  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'pending').length;
  const pendingKycCount = allUsers.filter(u => u.kycStatus === 'pending').length;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-zinc-950 overflow-y-auto pb-16">
      
      {/* Admin Title Bar */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200/50 dark:border-neutral-850 bg-white dark:bg-neutral-900 sticky top-0 z-25">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 mr-2"
          >
            <ArrowLeft className="w-6 h-6 text-slate-800 dark:text-neutral-200" />
          </button>
          <div className="flex items-center gap-1">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h1 className="text-base font-extrabold text-indigo-600 tracking-tight">অ্যাডমিন সিস্টেম কন্ট্রোল</h1>
          </div>
        </div>

        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
          LIVE CONFIG
        </span>
      </div>

      <div className="p-4 space-y-5">
        
        {/* Analytics dashboard boxes */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-5 shadow-xl space-y-4">
          <h2 className="text-[10px] uppercase tracking-widest pl-0.5 text-indigo-300 font-bold select-none">গুরুত্বপূর্ণ নোড ও আয় পরিসংখ্যান</h2>
          
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-white/10 p-3 rounded-2xl border border-white/5">
              <span className="text-[9px] text-indigo-200 block uppercase font-bold">টোটাল পেমেন্ট রিসিভড</span>
              <span className="text-lg font-black font-mono block mt-1 text-emerald-400">৳ {totalRevenueBDT}</span>
              <span className="text-[9px] text-zinc-400 font-bold block">{totalStarsSold} Stars Sold</span>
            </div>

            <div className="bg-white/10 p-3 rounded-2xl border border-white/5">
              <span className="text-[9px] text-indigo-200 block uppercase font-bold">উইথড্রয়াল পেন্ডিং</span>
              <span className="text-lg font-black font-mono block mt-1 text-amber-400">{pendingWithdrawalsCount} রিকোয়েস্ট</span>
              <span className="text-[9px] text-zinc-400 font-bold block">৳ {withdrawals.filter(w=>w.status==='pending').reduce((s,c)=>s+c.amountBDT,0)} BDT value</span>
            </div>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="grid grid-cols-5 gap-1.5 bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-neutral-200">
          <button
            onClick={() => setActiveTab('kyc')}
            className={`py-2 rounded-xl text-[10px] font-black transition text-center flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'kyc'
                ? 'bg-indigo-650 text-white font-extrabold shadow-sm'
                : 'text-zinc-500 hover:bg-slate-50'
            }`}
          >
            <FileCheck className="w-4 h-4 shrink-0" />
            <span className="relative">
              KYC {pendingKycCount > 0 && (
                <span className="absolute -top-1.5 -right-3 w-2 h-2 rounded-full bg-rose-500"></span>
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`py-2 rounded-xl text-[10px] font-black transition text-center flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'withdrawals'
                ? 'bg-indigo-650 text-white font-extrabold shadow-sm'
                : 'text-zinc-500 hover:bg-slate-50'
            }`}
          >
            <Landmark className="w-4 h-4 shrink-0" />
            <span className="relative">
              টাকা তোলা {pendingWithdrawalsCount > 0 && (
                <span className="absolute -top-1.5 -right-3 w-2 h-2 rounded-full bg-rose-500"></span>
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 rounded-xl text-[10px] font-black transition text-center flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-indigo-650 text-white font-extrabold shadow-sm'
                : 'text-zinc-500 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>অভিযোগ</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 rounded-xl text-[10px] font-black transition text-center flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-indigo-650 text-white font-extrabold shadow-sm'
                : 'text-zinc-500 hover:bg-slate-50'
            }`}
          >
            <UserX className="w-4 h-4 shrink-0" />
            <span>ইউজারস</span>
          </button>

          <button
            onClick={() => setActiveTab('referrals')}
            className={`py-2 rounded-xl text-[10px] font-black transition text-center flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'referrals'
                ? 'bg-indigo-650 text-white font-extrabold shadow-sm'
                : 'text-zinc-500 hover:bg-slate-50'
            }`}
          >
            <Coins className="w-4 h-4 shrink-0" />
            <span>রেফারেল</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-4 animate-fadeIn">
          
          {/* Tab A: KYC Queue */}
          {activeTab === 'kyc' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">KYC অনুমোদন পেন্ডিং বাকেট</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full">{pendingKycCount} applications</span>
              </div>

              {allUsers.filter(u => u.kycStatus === 'pending').length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-[24px] border border-neutral-150 p-5 text-neutral-400">
                  <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">কোনো পেন্ডিং KYC রিকোয়েস্ট নেই। 😊</p>
                  <p className="text-[10px] mt-1">সব ক্রিয়েটর আবেদন সফলভাবে প্রসেস করা রয়েছে।</p>
                </div>
              ) : (
                allUsers.filter(u => u.kycStatus === 'pending').map((uc) => (
                  <div
                    key={uc.id}
                    className="bg-white dark:bg-neutral-900 border border-neutral-150 rounded-[22px] p-5.5 shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-neutral-200">
                          <img src={uc.avatarUrl} alt={uc.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-800 dark:text-zinc-200 block">{uc.name}</span>
                          <span className="text-[10px] text-zinc-400 font-bold font-mono">@{uc.username} • {uc.phone}</span>
                        </div>
                      </div>

                      <span className="text-[10.5px] bg-amber-50 text-amber-600 px-3 py-1 rounded-full font-black select-none">
                        PENDING
                      </span>
                    </div>

                    <div className="p-3 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200/50 rounded-xl space-y-2 text-xs">
                      <div>
                        <span className="text-zinc-400 text-[9.5px] font-black uppercase">সত্যিকারের নাম (NID)</span>
                        <p className="font-bold text-slate-800 mt-0.5">{uc.kycRealName || 'Not Set'}</p>
                      </div>
                      
                      <div className="border-t border-dashed border-neutral-200/50 pt-2">
                        <span className="text-zinc-400 text-[9.5px] font-black uppercase">এনআইডি নম্বর বা পাসপোর্ট</span>
                        <p className="font-bold text-slate-800 font-mono mt-0.5">{uc.kycNidOrPassport || 'Not Set'}</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 text-[10.5px] font-black pt-1">
                      <button
                        onClick={() => handleRejectKyc(uc.id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 py-2.5 px-4.5 rounded-xl transition cursor-pointer"
                      >
                        বাতিল বা রিজেক্ট
                      </button>
                      <button
                        onClick={() => handleApproveKyc(uc.id)}
                        className="bg-amber-500 hover:bg-amber-600 text-white py-2.5 px-6 rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>ভেরিফাই স্ট্যাটাস দিন</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab B: Withdrawals Approvals */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">টাকা তোলার রিকোয়েস্টস</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full">{pendingWithdrawalsCount} pending cashouts</span>
              </div>

              {withdrawals.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-10 bg-white border border-neutral-200 rounded-[24px]">কোনো উইথড্র রিকোয়েস্ট জমা পড়েনি।</p>
              ) : (
                withdrawals.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-neutral-900 border border-neutral-150 rounded-[22px] p-5 shadow-sm space-y-4"
                  >
                    <div className="flex justify-between">
                      <div>
                        <span className="text-xs font-black text-slate-800 dark:text-zinc-200 block">{req.userName}</span>
                        <span className="text-[9px] font-bold font-mono text-zinc-400 block uppercase">
                          কোড: {req.id} • {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                        req.status === 'pending'
                          ? 'bg-amber-100 text-amber-600'
                          : req.status === 'approved'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-rose-100 text-rose-600'
                      }`}>
                        {req.status === 'pending' ? 'পেন্ডিং' : req.status === 'approved' ? 'সম্পন্ন' : 'বাতিল'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl">
                      <div>
                        <span className="text-zinc-400 text-[9.5px] font-bold uppercase block leading-none">উত্তোলন মেথড</span>
                        <span className="font-extrabold text-[#D12053] block mt-1">{req.method}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[9.5px] font-bold uppercase block leading-none">মোবাইল ওয়ালেট নম্বর</span>
                        <span className="font-extrabold text-slate-800 dark:text-zinc-200 block font-mono mt-1">{req.accountNumber}</span>
                      </div>
                      <div className="border-t border-neutral-200/30 pt-2 mt-2">
                        <span className="text-zinc-400 text-[9.5px] font-bold uppercase block leading-none">পরিমাণ (BDT)</span>
                        <span className="font-black text-slate-800 dark:text-zinc-200 block mt-1 font-mono">৳ {req.amountBDT} BDT</span>
                      </div>
                      <div className="border-t border-neutral-200/30 pt-2 mt-2">
                        <span className="text-zinc-400 text-[9.5px] font-bold uppercase block leading-none">স্টার ডেবিট রেট</span>
                        <span className="font-black text-zinc-500 block mt-1 font-mono">⭐ {req.amountStars} Stars</span>
                      </div>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex justify-end gap-2 text-[10.5px] font-black pt-1">
                        <button
                          onClick={() => handleRejectWithdrawal(req.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 py-2.5 px-4 rounded-xl transition cursor-pointer"
                        >
                          পেমেন্ট রিজেক্ট
                        </button>
                        <button
                          onClick={() => handleApproveWithdrawal(req.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-6 rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1"
                        >
                          <Coins className="w-4 h-4" />
                          <span>পেমেন্ট প্রেরণ করুন</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab C: Reports moderation */}
          {activeTab === 'reports' && (
            <div className="space-y-3">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">অভিযোগ টিকিটসমূহ</h2>

              {reports.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-10 bg-white border border-neutral-200 rounded-[24px]">কোনো অভিযোগ টিকিট জমা নেই।</p>
              ) : (
                reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="bg-white dark:bg-neutral-900 border border-neutral-150 p-4 rounded-2xl shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2">
                      <div className="text-[10.5px]">
                        <p className="font-bold text-slate-700">অভিযোগকারী: {rep.reporterName}</p>
                        <p className="text-neutral-400 mt-0.5">অভিযুক্ত: {rep.reportedName}</p>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        rep.status === 'pending' ? 'bg-rose-100 text-rose-650' : 'bg-green-150 text-green-650'
                      }`}>
                        {rep.status === 'pending' ? 'পেন্ডিং' : 'সমাধানকৃত'}
                      </span>
                    </div>

                    <div className="text-xs bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl space-y-2">
                      <p className="text-[11px] font-semibold text-rose-650 italic">কারণ: "{rep.reason}"</p>
                      {rep.postContent && (
                        <div className="border-t border-dashed border-neutral-200/50 pt-1.5 mt-1 text-[10.5px]">
                          <span className="font-bold text-zinc-400">রিপোর্টেড পোস্টের সারাংশ:</span>
                          <p className="line-clamp-2 text-zinc-500 mt-0.5">{rep.postContent}</p>
                        </div>
                      )}
                    </div>

                    {rep.status === 'pending' && (
                      <div className="flex justify-end gap-2 text-[10px] font-bold">
                        <button
                          onClick={() => handleBanUser(rep.reportedId)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-500 py-1.5 px-3 rounded-lg flex items-center gap-1 border border-rose-100 cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>ইউজার ব্লক ব্যান</span>
                        </button>
                        <button
                          onClick={() => handleResolveReport(rep.id)}
                          className="bg-amber-500 hover:bg-amber-600 text-white py-1.5 px-4 rounded-lg flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>রিপোর্ট ক্লোজ করুন</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab D: Users overview lists */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">নিবন্ধিত অ্যাকাউন্টসমূহ (User Pool)</h2>

              <div className="bg-white dark:bg-neutral-900 rounded-[24px] border border-neutral-150 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden shadow-sm">
                {allUsers.map((user) => (
                  <div key={user.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-neutral-100">
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 flex items-center gap-1 leading-none">
                          {user.name}
                          {user.isVerified && <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-550" />}
                          {user.role === 'creator' && <Award className="w-3.5 h-3.5 text-amber-500" />}
                        </span>
                        <span className="text-[9.5px] font-mono text-zinc-400 mt-1 block">@{user.username} • {user.phone}</span>
                        <span className="text-[9.5px] font-bold text-emerald-600 font-mono mt-0.5 block">ওয়ালেট: ⭐{user.starBalance}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {user.id !== 'user_admin' && (
                        <button
                          onClick={() => handleBanUser(user.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                          title="Restrict Account"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab E: Referral Settings and Commission Control */}
          {activeTab === 'referrals' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-150 rounded-[22px] p-5 shadow-sm space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">রেফারেল ও কমিশন সিস্টেম</h3>
                    <p className="text-[10px] text-zinc-400 font-bold">আইপড বা এডমিন প্যানেল কনফিগারেশন</p>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button
                    onClick={() => {
                      const updated = { ...refSettings, isEnabled: !refSettings.isEnabled };
                      setRefSettings(updated);
                      dbService.updateReferralSettings(updated);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      refSettings.isEnabled ? 'bg-indigo-600' : 'bg-zinc-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        refSettings.isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Signup Bonus Stars */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-700 dark:text-neutral-300 uppercase tracking-wide">
                      নতুন মেম্বার সাইন-আপ বোনাস (Stars)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        disabled={!refSettings.isEnabled}
                        type="number"
                        min="0"
                        value={refSettings.signupBonusStars}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          const updated = { ...refSettings, signupBonusStars: val };
                          setRefSettings(updated);
                        }}
                        className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-zinc-950 focus:outline-none text-slate-800 dark:text-neutral-200 disabled:opacity-50"
                      />
                      <span className="text-xs text-zinc-500 font-bold shrink-0">স্টারস</span>
                    </div>
                    <p className="text-[9.5px] text-zinc-400">কেউ অন্য কারো রেফার কোড ব্যবহার করে অ্যাকাউন্ট খুললে রেফারকারী এই বোনাসটি পাবেন।</p>
                  </div>

                  {/* Purchase Commission Rate */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-700 dark:text-neutral-300 uppercase tracking-wide">
                      স্টার রিচার্জ কমিশন রেট (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        disabled={!refSettings.isEnabled}
                        type="number"
                        min="0"
                        max="100"
                        value={refSettings.purchaseCommissionPercent}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                          const updated = { ...refSettings, purchaseCommissionPercent: val };
                          setRefSettings(updated);
                        }}
                        className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-zinc-950 focus:outline-none text-slate-800 dark:text-neutral-200 disabled:opacity-50"
                      />
                      <span className="text-xs text-zinc-500 font-bold shrink-0">পারসেন্ট</span>
                    </div>
                    <p className="text-[9.5px] text-zinc-400">রেফার করা নতুন মেম্বার স্টার রিচার্জ করলে রেফারকারী কত পারসেন্ট কমিশন স্টার লাভ করবেন।</p>
                  </div>

                  <button
                    disabled={!refSettings.isEnabled}
                    onClick={() => {
                      dbService.updateReferralSettings(refSettings);
                      alert('রেফারেল ও কমিশন সেটিংস সফলভাবে আপডেট করা হয়েছে! 🌟🔒');
                    }}
                    className="w-full py-3 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Coins className="w-4 h-4" />
                    <span>সেটিংস পরিবর্তন সংরক্ষণ করুন</span>
                  </button>
                </div>
              </div>

              {/* Referral leaderboard/report of referrers */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-150 rounded-[22px] p-5 shadow-sm space-y-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">টপ রেফারার তালিকা</span>
                
                <div className="divide-y divide-neutral-100 dark:divide-neutral-850">
                  {allUsers
                    .filter(u => (u.referralsCount || 0) > 0)
                    .sort((a, b) => (b.referralsCount || 0) - (a.referralsCount || 0))
                    .map((user, i) => (
                      <div key={user.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-indigo-650">#{i + 1}</span>
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-neutral-100">
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">{user.name}</span>
                            <span className="text-[9.5px] font-mono text-zinc-400 block">কোড: {user.referralCode || user.username}</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-800 dark:text-zinc-150 block">{user.referralsCount} জন রেফার</span>
                          <span className="text-[9px] text-amber-600 dark:text-amber-450 font-bold block">⭐ +{(user.totalReferralBonus || 0)} বোনাস লাভ</span>
                        </div>
                      </div>
                    ))}
                  {allUsers.filter(u => (u.referralsCount || 0) > 0).length === 0 && (
                    <p className="text-xs text-neutral-400 text-center py-6">এখনো কেউ সফল কোনো রেফার সম্পন্ন করেননি।</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
