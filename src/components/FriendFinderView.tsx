/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Search, CheckCircle, UserPlus, UserMinus, ShieldAlert } from 'lucide-react';
import { dbService } from '../services/db';
import { UserProfile } from '../types';

interface FriendFinderViewProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onChatWithUser?: (userId: string) => void;
}

export default function FriendFinderView({ onBack, onNavigate, onChatWithUser }: FriendFinderViewProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [users, setUsers] = React.useState<UserProfile[]>([]);

  const loadData = () => {
    setUsers(dbService.getUsers());
  };

  React.useEffect(() => {
    loadData();
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

  const me = dbService.getCurrentUser();

  // Filters out me + any already blocked users from general display
  const blockedList = me.blockedUsers || [];
  const filteredUsers = users.filter(u => 
    u.id !== me.id && 
    !blockedList.includes(u.id) &&
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <h1 className="text-base font-extrabold text-slate-800 dark:text-white tracking-tight">বন্ধু খুঁজুন</h1>
      </div>

      {/* Search Bar Input */}
      <div className="p-4">
        <div className="relative flex items-center bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/40 dark:border-neutral-800/80 px-4 py-3 rounded-2xl shadow-sm">
          <Search className="w-5 h-5 text-neutral-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="নাম দিয়ে বন্ধুদের সার্চ করুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-neutral-800 dark:text-white placeholder-neutral-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="px-4 space-y-3 flex-1">
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block pb-1">সুপারিশকৃত পরিচিতি</span>
        
        {filteredUsers.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-12">কোনো ব্যবহারকারী পাওয়া যায়নি।</p>
        ) : (
          filteredUsers.map((user) => {
            const isFollowing = dbService.isFollowing(user.id);
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
                    <span className="text-[9px] text-neutral-400 font-mono block mt-1">{user.followersCount} ফলোয়ার</span>
                  </div>
                </div>

                {/* Vertical actions bundle */}
                <div className="flex flex-col gap-1.5 shrink-0 select-none">
                  <button
                    onClick={() => handleToggleFollow(user.id)}
                    className={`text-[10px] py-1.5 px-3.5 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 duration-200 ${
                      isFollowing
                        ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-3.5 h-3.5" />
                        <span>আনফলো</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>ফলো</span>
                      </>
                    )}
                  </button>

                  <div className="flex justify-between gap-1 mt-1">
                    <button
                      onClick={() => onChatWithUser && onChatWithUser(user.id)}
                      className="flex-1 bg-white dark:bg-neutral-950 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 font-bold text-[9px] px-2 py-1.5 rounded-lg text-center"
                    >
                      মেসেজ
                    </button>
                    <button
                      onClick={() => handleBlockUser(user)}
                      className="bg-red-50 hover:bg-red-100/55 dark:bg-red-950/20 text-red-500 p-1.5 rounded-lg flex items-center justify-center border border-red-100 dark:border-red-950/30"
                      aria-label="Block user"
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
