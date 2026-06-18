/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Settings, Camera, UserCheck, Shield, CheckCircle, Award } from 'lucide-react';
import { UserProfile, Post } from '../types';
import { dbService } from '../services/db';

interface ProfileViewProps {
  onNavigate: (screen: string) => void;
  onEditProfile: () => void;
  onPostSelect?: (post: Post) => void;
}

export default function ProfileView({ onNavigate, onEditProfile, onPostSelect }: ProfileViewProps) {
  const [currentUser, setCurrentUser] = React.useState<UserProfile>(dbService.getCurrentUser());
  const [myPosts, setMyPosts] = React.useState<Post[]>([]);

  React.useEffect(() => {
    // Fetch posts from dbService for this author
    const posts = dbService.getPosts('সব').filter(p => p.authorId === currentUser.id);
    setMyPosts(posts);
  }, [currentUser]);

  // Helper to re-read current user profile instantly or on interval polling
  React.useEffect(() => {
    const handleReload = () => {
      const upToDateUser = dbService.getCurrentUser();
      if (upToDateUser) {
        setCurrentUser(upToDateUser);
      }
    };
    
    window.addEventListener('starconnect_db_update', handleReload);
    const interval = setInterval(handleReload, 3000);
    return () => {
      window.removeEventListener('starconnect_db_update', handleReload);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-white dark:bg-neutral-950 pb-16">
      {/* Top Header */}
      <div className="flex justify-between items-center px-4 py-3 sticky top-0 bg-white dark:bg-neutral-950 z-10 border-b border-neutral-100 dark:border-neutral-900">
        <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">প্রোফাইল</h1>
        <button
          onClick={() => onNavigate('SETTINGS')}
          className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6 text-neutral-805 dark:text-neutral-200" />
        </button>
      </div>

      {/* Cover and Profile Image Section */}
      <div className="relative">
        <div className="h-44 w-full bg-neutral-200 dark:bg-neutral-805 overflow-hidden">
          <img
            src={currentUser.coverUrl || 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80'}
            alt="Cover"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80';
            }}
          />
        </div>

        {/* Profile Avatar with edit camera badge */}
        <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-white dark:border-neutral-950 overflow-hidden shadow-md ring-2 ring-amber-500">
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80';
                }}
              />
            </div>
            <button
              onClick={onEditProfile}
              className="absolute bottom-1 right-1 bg-amber-500 text-white p-1.5 rounded-full border-2 border-white dark:border-neutral-950 shadow hover:scale-105 active:scale-95 transition"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Info Space */}
      <div className="text-center mt-16 px-6">
        <div className="flex items-center justify-center gap-1.5">
          <h2 className="text-xl font-bold text-neutral-950 dark:text-neutral-50 tracking-wide">
            {currentUser.name}
          </h2>
          {currentUser.isVerified && (
            <CheckCircle className="w-5 h-5 text-blue-500 fill-blue-500 shrink-0" />
          )}
          {currentUser.isPremium && (
            <Award className="w-5 h-5 text-amber-500 shrink-0" />
          )}
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
          {currentUser.bio || 'Hi im Mymun'}
        </p>
      </div>

      {/* Stats Table inside very pale nice mint card */}
      <div className="px-4 mt-6">
        <div className="bg-amber-500/5 dark:bg-amber-950/20 rounded-2xl py-4 px-6 flex justify-around text-center border border-amber-500/10 shadow-sm">
          <div>
            <div className="text-xl font-bold text-amber-600">{myPosts.length}</div>
            <div className="text-xs text-neutral-500 mt-1">পোস্ট</div>
          </div>
          <div className="w-[1px] bg-amber-100/55 dark:bg-amber-900/50"></div>
          <div>
            <div className="text-xl font-bold text-amber-600">{currentUser.followingCount}</div>
            <div className="text-xs text-neutral-500 mt-1">বন্ধু</div>
          </div>
          <div className="w-[1px] bg-amber-100/55 dark:bg-amber-900/50"></div>
          <div>
            <div className="text-xl font-bold text-amber-600">{currentUser.followersCount}</div>
            <div className="text-xs text-neutral-500 mt-1">ফলোয়ার</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 px-4 mt-5">
        <button
          onClick={onEditProfile}
          className="flex-1 bg-amber-500 text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-md space-x-1 hover:bg-amber-600 active:scale-95 transition flex items-center justify-center"
        >
          <Camera className="w-4 h-4 mr-1" />
          <span>প্রোফাইল এডিট</span>
        </button>
        <button
          onClick={() => onNavigate('FRIEND_FINDER')}
          className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition active:scale-95"
        >
          <UserCheck className="w-4 h-4" />
          <span>বন্ধু খুঁজুন</span>
        </button>
      </div>

      {/* Posts list grid headers */}
      <div className="px-4 mt-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 border-b border-neutral-100 dark:border-neutral-900 pb-2">
          পোস্টসমূহ
        </h3>

        {myPosts.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 dark:text-neutral-400">
            <p className="text-sm">এখনো কোনো পোস্ট আপলোড করা হয়নি।</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {myPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => onPostSelect && onPostSelect(post)}
                className="aspect-square bg-neutral-100 dark:bg-neutral-900 rounded-xl overflow-hidden cursor-pointer group relative shadow-sm"
              >
                {post.mediaType === 'image' && post.mediaUrl && (
                  <img
                    src={post.mediaUrl}
                    alt="Post media"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                )}

                {post.mediaType === 'video' && post.mediaUrl && (
                  <div className="w-full h-full relative bg-neutral-950 flex items-center justify-center">
                    <video
                      src={post.mediaUrl}
                      muted
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-neutral-950/70 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      রিলস
                    </div>
                  </div>
                )}

                {!post.mediaUrl && (
                  <div className="w-full h-full p-3 bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center text-center text-xs font-medium">
                    <p className="line-clamp-4">{post.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Panel Link for Admins */}
      {currentUser.isAdmin && (
        <div className="px-4 mt-10">
          <button
            onClick={() => onNavigate('ADMIN_PANEL')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
          >
            <Shield className="w-4 h-4" />
            <span>অ্যাডমিন ড্যাশবোর্ড স্ক্রীন</span>
          </button>
        </div>
      )}
    </div>
  );
}
