/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, Bell, Heart, MessageCircle, Share2, MoreHorizontal, CheckCircle2, ShieldAlert, Sparkles, Send, Lock, Gift, Coins, AlertCircle } from 'lucide-react';
import { Post, Comment, Story, UserProfile, NotificationItem } from '../types';
import { dbService } from '../services/db';

interface FeedViewProps {
  onNavigate: (screen: string) => void;
  onUserSelect?: (userId: string) => void;
  onMessageUser?: (userId: string) => void;
}

export default function FeedView({ onNavigate, onUserSelect, onMessageUser }: FeedViewProps) {
  const [activeCategory, setActiveCategory] = React.useState('সব');
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [stories, setStories] = React.useState<Story[]>([]);
  
  // Active Profiles
  const [myProfile, setMyProfile] = React.useState<UserProfile | null>(null);

  // Gifting Modal State
  const [giftingPost, setGiftingPost] = React.useState<Post | null>(null);
  const [giftAmount, setGiftAmount] = React.useState<number>(10);
  const [giftingError, setGiftingError] = React.useState('');
  const [giftingSuccess, setGiftingSuccess] = React.useState(false);

  // Custom states for story interaction
  const [activeStory, setActiveStory] = React.useState<Story | null>(null);
  const [storyTimer, setStoryTimer] = React.useState(0);
  const storyInputRef = React.useRef<HTMLInputElement | null>(null);

  // Custom states for post options/reports
  const [selectedPostOptions, setSelectedPostOptions] = React.useState<Post | null>(null);
  const [showReportForm, setShowReportForm] = React.useState(false);
  const [reportReason, setReportReason] = React.useState('');

  // Notifications states
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = React.useState(false);

  // Comments panel sheet inside bottom drawer
  const [activeCommentsPost, setActiveCommentsPost] = React.useState<Post | null>(null);
  const [commentsList, setCommentsList] = React.useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = React.useState('');

  // Search filter
  const [searchPostQuery, setSearchPostQuery] = React.useState('');
  const [showSearchBox, setShowSearchBox] = React.useState(false);

  // Pull-to-refresh
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const categories = ['সব', 'গ্ল্যামার', 'বিনোদন', 'আর্ট', 'লাইফস্টাইল'];

  const loadFeedData = () => {
    setMyProfile(dbService.getCurrentUser());
    setPosts(dbService.getPosts(activeCategory));
    setStories(dbService.getStories());
    setNotifications(dbService.getNotifications());
  };

  React.useEffect(() => {
    loadFeedData();
    
    const handleReload = () => {
      loadFeedData();
      if (activeCommentsPost) {
        setCommentsList(dbService.getComments(activeCommentsPost.id));
      }
    };

    window.addEventListener('starconnect_db_update', handleReload);
    return () => {
      window.removeEventListener('starconnect_db_update', handleReload);
    };
  }, [activeCategory, activeCommentsPost]);

  // Derived active user's stories
  const activeUserStories = React.useMemo(() => {
    if (!activeStory) return [];
    return stories.filter(s => s.userId === activeStory.userId);
  }, [activeStory, stories]);

  // Unique list of first story per user for the horizontal top bar list
  const uniqueUserStoriesMap = React.useMemo(() => {
    const map = new Map<string, Story>();
    stories.forEach(s => {
      if (myProfile && s.userId === myProfile.id) return;
      if (!map.has(s.userId)) {
        map.set(s.userId, s);
      }
    });
    return Array.from(map.values());
  }, [stories, myProfile]);

  const myStories = React.useMemo(() => {
    if (!myProfile) return [];
    return stories.filter(s => s.userId === myProfile.id);
  }, [stories, myProfile]);

  // Story Auto-Advance Timer controller
  const handleNextStory = React.useCallback(() => {
    if (!activeStory || activeUserStories.length === 0) return;
    const currentIndex = activeUserStories.findIndex(s => s.id === activeStory.id);
    if (currentIndex !== -1 && currentIndex < activeUserStories.length - 1) {
      setActiveStory(activeUserStories[currentIndex + 1]);
      setStoryTimer(0);
    } else {
      setActiveStory(null);
    }
  }, [activeStory, activeUserStories]);

  const handlePrevStory = () => {
    if (!activeStory || activeUserStories.length === 0) return;
    const currentIndex = activeUserStories.findIndex(s => s.id === activeStory.id);
    if (currentIndex > 0) {
      setActiveStory(activeUserStories[currentIndex - 1]);
      setStoryTimer(0);
    }
  };

  React.useEffect(() => {
    let interval: any;
    if (activeStory) {
      interval = setInterval(() => {
        setStoryTimer(prev => {
          if (prev >= 100) {
            return 100;
          }
          return prev + 4; // timer ~5s
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [activeStory]);

  React.useEffect(() => {
    if (activeStory && storyTimer >= 100) {
      handleNextStory();
    }
  }, [storyTimer, activeStory, handleNextStory]);

  const viewStory = (story: Story) => {
    setActiveStory(story);
    setStoryTimer(0);
  };

  const triggerStoryUpload = () => {
    storyInputRef.current?.click();
  };

  const handleStoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('সতর্কতা: অনুগ্রহ করে ১৫ মেগাবাইটের কম সাইজের ছবি সিলেক্ট করুন।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize maximum dimension to 720px for fast loading and low storage footprint
        const maxDim = 720;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.55); // 55% quality compression
          dbService.addStory(compressedBase64);
          loadFeedData();
          alert('আপনার স্টোরিটি সফলভাবে যুক্ত করা হয়েছে! 📸');
        } else {
          dbService.addStory(event.target?.result as string);
          loadFeedData();
          alert('আপনার স্টোরিটি সফলভাবে যুক্ত করা হয়েছে! 📸');
        }
      };
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // clear input cache
  };

  const handleToggleLike = (postId: string) => {
    dbService.toggleLike(postId);
    loadFeedData();
  };

  const handleOpenComments = async (post: Post) => {
    setActiveCommentsPost(post);
    setCommentsList(dbService.getComments(post.id));
    
    try {
      const freshComments = await dbService.fetchCommentsFromFirestore(post.id);
      setCommentsList(freshComments);
    } catch (e) {
      console.warn("Error fetching fresh comments:", e);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeCommentsPost) return;

    dbService.addComment(activeCommentsPost.id, newCommentText);
    setCommentsList(dbService.getComments(activeCommentsPost.id));
    setNewCommentText('');
    loadFeedData();
  };

  const handleUnlockPost = (postId: string, price: number) => {
    if (!myProfile) return;
    if (myProfile.starBalance < price) {
      const confirmBuy = window.confirm(`হায়! আপনার ওয়ালেট ব্যালেন্স পর্যাপ্ত নয় (প্রয়োজন ${price} স্টার)।\n\nআপনি কি এখনই স্টার রিচার্জ করতে ওয়ালেটে যেতে চান? 📥`);
      if (confirmBuy) {
        onNavigate('BUY_STARS');
      }
      return;
    }

    const confirmUnlock = window.confirm(`আপনি কি নিশ্চিত যে ${price}টি স্টার প্রদান করে এই চমৎকার প্রিমিয়াম ছবিটি আনলক করবেন?`);
    if (confirmUnlock) {
      const res = dbService.unlockPremiumPost(postId);
      if (res.success) {
        alert('অভিনন্দন! প্রিমিয়াম ছবিটি সফলভাবে আনলক হয়েছে। 🎉');
        loadFeedData();
      } else {
        alert(res.error || 'আনলক প্রক্রিয়াকরনে বিভ্রাট ঘটেছে।');
      }
    }
  };

  const handleOpenGifting = (post: Post) => {
    setGiftingPost(post);
    setGiftAmount(10);
    setGiftingError('');
    setGiftingSuccess(false);
  };

  const handleSendGift = () => {
    if (!giftingPost || !myProfile) return;
    if (myProfile.id === giftingPost.authorId) {
      setGiftingError('নিজেকে স্টার উপহার পাঠাতে পারবেন না!');
      return;
    }
    if (myProfile.starBalance < giftAmount) {
      setGiftingError(`হায়রে! আপনার পর্যাপ্ত ব্যালেন্স নেই। এখনই ওয়ালেট রিচার্জ করুন!`);
      return;
    }

    const res = dbService.sendDirectStars(giftingPost.authorId, giftAmount);
    if (res.success) {
      setGiftingSuccess(true);
      setTimeout(() => {
        setGiftingPost(null);
        loadFeedData();
      }, 1800);
    } else {
      setGiftingError(res.error || 'স্টার পাঠাতে সমস্যা হয়েছে।');
    }
  };

  const handleReportPostSubmit = () => {
    if (!reportReason.trim() || !selectedPostOptions) return;

    dbService.reportContent(
      selectedPostOptions.authorId,
      selectedPostOptions.authorName,
      reportReason,
      selectedPostOptions.id,
      selectedPostOptions.content
    );

    const confirmBlock = window.confirm('রিপোর্ট পেন্ডিং তালিকায় দাখিল করা হয়েছে। অ্যাডমিন টিম এটি তদন্ত করবে।\n\nআপনি কি এই ক্রিয়েটরকে ব্লক করতে চান যাতে তার কোনো ছবি আপনার হোমে আর না দেখায়?');
    if (confirmBlock) {
      dbService.blockUser(selectedPostOptions.authorId);
      loadFeedData();
    }

    setReportReason('');
    setShowReportForm(false);
    setSelectedPostOptions(null);
  };

  const handleSharePostLink = (post: Post) => {
    alert("ছবি পোস্ট শেইয়ার লিংক ক্লিপবোর্ডে কপি সম্পন্ন হয়েছে! 🔗");
  };

  const handleRefreshFeed = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadFeedData();
      setIsRefreshing(false);
    }, 1000);
  };

  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const filteredPosts = posts.filter(post => {
    if (myProfile && myProfile.blockedUsers?.includes(post.authorId)) return false;
    if (searchPostQuery.trim()) {
      const q = searchPostQuery.toLowerCase();
      const titleMatches = post.title?.toLowerCase().includes(q);
      const contentMatches = post.content.toLowerCase().includes(q);
      const authorMatches = post.authorName.toLowerCase().includes(q);
      if (!titleMatches && !contentMatches && !authorMatches) return false;
    }
    return true;
  });

  if (!myProfile) return null;

  return (
    <div 
      className={`flex-1 flex flex-col ${activeStory || activeCommentsPost || giftingPost ? 'overflow-hidden' : 'overflow-y-auto'} bg-slate-50 dark:bg-zinc-950 pb-16 relative scrollbar-none`}
    >
      
      {/* ------------------------- */}
      {/* Dynamic Dept.file Header */}
      {/* ------------------------- */}
      <div className="flex justify-between items-center px-4 py-3 bg-white dark:bg-neutral-900 sticky top-0 z-30 border-b border-neutral-200/50 dark:border-neutral-800 shadow-sm shrink-0">
        <div onClick={() => onNavigate('FEED')} className="flex items-center gap-2 cursor-pointer select-none">
          <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/10">
            <span className="text-white font-black text-xl italic">D</span>
          </div>
          <div>
            <span className="text-base font-black text-slate-900 dark:text-neutral-50 tracking-tight font-sans block leading-none">Dept.file</span>
            <span className="text-[8px] bg-amber-500/10 text-amber-600 px-1 py-0.2 rounded font-black tracking-widest block w-max uppercase mt-0.5">CREATORS</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Top Wallet indicator pills status */}
          <button
            onClick={() => onNavigate('WALLET')}
            className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-amber-600 dark:text-amber-400 font-black text-[10.5px] font-mono cursor-pointer active:scale-95 transition"
          >
            <span>⭐</span>
            <span>{myProfile.starBalance}</span>
          </button>

          {/* Search trigger */}
          <button
            onClick={() => setShowSearchBox(!showSearchBox)}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notification dropdown alert */}
          <button
            onClick={() => {
              setShowNotificationsDropdown(!showNotificationsDropdown);
              dbService.markAllNotificationsRead();
              setNotifications(dbService.getNotifications());
            }}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-neutral-200 relative transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifs > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white font-black text-[8px] w-4 h-4 rounded-full border border-white flex items-center justify-center animate-pulse">
                {unreadNotifs}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Slide-Down Expandable Search input */}
      {showSearchBox && (
        <div className="bg-white dark:bg-neutral-900 px-4 py-2 sticky top-[53px] z-25 border-b border-neutral-100 shadow-sm flex gap-2">
          <input
            type="text"
            placeholder="ক্রিয়েটর বা ফটোর ডেসক্রিপশন লিখে সার্চ করুন..."
            value={searchPostQuery}
            onChange={(e) => setSearchPostQuery(e.target.value)}
            className="flex-1 bg-slate-50 border border-neutral-250 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
          />
          {searchPostQuery && (
            <button
              onClick={() => setSearchPostQuery('')}
              className="text-xs text-zinc-400 font-bold px-1"
            >
              মুছুন
            </button>
          )}
        </div>
      )}

      {/* Slide-Down Notifications Drawer Overlay */}
      {showNotificationsDropdown && (
        <div className="absolute top-[54px] inset-x-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 shadow-2xl max-h-80 overflow-y-auto p-3.5 rounded-b-3xl z-40 animate-fadeIn">
          <div className="flex justify-between items-center mb-3 pb-1 border-b border-neutral-100">
            <span className="text-xs font-black text-slate-800 dark:text-zinc-200">নোটিফিকেশন খাতা ({notifications.length})</span>
            <button
              onClick={() => setShowNotificationsDropdown(false)}
              className="text-[10px] font-black text-indigo-550"
            >
              drawer বন্ধ করুন
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-[10px] text-zinc-400 text-center py-6">কোনো নতুন সিস্টেম নোটিফিকেশন নেই।</p>
          ) : (
            <div className="space-y-2">
              {notifications.map(notif => (
                <div key={notif.id} className="flex gap-2.5 items-center bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-2xl text-left border border-neutral-100 dark:border-neutral-850">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-zinc-150">
                    <img src={notif.senderAvatarUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-[10.5px]">
                    <span className="font-extrabold text-slate-850 dark:text-zinc-100 block">{notif.senderName}</span>
                    <p className="text-zinc-650 dark:text-zinc-400 font-semibold mt-0.5">{notif.text}</p>
                    <span className="text-[8px] text-slate-400 font-mono block mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()} • {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------- */}
      {/* Stories Slide panel (Facebook Style) */}
      {/* ------------------------- */}
      <div className="bg-white dark:bg-neutral-900 py-3.5 px-4 border-b border-neutral-100 dark:border-neutral-800 flex gap-3 overflow-x-auto scrollbar-none z-10 select-none shrink-0">
        {/* Your Story trigger (Facebook Style dynamic check) */}
        {myStories.length > 0 ? (
          <div 
            className="relative w-24 h-36 rounded-2xl overflow-hidden shrink-0 cursor-pointer shadow-sm group hover:scale-[1.02] active:scale-98 transition-all duration-300 border border-amber-500 bg-slate-100"
            onClick={() => viewStory(myStories[0])}
          >
            {/* Background Story Thumbnail */}
            <img 
              src={myStories[0].mediaUrl} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
            {/* Gradient overlays to guarantee high contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75 z-0" />

            {/* Profile avatar overlay with a mini '+' badge */}
            <div 
              className="absolute top-2.5 left-2.5 z-10 w-7 h-7 rounded-full overflow-hidden border-2 border-white p-0.5 bg-amber-500 shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                triggerStoryUpload();
              }}
              title="নতুন স্টোরি দিন"
            >
              <img src={myProfile.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
            </div>

            {/* Plus icon on top-right to directly add story */}
            <div 
              className="absolute top-2.5 right-2.5 rounded-full w-6 h-6 bg-amber-500 hover:bg-amber-600 border border-white flex items-center justify-center text-white font-extrabold text-xs shadow-md z-10 hover:scale-110 active:scale-95 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                triggerStoryUpload();
              }}
              title="নতুন স্টোরি দিন"
            >
              +
            </div>

            {/* Bottom aligned label */}
            <span className="absolute bottom-2 left-2 right-2 z-10 text-[9.5px] font-black text-white truncate drop-shadow-sm leading-tight text-left">
              আপনার স্টোরি
            </span>

            <input
              type="file"
              ref={storyInputRef}
              onChange={handleStoryFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        ) : (
          <div 
            className="relative w-24 h-36 rounded-2xl overflow-hidden shrink-0 cursor-pointer bg-slate-50 dark:bg-zinc-800/50 border border-neutral-200/50 dark:border-neutral-850 flex flex-col shadow-sm group hover:border-amber-500 transition-all duration-300" 
            onClick={triggerStoryUpload}
          >
            {/* Cover image area */}
            <div className="relative w-full h-[68%] overflow-hidden bg-slate-100 dark:bg-zinc-800">
              <img 
                src={myProfile.avatarUrl} 
                alt="" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
            </div>
            {/* Label area */}
            <div className="relative w-full h-[32%] bg-white dark:bg-neutral-900 flex flex-col items-center justify-center">
              {/* Overlapping circular plus button */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white rounded-full w-7 h-7 border-2 border-white dark:border-neutral-900 flex items-center justify-center shadow-md font-bold text-base group-hover:scale-110 active:scale-95 transition-all">
                +
              </div>
              <span className="text-[10px] font-black text-slate-700 dark:text-neutral-300 mt-2">স্টোরি দিন</span>
            </div>

            <input
              type="file"
              ref={storyInputRef}
              onChange={handleStoryFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        )}

        {/* Other Users Stories */}
        {uniqueUserStoriesMap.map((story) => (
          <div 
            key={story.id} 
            className="relative w-24 h-36 rounded-2xl overflow-hidden shrink-0 cursor-pointer shadow-sm group hover:scale-[1.02] active:scale-98 transition-all duration-300 border border-neutral-100 dark:border-neutral-800" 
            onClick={() => viewStory(story)}
          >
            {/* Background Story Thumbnail */}
            <img 
              src={story.mediaUrl} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
            {/* Gradient overlays to guarantee high contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75 z-0" />

            {/* User circular avatar overlaid on top-left of the story thumbnail */}
            <div className="absolute top-2.5 left-2.5 z-10 w-7 h-7 rounded-full overflow-hidden border-2 border-amber-500 p-0.5 bg-white shadow-md">
              <img src={story.userAvatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
            </div>

            {/* Bottom aligned user name */}
            <span className="absolute bottom-2 left-2 right-2 z-10 text-[9.5px] font-black text-white truncate drop-shadow-sm leading-tight text-left">
              {story.userName}
            </span>
          </div>
        ))}
      </div>

      {/* ------------------------- */}
      {/* Category Selection Filter */}
      {/* ------------------------- */}
      <div className="px-4 py-2.5 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex gap-2 overflow-x-auto scrollbar-none z-10 shrink-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.2 rounded-full text-xs font-black transition cursor-pointer select-none shrink-0 ${
              activeCategory === cat
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/10'
                : 'bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-zinc-700'
            }`}
          >
            {cat}
          </button>
        ))}
        
        <button
          onClick={handleRefreshFeed}
          className={`px-3 py-1 text-xs text-indigo-650 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 rounded-full font-bold ml-auto shrink-0 select-none ${isRefreshing ? 'animate-pulse' : ''}`}
        >
          {isRefreshing ? 'লোডিং...' : 'রিফ্রেশ ফিড ⟲'}
        </button>
      </div>

      {/* ------------------------- */}
      {/* Social Timeline Posts     */}
      {/* ------------------------- */}
      <div className="p-4 space-y-4 flex-1">
        
        {filteredPosts.length === 0 ? (
          <div className="py-20 text-center text-zinc-400 bg-white p-6 rounded-3xl border border-neutral-100">
            <p className="text-xs font-bold text-slate-700">কোনো ক্রিয়েটর পোস্ট খুঁজে পাওয়া যায়নি।</p>
            <p className="text-[10px] mt-1 space-y-1">সার্চ ফিল্টার রিসেট করুন বা নিজে চমৎকার একটি প্রিমিয়াম ফটো আপলোড করুন!</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isLiked = post.likedBy?.includes(myProfile.id);
            const isAuthor = post.authorId === myProfile.id;
            const isUnlocked = post.unlockedByUserIds?.includes(myProfile.id) || isAuthor || !post.isPremiumPost;

            return (
              <div
                key={post.id}
                className="bg-white dark:bg-neutral-900 rounded-[28px] p-5 shadow-sm border border-neutral-150/75 dark:border-neutral-800 space-y-3.5 relative overflow-hidden"
              >
                
                {/* Post Header Card */}
                <div className="flex justify-between items-center">
                  <div
                    onClick={() => onUserSelect && onUserSelect(post.authorId)}
                    className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-neutral-150 bg-slate-50">
                      <img src={post.authorAvatarUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 dark:text-neutral-100 flex items-center gap-0.5">
                        {post.authorName}
                        {post.authorIsVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500 shrink-0" />
                        )}
                      </span>
                      <span className="text-[9.5px] text-zinc-400 font-bold font-mono block">
                        {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {post.category || 'সাধারণ'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Premium Post badge */}
                    {post.isPremiumPost && (
                      <span className="bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full select-none flex items-center gap-0.5 uppercase tracking-wider shadow-sm">
                        <Lock className="w-2.5 h-2.5" />
                        <span>PREMIUM</span>
                      </span>
                    )}

                    <button
                      onClick={() => setSelectedPostOptions(post)}
                      className="p-1 px-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-zinc-800"
                    >
                      <MoreHorizontal className="w-5 h-5 text-zinc-400" />
                    </button>
                  </div>
                </div>

                {/* Content description title text */}
                <div className="space-y-1 pr-1.5">
                  {post.title && (
                    <h3 className="text-xs font-extrabold text-slate-850 dark:text-white">{post.title}</h3>
                  )}
                  <p className="text-xs text-slate-705 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed font-sans font-medium">
                    {post.content}
                  </p>
                </div>

                {/* PREMIUM LOCK/UNLOCK INTERFACES */}
                {post.mediaUrl && (
                  <div className={`relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center ${
                    isUnlocked ? 'w-full max-h-[600px]' : 'aspect-video w-full'
                  }`}>
                    {isUnlocked ? (
                      /* Rendering standard unlocked media content */
                      post.mediaType === 'image' ? (
                        <img
                          src={post.mediaUrl}
                          alt="Unlocked attachment"
                          className="w-full h-auto max-h-[600px] object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full max-h-[600px] bg-black flex items-center justify-center">
                          <video src={post.mediaUrl} controls playsInline className="w-full h-auto max-h-[600px] object-contain" />
                        </div>
                      )
                    ) : (
                      /* Display LOCKED dynamic cover layout */
                      <div className="absolute inset-0 bg-zinc-950/90 flex flex-col justify-center items-center text-center p-5 space-y-4 w-full h-full">
                        {/* Blurred sample image backdrop */}
                        <div className="absolute inset-0 pointer-events-none opacity-20 filter blur-lg scale-105">
                          <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
                        </div>

                        <div className="relative z-10 w-12 h-12 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center text-amber-500 animate-pulse select-none">
                          <Lock className="w-5 h-5" />
                        </div>

                        <div className="relative z-10 space-y-1 px-4 leading-relaxed">
                          <h4 className="text-xs font-extrabold text-amber-400">এক্সক্লুসিভ ক্রিয়েটর পিকচার লক করা</h4>
                          <p className="text-[10px] text-zinc-350">
                            ক্রিয়েটরকে <b>{post.starPrice}টি স্টার</b> পাঠিয়ে এই চমৎকার ছবির মূল হাই-ডেফিনেশন হাই রেজোলিউশন কপি এখনই আনলক করুন! 🌟✨
                          </p>
                        </div>

                        <button
                          onClick={() => handleUnlockPost(post.id, post.starPrice)}
                          className="relative z-10 bg-amber-500 hover:bg-amber-600 active:scale-95 transition text-white font-black py-2 px-6 rounded-full text-[10.5px] flex items-center gap-1 shadow-md shadow-amber-500/10 cursor-pointer"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span> {post.starPrice} স্টার দিয়ে আনলক করুন</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Counters and actions bar */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans font-bold border-b border-slate-50 dark:border-zinc-800 pb-2.5">
                  <span className="select-none">{post.likesCount} লাইকস</span>
                  <div className="flex gap-2.5">
                    <span>{post.commentsCount} মন্তব্য</span>
                    <span>{post.sharesCount || 0} শেয়ার</span>
                  </div>
                </div>

                {/* Interaction Action Row buttons */}
                <div className="flex items-center justify-between pt-1 font-bold gap-2 select-none">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className={`flex-1 py-2 text-[11px] rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98 ${
                      isLiked
                        ? 'bg-rose-50 border-rose-100 text-rose-500'
                        : 'bg-slate-50 border-neutral-100 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                    <span>লাইক</span>
                  </button>

                  <button
                    onClick={() => handleOpenComments(post)}
                    className="flex-1 py-2 text-[11px] rounded-xl border border-neutral-100 bg-slate-50 text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>মন্তব্য</span>
                  </button>

                  {/* Send Virtual Stars direct tip feature button */}
                  {!isAuthor && (
                    <button
                      onClick={() => handleOpenGifting(post)}
                      className="py-2 px-4 text-[11px] bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center justify-center gap-1 cursor-pointer active:scale-98 shadow-sm font-black shrink-0"
                    >
                      <Gift className="w-4 h-4" />
                      <span>স্টার গিফট</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleSharePostLink(post)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-neutral-100 text-slate-500 rounded-xl flex items-center justify-center shrink-0 cursor-pointer active:scale-98"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ------------------------------------- */}
      {/* Modal: Story Viewing Player overlay */}
      {/* ------------------------------------- */}
      {activeStory && (
        <div className="absolute inset-0 bg-neutral-950 z-55 flex flex-col justify-between p-4 rounded-[inherit] overflow-hidden select-none">
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 filter blur-xl scale-105">
            <img src={activeStory.mediaUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60"></div>
          </div>

          <div className="relative z-10 flex flex-col h-full justify-between">
            {/* Story Timer progress indicator */}
            <div className="w-full h-1 bg-neutral-800/80 rounded-full overflow-hidden flex gap-1">
              {activeUserStories.map((s, idx) => {
                const currentStoryIndex = activeUserStories.findIndex(st => st.id === activeStory.id);
                let w = 0;
                if (idx < currentStoryIndex) w = 100;
                else if (idx === currentStoryIndex) w = storyTimer;
                return (
                  <div key={s.id} className="flex-1 h-full bg-neutral-850 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all duration-150 ease-linear" style={{ width: `${w}%` }}></div>
                  </div>
                );
              })}
            </div>

            {/* Header profile details */}
            <div className="flex justify-between items-center text-white mt-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-500 bg-slate-900">
                  <img src={activeStory.userAvatarUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-xs font-black block leading-none">{activeStory.userName}</span>
                  <span className="text-[8px] text-zinc-400 font-mono mt-0.5">
                    {new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveStory(null)}
                className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-white font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Story Image container */}
            <div className="flex-1 w-full flex items-center justify-center my-4 relative rounded-2xl overflow-hidden bg-neutral-900/50 p-1">
              {/* Navigate Tap pads */}
              <div className="absolute left-0 top-0 bottom-0 w-1/4 z-20 cursor-w-resize" onClick={handlePrevStory}></div>
              <div className="absolute right-0 top-0 bottom-0 w-1/4 z-20 cursor-e-resize" onClick={handleNextStory}></div>

              <img
                src={activeStory.mediaUrl}
                alt=""
                className="max-w-full max-h-[64vh] object-contain rounded-xl relative z-10"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Bottom contact reply button */}
            <div className="pb-2 text-center">
              {activeStory.userId !== myProfile.id ? (
                <button
                  onClick={() => {
                    setActiveStory(null);
                    if (onMessageUser) onMessageUser(activeStory.userId);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-xs font-black text-white py-2.5 px-6 rounded-full shadow-lg"
                >
                  মেসেজ পাঠান 💬
                </button>
              ) : (
                <span className="text-[9px] text-zinc-500 font-black tracking-wider block bg-white/5 py-1 px-3 rounded-full w-max mx-auto uppercase">
                  আপনার নিজের স্টোরি
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------- */}
      {/* Slide Sheet: Dedicated comments drawer    */}
      {/* ----------------------------------------- */}
      {activeCommentsPost && (
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end"
          onClick={() => setActiveCommentsPost(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full h-[85%] bg-white dark:bg-neutral-900 rounded-t-[32px] border-t border-neutral-100 dark:border-neutral-800 shadow-2xl flex flex-col animate-slideUp overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-850 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 dark:text-neutral-150 text-xs">মন্তব্য ক্যাশবুক ({commentsList.length})</h3>
              <button
                onClick={() => setActiveCommentsPost(null)}
                className="text-xs font-bold text-slate-400 p-2"
              >
                বন্ধ করুন ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-zinc-950">
              {commentsList.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-xs">কোনো মন্তব্য পাওয়া যায়নি। প্রথম মিষ্টি মন্তব্যটি করুন!</div>
              ) : (
                commentsList.map(cmt => (
                  <div key={cmt.id} className="flex gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-200 shrink-0">
                      <img src={cmt.authorAvatarUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 bg-white dark:bg-neutral-850 rounded-2xl p-3 border border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-neutral-200">{cmt.authorName}</span>
                        <span className="text-[8.5px] text-zinc-400 font-mono">
                          {new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-650 dark:text-neutral-300 leading-relaxed font-sans font-medium">{cmt.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="p-3 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2">
              <input
                type="text"
                required
                placeholder="একটি শালীন মন্তব্য লিখুন..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-neutral-800 border border-neutral-250 dark:border-neutral-700 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-zinc-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="bg-amber-500 text-white p-2.5 rounded-xl flex items-center justify-center hover:bg-amber-600 shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------- */}
      {/* 3. Action Sheet: Gifting direct Stars */}
      {/* ------------------------------------- */}
      {giftingPost && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-55 flex items-end justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-[32px] w-full p-6 space-y-4 animate-slideUp shadow-2xl border-t border-neutral-200">
            
            <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-extrabold text-slate-800">ফটোগ্রাফারকে স্টার গিফট টিপ পাঠান</h3>
              </div>
              <button onClick={() => setGiftingPost(null)} className="text-slate-400 font-bold p-1 text-sm">✕</button>
            </div>

            {giftingSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto border border-emerald-150 animate-bounce">
                  ✨
                </div>
                <p className="text-xs font-bold text-emerald-600">স্টার সফলভাবে পাঠানো হয়েছে! 😍🌟</p>
                <p className="text-[10px] text-zinc-400">আপনার কৃতজ্ঞতা ক্রিয়েটরের অনুভুতিকে অনুপ্রাণিত করবে!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-neutral-50 rounded-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-white border">
                    <img src={giftingPost.authorAvatarUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">উপহার প্রাপক: {giftingPost.authorName}</span>
                    <span className="text-[10px] text-zinc-400 block font-mono">ছবি খাতা: {giftingPost.title}</span>
                  </div>
                </div>

                {giftingError && (
                  <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-rose-600 text-xs flex gap-1 items-center">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span>{giftingError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 block uppercase pl-1">স্টার উপহারের পরিমাণ সিলেক্ট করুন</label>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 50, 100, 200].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setGiftAmount(amt)}
                        className={`py-3.5 rounded-xl text-center text-xs font-black transition cursor-pointer font-mono border ${
                          giftAmount === amt
                            ? 'border-amber-500 bg-amber-50/20 text-amber-600 font-extrabold'
                            : 'border-neutral-200 bg-white text-zinc-400'
                        }`}
                      >
                        ⭐ {amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 rounded-xl flex justify-between select-none items-center text-xs border border-amber-500/25">
                  <span className="text-amber-700 font-bold">আপনার ওয়ালেট ব্যালেন্স:</span>
                  <span className="font-extrabold text-amber-800 font-mono">⭐ {myProfile.starBalance} Stars</span>
                </div>

                <button
                  onClick={handleSendGift}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-lg shadow-amber-500/10 active:scale-98 transition"
                >
                  <Gift className="w-4 h-4" />
                  <span>{giftAmount}টি স্টার উপহার দিন (Send Stars)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------- */}
      {/* Report or Blocking Actions Sheet Menu */}
      {/* ------------------------------------- */}
      {selectedPostOptions && (
        <div className="absolute inset-x-0 bottom-0 bg-white dark:bg-neutral-900 rounded-t-3xl z-55 border-t border-neutral-205 shadow-2xl p-4 space-y-3 animate-slideUp">
          <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
            <span className="text-xs font-black text-neutral-400 uppercase tracking-widest block font-display">ফটো পোস্ট অপশন</span>
            <button onClick={() => { setSelectedPostOptions(null); setShowReportForm(false); }} className="text-neutral-400 font-bold text-xs p-2">✕ close</button>
          </div>

          {!showReportForm ? (
            <div className="space-y-2 text-xs">
              <button
                onClick={() => setShowReportForm(true)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 dark:hover:bg-neutral-800 rounded-xl text-rose-600 font-bold cursor-pointer"
              >
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <span>এই ছবিতে অনুপযুক্ত কন্টেন্ট রয়েছে (Report Post)</span>
              </button>

              <button
                onClick={() => {
                  dbService.blockUser(selectedPostOptions.authorId);
                  alert(`ক্রিয়েটর "${selectedPostOptions.authorName}" কে সফলভাবে ব্লক করা হয়েছে। তার কোনো পোস্ট আর ফিডে দেখানো হবে না।`);
                  setSelectedPostOptions(null);
                  loadFeedData();
                }}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 dark:hover:bg-neutral-800 rounded-xl text-neutral-700 font-bold cursor-pointer"
              >
                <ShieldAlert className="w-5 h-5 text-neutral-400" />
                <span>ক্রিয়েটরকে সরাসরি ব্লক করুন (Block Creator)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <span className="text-xs font-bold text-zinc-700 block">অভিযোগপত্রের কারণ লিখুন:</span>
              <input
                type="text"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="যেমন: অবান্তর পোস্ট, অশ্লীল মিডিয়া, স্প্যাম..."
                className="w-full border border-neutral-250 p-3.5 rounded-xl text-xs focus:outline-indigo-500"
              />
              <button
                onClick={handleReportPostSubmit}
                disabled={!reportReason.trim()}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3 rounded-xl text-center active:scale-95 transition cursor-pointer"
              >
                রিপোর্ট খাতা সাবমিট করুন
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
