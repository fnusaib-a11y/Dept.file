/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Search, CheckCircle, UserPlus, UserMinus, ShieldAlert, UserCheck, Users, X, MessageSquare, HandsHelping } from 'lucide-react';
import { dbService } from '../services/db';
import { UserProfile, FriendRequest } from '../types';

interface FriendFinderViewProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onChatWithUser?: (userId: string) => void;
}

export default function FriendFinderView({ onBack, onNavigate, onChatWithUser }: FriendFinderViewProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = React.useState<FriendRequest[]>([]);

  const loadData = () => {
    setUsers(dbService.getUsers());
    setFriendRequests(dbService.getFriendRequests());
  };

  React.useEffect(() => {
    loadData();
    // Watch for live starconnect db updates (e.g. from firestore snapshots)
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('starconnect_db_update', handleUpdate);
    return () => {
      window.removeEventListener('starconnect_db_update', handleUpdate);
    };
  }, []);

  const handleToggleFollow = (userId: string) => {
    dbService.toggleFollow(userId);
    loadData();
  };

  const handleBlockUser = (user: UserProfile) => {
    const confirm = window.confirm(`আপনি কি "${user.name}" কে ব্লক করতে চান? সে আর আপনার সাথে মেসেজে কথা বলতে বা আপনার পোস্ট দেখতে পারবে না।`);
    if (confirm) {
      dbService.blockUser(user.id);
      loadData();
      alert('সফলভাবে ব্লক করা হয়েছে। ✅');
    }
  };

  // Friend Request handlers
  const handleSendRequest = (userId: string) => {
    dbService.sendFriendRequest(userId);
    loadData();
    // Notification will show immediately as user requested instant feedback
  };

  const handleAcceptRequest = (requestId: string) => {
    dbService.acceptFriendRequest(requestId);
    loadData();
    alert('অভিনন্দন! ফ্রেন্ড রিকোয়েস্ট সফলভাবে গৃহীত হয়েছে। আপনারা এখন পরস্পর বন্ধু! 🤝✨');
  };

  const handleCancelRequest = (requestId: string) => {
    const confirm = window.confirm('আপনি কি এই রিকোয়েস্টটি প্রত্যাহার করতে চান?');
    if (confirm) {
      dbService.cancelFriendRequest(requestId);
      loadData();
    }
  };

  const handleUnfriend = (user: UserProfile) => {
    const confirm = window.confirm(`আপনি কি "${user.name}" কে আনফ্রেন্ড করতে চান?`);
    if (confirm) {
      dbService.unfriend(user.id);
      loadData();
      alert('আনফ্রেন্ড করা হয়েছে। 🤝');
    }
  };

  const me = dbService.getCurrentUser();

  // Filters out me + any already blocked users from general display
  const blockedList = me.blockedUsers || [];
  const filteredUsers = users.filter(u => 
    u.id !== me.id && 
    !blockedList.includes(u.id) &&
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Incoming pending requests
  const incomingRequests = friendRequests.filter(fr => fr.receiverId === me.id && fr.status === 'pending');

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-neutral-950 overflow-y-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center px-4 py-3 border-b border-neutral-100 dark:border-neutral-900 bg-white dark:bg-neutral-950 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-950 transition mr-2"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6 text-neutral-800 dark:text-neutral-200" />
        </button>
        <h1 className="text-base font-extrabold text-slate-800 dark:text-white tracking-tight">বন্ধু খুঁজুন & ফ্রেন্ড রিকোয়েস্ট</h1>
      </div>

      {/* Search Bar Input */}
      <div className="p-4 bg-zinc-50/50 dark:bg-neutral-900/10 border-b border-neutral-100 dark:border-neutral-900/50">
        <div className="relative flex items-center bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 px-4 py-3 rounded-2xl shadow-sm">
          <Search className="w-5 h-5 text-neutral-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="নাম বা ইউজারনেম দিয়ে বন্ধুদের সার্চ করুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-neutral-800 dark:text-white placeholder-neutral-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Incoming Requests Section */}
      {incomingRequests.length > 0 && (
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-900 bg-indigo-50/30 dark:bg-indigo-950/10">
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-2.5">
            আগত ফ্রেন্ড রিকোয়েস্ট ({incomingRequests.length}) 👋
          </span>
          <div className="space-y-2">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-neutral-900 border border-indigo-100 dark:border-indigo-900/55 p-3 rounded-2xl flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-150 shrink-0 border border-neutral-200 dark:border-neutral-800">
                    <img src={req.senderAvatarUrl} alt={req.senderName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-205 block leading-tight">
                      {req.senderName}
                    </span>
                    <span className="text-[9px] text-neutral-400 block mt-0.5">আপনাকে বন্ধুত্বের অনুরোধ পাঠিয়েছে</span>
                  </div>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => handleAcceptRequest(req.id)}
                    className="bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl transition duration-150 active:scale-95 cursor-pointer"
                  >
                    গ্রহণ করুন
                  </button>
                  <button
                    onClick={() => handleCancelRequest(req.id)}
                    className="bg-neutral-100 hover:bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition duration-150 cursor-pointer"
                  >
                    খারিজ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation & Contacts Grid */}
      <div className="p-4 space-y-3 flex-1">
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block pb-1">সুপারিশকৃত পরিচিতি</span>
        
        {filteredUsers.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-12">কোনো ব্যবহারকারী পাওয়া যায়নি।</p>
        ) : (
          filteredUsers.map((user) => {
            const isFollowing = dbService.isFollowing(user.id);
            // Find request relation
            const userRequest = friendRequests.find(fr => 
              (fr.senderId === me.id && fr.receiverId === user.id) ||
              (fr.senderId === user.id && fr.receiverId === me.id)
            );

            return (
              <div
                key={user.id}
                className="bg-[#fcfdfd] dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 p-3.5 rounded-2xl flex items-center justify-between shadow-sm group hover:scale-[1.01] transition duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200/50 dark:border-neutral-800 shrink-0">
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 leading-sharp">
                      {user.name}
                      {user.isVerified && (
                        <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500 shrink-0" />
                      )}
                    </span>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 line-clamp-1 mt-0.5">{user.bio}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded-md font-mono">
                        {user.followersCount} ফলোয়ার
                      </span>
                      {userRequest?.status === 'accepted' && (
                        <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <Users className="w-2.5 h-2.5" />
                          বন্ধুরা
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Friend request and social actions bundle */}
                <div className="flex flex-col gap-1.5 shrink-0 select-none items-end min-w-[124px]">
                  
                  {/* Dedicated Friend Request Option */}
                  {!userRequest ? (
                    <button
                      onClick={() => handleSendRequest(user.id)}
                      className="w-full text-[10px] py-1.5 px-3 font-extrabold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 duration-200 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>রিকোয়েস্ট পাঠান</span>
                    </button>
                  ) : userRequest.status === 'pending' ? (
                    userRequest.senderId === me.id ? (
                      <button
                        onClick={() => handleCancelRequest(userRequest.id)}
                        className="w-full text-[10px] py-1.5 px-3 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 duration-200 bg-neutral-100 text-neutral-500 dark:bg-neutral-850 dark:text-neutral-400 hover:bg-red-50 hover:text-red-650 dark:hover:bg-red-955/20 border border-neutral-200/50 dark:border-neutral-800"
                        title="ক্লিক করে রিকোয়েস্ট বাতিল করুন"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>পাঠানো হয়েছে</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAcceptRequest(userRequest.id)}
                        className="w-full text-[10px] py-1.5 px-3 font-extrabold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 duration-200 bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>গ্রহণ করুন</span>
                      </button>
                    )
                  ) : (
                    // status === 'accepted'
                    <button
                      onClick={() => handleUnfriend(user)}
                      className="w-full text-[10px] py-1.5 px-3 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 duration-300 bg-indigo-50 text-indigo-705 dark:bg-indigo-950/20 dark:text-indigo-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/40"
                      title="ক্লিক করে আনফ্রেন্ড করুন"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                      <span>আনফ্রেন্ড করুন</span>
                    </button>
                  )}

                  {/* Secondary Social buttons: Follow and Message */}
                  <div className="flex w-full gap-1 mt-0.5 justify-end">
                    <button
                      onClick={() => handleToggleFollow(user.id)}
                      className={`text-[9px] font-bold px-2 py-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                        isFollowing
                          ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                          : 'bg-amber-100/80 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}
                      title={isFollowing ? 'আনফলো করুন' : 'ফলো করুন'}
                    >
                      {isFollowing ? 'ফলোইং' : 'ফলো'}
                    </button>

                    <button
                      onClick={() => onChatWithUser && onChatWithUser(user.id)}
                      className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-indigo-50 font-bold text-[9px] px-2 py-1.5 rounded-lg flex items-center justify-center gap-1"
                    >
                      মেসেজ
                    </button>

                    <button
                      onClick={() => handleBlockUser(user)}
                      className="bg-red-50 hover:bg-red-100/50 dark:bg-red-950/10 text-red-500 p-1.5 rounded-lg flex items-center justify-center border border-red-100/50 dark:border-red-950/20"
                      aria-label="Block user"
                      title="ব্লক করুন"
                    >
                      <ShieldAlert className="w-3 h-3" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
