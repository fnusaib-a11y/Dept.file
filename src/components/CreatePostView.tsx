/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Sparkles, Image as ImageIcon, Loader2, Coins, Lock } from 'lucide-react';
import { dbService } from '../services/db';

interface CreatePostViewProps {
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePostView({ onClose, onPostCreated }: CreatePostViewProps) {
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [category, setCategory] = React.useState('বিনোদন');
  const [isPremium, setIsPremium] = React.useState(false);
  const [starPrice, setStarPrice] = React.useState('50');
  
  const [mediaType, setMediaType] = React.useState<'image' | 'video' | 'none'>('none');
  const [mediaUrl, setMediaUrl] = React.useState<string>('');

  // AI states
  const [aiTopic, setAiTopic] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [showAiPrompt, setShowAiPrompt] = React.useState(false);

  // Preset mock media choices matching modern aesthetic
  const PRESET_IMAGES = [
    { name: 'লাল পাহাড়ের সকাল ⛰️', url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=800&q=80' },
    { name: 'সমুদ্রের ঢেউ 🌊', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
    { name: 'কফি আর্ট ☕', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80' },
    { name: 'শহরের আলো 🌆', url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80' }
  ];

  const PRESET_VIDEOS = [
    { name: 'ক্যামেরা লেন্স 📸', url: 'https://assets.mixkit.co/videos/preview/mixkit-city-lights-at-night-reflected-in-the-rain-34305-large.mp4' },
    { name: 'বৃষ্টির আবহাওয়া 🌧️', url: 'https://assets.mixkit.co/videos/preview/mixkit-playing-football-in-the-rain-32986-large.mp4' }
  ];

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl) return;

    const finalPrice = isPremium ? (parseInt(starPrice) || 30) : 0;

    dbService.createPost(
      title || 'নতুন গ্ল্যামার ছবি',
      content,
      mediaUrl,
      mediaType,
      category,
      isPremium,
      finalPrice,
      ['Photography', category]
    );

    alert('সাফল্য! নতুন পোস্টটি সফলভাবে স্ট্রিমিং চ্যানেলে যুক্ত করা হয়েছে। 🚀');
    onPostCreated();
  };

  const handleGenerateCaption = async () => {
    if (!aiTopic.trim()) return;
    setIsGenerating(true);
    try {
      const resp = await fetch('/api/gemini/suggest-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiTopic })
      });
      const data = await resp.json();
      if (data.caption) {
        setContent(data.caption);
        setShowAiPrompt(false);
      }
    } catch (e) {
      console.warn("AI generation delayed, continuing with local input suggestions");
      // Fallback suggest
      setContent(`ক্যামেরায় বন্দি চমৎকার একটি মূহুর্ত: ${aiTopic}। নতুন ও এক্সক্লুসিভ ছবির জন্য আমার প্রোফাইলটি ফলো করতে ভুলবেন না! 🌸✨`);
      setShowAiPrompt(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectPresetMedia = (type: 'image' | 'video', url: string) => {
    setMediaType(type);
    setMediaUrl(url);
    if (type === 'video') {
      setCategory('বিনোদন');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type;
    const isImage = fileType.startsWith('image/');
    const isVideo = fileType.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('অনুগ্রহ করে শুধুমাত্র ছবি বা ভিডিও ফাইল সিলেক্ট করুন।');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('ফাইল সাইজ অনেক বড় (সর্বোচ্চ ১০ মেগাবাইট)।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      if (isImage) {
        // Compress image using canvas
        const img = new Image();
        img.src = result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max size bounds
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedResult = canvas.toDataURL('image/jpeg', 0.7);
          setMediaUrl(compressedResult);
          setMediaType('image');
        };
      } else {
        if (file.size > 3 * 1024 * 1024) {
          alert('ভিডিও ফাইল ৩ মেগাবাইটের বেশি মেমরি ব্যবহার করবে। ছোট সাইজের ভিডিও ট্রাই করুন।');
        }
        setMediaUrl(result);
        setMediaType('video');
        setCategory('বিনোদন');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handleShare} className="flex-1 flex flex-col bg-slate-50 dark:bg-zinc-950 overflow-y-auto pb-20">
      
      {/* Top Header */}
      <div className="flex justify-between items-center px-4 py-3.5 border-b border-neutral-200/50 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-850 text-neutral-800 dark:text-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-base font-extrabold text-slate-800 dark:text-white">নতুন প্রিমিয়াম ফটো বা ভিডিও</span>
        </div>
        
        <button
          type="submit"
          disabled={!content.trim() && !mediaUrl}
          className="bg-amber-500 disabled:bg-neutral-300 text-white font-black text-xs px-5 py-2.5 rounded-full shadow hover:bg-amber-600 active:scale-95 transition cursor-pointer"
        >
          শেয়ার করুন 🚀
        </button>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Title Input Field */}
        <div className="space-y-1 bg-white dark:bg-zinc-900 px-4 py-3 border border-neutral-150 rounded-2xl">
          <label className="text-[10px] font-black text-zinc-400 uppercase block">পোস্টের মূল নাম (Title)</label>
          <input
            type="text"
            required
            placeholder="যেমন: কুয়াশায় ঘেরা সকাল"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs font-bold leading-normal focus:outline-none p-0.5 bg-transparent text-slate-800 dark:text-white"
          />
        </div>

        {/* Content input */}
        <div className="space-y-1 bg-white dark:bg-zinc-900 px-4 py-3 border border-neutral-150 rounded-2xl">
          <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">ক্যাপশন বা বিবরণ (Description)</label>
          <textarea
            placeholder="ফটো বা ভিডিওর মনোরম গল্পটি এখানে বলুন..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-24 resize-none focus:outline-none text-xs leading-relaxed bg-transparent text-slate-800 dark:text-white"
          />
        </div>

        {/* AI Caption helper */}
        {!showAiPrompt ? (
          <button
            type="button"
            onClick={() => setShowAiPrompt(true)}
            className="flex items-center gap-1.5 text-[10.5px] font-black text-amber-600 dark:text-amber-400 bg-amber-50/20 px-4 py-2.5 rounded-xl border border-amber-200/50 cursor-pointer active:scale-98 transition mx-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI দিয়ে বাংলা বিবরণ লিখুন</span>
          </button>
        ) : (
          <div className="bg-[#fdfbf7] dark:bg-neutral-900 p-4 rounded-2xl border border-amber-200/50 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-amber-100/45">
              <span className="text-[10.5px] font-black text-amber-600 flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                <span>মডারেটর AI ক্যাপশন লেখক</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAiPrompt(false)}
                className="text-zinc-400 hover:text-slate-600 text-xs font-bold"
              >
                বন্ধ ✕
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="যেমন: সাজেক ভ্যালি ট্যুর, কাপ অব কফি..."
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="flex-1 text-xs border border-neutral-250 rounded-xl px-3 py-2 bg-white dark:bg-zinc-950 focus:outline-amber-500"
              />
              <button
                type="button"
                onClick={handleGenerateCaption}
                disabled={isGenerating || !aiTopic.trim()}
                className="bg-amber-500 text-white text-xs font-black px-4 py-2 rounded-xl"
              >
                {isGenerating ? 'লোডিং...' : 'তৈরি'}
              </button>
            </div>
          </div>
        )}

        {/* Selected Media Preview container */}
        {mediaUrl ? (
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-neutral-950 shadow-sm border border-neutral-200">
            {mediaType === 'image' ? (
              <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <video src={mediaUrl} controls className="w-full h-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => {
                setMediaUrl('');
                setMediaType('none');
              }}
              className="absolute top-2.5 right-2.5 bg-black/60 text-white p-2 rounded-full hover:bg-black transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/5 dark:bg-zinc-950/20 p-8 text-center flex flex-col items-center justify-center space-y-3.5 select-none">
            <div className="bg-amber-500/10 text-amber-500 p-4 rounded-full">
              <ImageIcon className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="text-sm font-bold text-slate-800 dark:text-neutral-200 block">আপনার ডিভাইস থেকে ফটো/ভিডিও আপলোড করুন</span>
              <p className="text-[10px] text-zinc-400">অথবা নিচের গ্যালারি থেকে চমৎকার একটি রেডি স্যাম্পল সিলেক্ট করুন</p>
            </div>
            
            <label className="mt-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black text-xs py-2 px-5 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition flex items-center gap-1.5 shadow-sm">
              <span>ফাইল নির্বাচন করুন 📤</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Preset Gallery Selector Options */}
        <div className="space-y-2.5">
          <label className="text-[10.5px] font-black text-zinc-400 uppercase tracking-widest pl-1">ফটো গ্যালারি স্যাম্পলস</label>
          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {PRESET_IMAGES.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectPresetMedia('image', img.url)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  mediaUrl === img.url
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600'
                    : 'bg-white border-neutral-200 text-slate-650'
                }`}
              >
                {img.name}
              </button>
            ))}
          </div>

          <label className="text-[10.5px] font-black text-zinc-400 uppercase tracking-widest pl-1 block">ভিডিও স্যাম্পলস</label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {PRESET_VIDEOS.map((vid, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectPresetMedia('video', vid.url)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  mediaUrl === vid.url
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600'
                    : 'bg-white border-neutral-200 text-slate-650'
                }`}
              >
                {vid.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown for Category selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-zinc-450 uppercase block pl-1">ফটোগ্রাফি ক্যাটাগরি</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-white border border-neutral-250 rounded-xl px-4 py-3 text-xs font-bold shadow-sm"
          >
            <option value="বিনোদন">বিনোদন (Entertainment)</option>
            <option value="গ্ল্যামার">গ্ল্যামার (Glamour)</option>
            <option value="আর্ট">আর্ট (Arts)</option>
            <option value="লাইফস্টাইল">লাইফস্টাইল (Lifestyle)</option>
          </select>
        </div>

        {/* Creator Premium Lock configuration options */}
        <div className="bg-white rounded-[24px] p-5 border border-neutral-150 space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPremiumCheck"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              className="w-5 h-5 accent-amber-500 cursor-pointer"
            />
            <label htmlFor="isPremiumCheck" className="text-xs font-black text-slate-800 cursor-pointer flex-1 select-none flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>এই কন্টেন্টটি প্রিমিয়াম লক করুন (Premium Locked Cover)</span>
            </label>
          </div>

          {isPremium && (
            <div className="space-y-1.5 border-t border-dashed border-neutral-100 pt-3 animate-slideDown">
              <label className="text-[10px] font-black text-zinc-400 uppercase block pl-0.5">ছবিটি আনলক করতে প্রয়োজনীয় ভার্চুয়াল স্টার (Star Price)</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={starPrice}
                    onChange={(e) => setStarPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-neutral-250 rounded-xl pl-10 pr-4 py-3 text-xs font-mono font-bold text-slate-800"
                  />
                  <Coins className="w-4 h-4 text-amber-500 absolute left-3.5 top-3.5" />
                </div>
                <span className="text-xs font-bold text-zinc-400 pr-1">Stars</span>
              </div>
              <p className="text-[9.5px] text-amber-600 font-semibold block">
                ১টি স্টার = ৳০.৮০ বিডিটি ক্রিয়েটর নিট ক্যাশ-আউট সুবিধা। এই ছবি প্রতিবার আনলক হলে আপনি পাবেন ৳<b>{Math.round((parseInt(starPrice) || 0) * 0.8)} BDT</b>!
              </p>
            </div>
          )}
        </div>

      </div>
    </form>
  );
}
