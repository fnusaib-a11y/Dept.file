/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, CheckCircle, UploadCloud, Send, ShieldCheck } from 'lucide-react';
import { dbService } from '../services/db';
import { UserProfile } from '../types';

interface VerifyRequestViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function VerifyRequestView({ onBack, onSuccess }: VerifyRequestViewProps) {
  const [realName, setRealName] = React.useState('');
  const [nid, setNid] = React.useState('');
  const [photoUploaded, setPhotoUploaded] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);

  React.useEffect(() => {
    setProfile(dbService.getCurrentUser());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!realName.trim() || !nid.trim() || !photoUploaded) {
      alert('সবগুলো ঘর পূরণ করা আবশ্যক!');
      return;
    }

    setIsSubmitting(true);
    
    setTimeout(() => {
      // Submits to DB kyc system
      dbService.submitKyc(realName, nid);
      setIsSubmitting(false);
      alert('আপনার ক্রিয়েটর মডারেটর KYC সাকসেসফুলি পেন্ডিং তালিকায় দাখিল করা হয়েছে। অ্যাডমিন প্যানেল ২৪ ঘণ্টার মদ্ধ্যে ভেরিফিকেশন সীল প্রদান করবে। 🛡️');
      onSuccess();
    }, 1500);
  };

  if (!profile) return null;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-zinc-950 overflow-y-auto pb-16">
      
      {/* Top Header */}
      <div className="flex items-center px-4 py-3.5 border-b border-neutral-200/50 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-20">
        <button
          onClick={onBack}
          className="p-1 rounded-full hover:bg-neutral-150 dark:hover:bg-zinc-800 mr-2"
        >
          <ArrowLeft className="w-6 h-6 text-slate-800 dark:text-neutral-200" />
        </button>
        <ShieldCheck className="w-5 h-5 text-indigo-600 mr-1.5 shrink-0" />
        <h1 className="text-base font-extrabold text-slate-900 dark:text-white">ক্রিয়েটর মডারেটর ভেরিফিকেশন</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        
        {/* Verification banner description */}
        <div className="bg-indigo-50 dark:bg-indigo-950/25 border border-indigo-100 dark:border-indigo-900/40 p-4.5 rounded-2xl flex gap-3 select-none">
          <CheckCircle className="w-8 h-8 text-indigo-605 fill-indigo-105 shrink-0" />
          <div className="text-xs space-y-1">
            <span className="font-extrabold text-indigo-800 dark:text-indigo-300">ক্রিয়েটর ক্যাশ-আউট প্রোফাইল</span>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed font-semibold">
              ভার্চুয়াল স্টার কানেক্ট প্ল্যাটফর্মে ছবি আপলোড করে টাকা আয় করতে হলে জাতীয় পরিচয়পত্র (KYC) যাচাই আবশ্যক। সফল হওয়া মাত্র আইডি মেম্বারশিপ "ক্রিয়েটর" রোল-এ আপগ্রেড করা হবে।
            </p>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="bg-white dark:bg-neutral-900 rounded-[24px] p-5 border border-neutral-150 shadow-sm space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase block pl-0.5">জাতীয় পরিচয়পত্র অনুযায়ী পুরো নাম (Real Name)</label>
            <input
              type="text"
              required
              placeholder="যেমন: মাইমুন ইসলাম"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-neutral-250 dark:border-neutral-800 rounded-xl px-4 py-3 text-xs text-slate-850 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase block pl-0.5">জাতীয় পরিচয়পত্র নম্বর (NID) / পাসপোর্ট নম্বর</label>
            <input
              type="text"
              required
              placeholder="যেমন: ৩২৭ ৪৬৮ ৯১০২"
              value={nid}
              onChange={(e) => setNid(e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-neutral-250 dark:border-neutral-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-850 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-400 block pl-0.5 uppercase">পরিচয়পত্র ফ্রন্ট-পেজ কপি আপলোড</label>
            
            {photoUploaded ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 text-center rounded-xl space-y-1 select-none">
                <span className="text-xs font-semibold text-amber-600">আইডেনটিটি ছবি সফলভাবে লোড হয়েছে! 📥</span>
                <p className="text-[10px] text-zinc-400">নিচের সাবমিট বাটনে ক্লিক করে ফাইল প্রসেস করুন।</p>
                <button
                  type="button"
                  onClick={() => setPhotoUploaded(false)}
                  className="text-[10px] text-indigo-500 font-bold block mx-auto hover:underline mt-1"
                >
                  অন্য ছবি দিন
                </button>
              </div>
            ) : (
              <div
                onClick={() => setPhotoUploaded(true)}
                className="border-2 border-dashed border-indigo-200 bg-indigo-50/20 dark:bg-neutral-900 p-8 text-center rounded-xl flex flex-col items-center justify-center space-y-2 cursor-pointer select-none hover:border-indigo-400 transition"
              >
                <UploadCloud className="w-8 h-8 text-indigo-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">ক্লিক করে ফাইলের কপি সংযুক্ত করুন</span>
                <p className="text-[10px] text-neutral-400">PDF, JPG বা PNG ফরমেট (সর্বোচ্চ ৫ মেগাবাইট)</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || !nid.trim() || !realName.trim() || !photoUploaded}
          className="w-full bg-indigo-600 disabled:bg-neutral-300 text-white font-black text-xs py-3.5 rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isSubmitting ? (
            <span>নিরাপদ নথিপত্র কোড যাচাই হচ্ছে...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>KYC ভেরিফিকেশন দাখিল করুন</span>
            </>
          )}
        </button>

      </form>
    </div>
  );
}
