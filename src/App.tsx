/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Rss, PlusCircle, MessageCircle, User, Award } from 'lucide-react';

import PhoneFrame from './components/PhoneFrame';
import FeedView from './components/FeedView';
import ChatView from './components/ChatView';
import ProfileView from './components/ProfileView';
import CreatePostView from './components/CreatePostView';
import SettingsView from './components/SettingsView';
import FriendFinderView from './components/FriendFinderView';
import AdminPanelView from './components/AdminPanelView';
import VerifyRequestView from './components/VerifyRequestView';
import WalletView from './components/WalletView';
import BuyStarsView from './components/BuyStarsView';
import WithdrawView from './components/WithdrawView';
import AuthView from './components/AuthView';

import { AppScreen, UserProfile, Post } from './types';
import { dbService } from './services/db';

export default function App() {
  const [currentScreen, setCurrentScreen] = React.useState<AppScreen>(AppScreen.FEED);
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);

  // Messenger routing helpers
  const [selectedChatPartnerId, setSelectedChatPartnerId] = React.useState<string | undefined>(undefined);
  const [editProfileOpen, setEditProfileOpen] = React.useState(false);

  // Load user
  React.useEffect(() => {
    const user = dbService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleLogout = () => {
    dbService.logout();
    setCurrentUser(null);
    setCurrentScreen(AppScreen.LOGIN);
  };

  const navigateToMessageUser = (userId: string) => {
    setSelectedChatPartnerId(userId);
    setCurrentScreen(AppScreen.CHAT);
  };

  const handleUserSelect = (userId: string) => {
    // Take to chat with this target creator
    navigateToMessageUser(userId);
  };

  const renderActiveScreen = () => {
    if (!currentUser) return null;

    switch (currentScreen) {
      case AppScreen.FEED:
        return (
          <FeedView
            onNavigate={(screen) => setCurrentScreen(screen as AppScreen)}
            onUserSelect={handleUserSelect}
            onMessageUser={navigateToMessageUser}
          />
        );
      case AppScreen.CHAT:
        return (
          <ChatView
            onBack={() => {
              setCurrentScreen(AppScreen.FEED);
              setSelectedChatPartnerId(undefined);
            }}
            selectedUserId={selectedChatPartnerId}
            onClearSelectedUser={() => setSelectedChatPartnerId(undefined)}
          />
        );
      case AppScreen.PROFILE:
        return (
          <ProfileView
            onNavigate={(screen) => setCurrentScreen(screen as AppScreen)}
            onEditProfile={() => setEditProfileOpen(true)}
            editProfileOpen={editProfileOpen}
            onEditProfileClose={() => setEditProfileOpen(false)}
            onPostSelect={(post) => {
              setCurrentScreen(AppScreen.FEED);
            }}
          />
        );
      case AppScreen.SETTINGS:
        return (
          <SettingsView
            onBack={() => setCurrentScreen(AppScreen.PROFILE)}
            onNavigate={(screen) => {
              if (screen === 'EDIT_PROFILE') {
                setEditProfileOpen(true);
                setCurrentScreen(AppScreen.PROFILE);
              } else {
                setCurrentScreen(screen as AppScreen);
              }
            }}
            onLogout={handleLogout}
          />
        );
      case AppScreen.CREATE_POST:
        return (
          <CreatePostView
            onClose={() => setCurrentScreen(AppScreen.FEED)}
            onPostCreated={() => setCurrentScreen(AppScreen.FEED)}
          />
        );
      case AppScreen.VERIFY_REQUEST:
        return (
          <VerifyRequestView
            onBack={() => setCurrentScreen(AppScreen.SETTINGS)}
            onSuccess={() => {
              setCurrentScreen(AppScreen.PROFILE);
              alert('অভিনন্দন! আপনার প্রোফাইল সফলভাবে ভেরিফাই করা হয়েছে। ✔');
            }}
          />
        );
      case AppScreen.FRIEND_FINDER:
        return (
          <FriendFinderView
            onBack={() => setCurrentScreen(AppScreen.FEED)}
            onNavigate={(screen) => setCurrentScreen(screen as AppScreen)}
            onChatWithUser={navigateToMessageUser}
          />
        );
      case AppScreen.ADMIN_PANEL:
        return (
          <AdminPanelView
            onBack={() => setCurrentScreen(AppScreen.PROFILE)}
          />
        );
      case AppScreen.WALLET:
        return (
          <WalletView
            onBack={() => setCurrentScreen(AppScreen.PROFILE)}
            onNavigate={(screen) => setCurrentScreen(screen as AppScreen)}
          />
        );
      case AppScreen.BUY_STARS:
        return (
          <BuyStarsView
            onBack={() => setCurrentScreen(AppScreen.WALLET)}
          />
        );
      case AppScreen.WITHDRAW:
        return (
          <WithdrawView
            onBack={() => setCurrentScreen(AppScreen.WALLET)}
          />
        );
      default:
        return (
          <FeedView
            onNavigate={(screen) => setCurrentScreen(screen as AppScreen)}
            onUserSelect={handleUserSelect}
            onMessageUser={navigateToMessageUser}
          />
        );
    }
  };

  // Helper checking if bottom bar should render
  const shouldShowNav = currentUser && 
    currentScreen !== AppScreen.CREATE_POST && 
    currentScreen !== AppScreen.VERIFY_REQUEST && 
    currentScreen !== AppScreen.ADMIN_PANEL && 
    currentScreen !== AppScreen.SETTINGS;

  return (
    <PhoneFrame>
      {!currentUser ? (
        <AuthView onLoginSuccess={(u) => {
          setCurrentUser(u);
          setCurrentScreen(AppScreen.FEED);
        }} />
      ) : (
        /* Full structural application screen container layout */
        <div className="flex-1 flex flex-col overflow-hidden h-full relative">
          
          {/* Main Display screen router */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {renderActiveScreen()}
          </div>

          {/* Fixed Premium styled Bottom Tab Navigator */}
          {shouldShowNav && (
            <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md dark:bg-neutral-900/95 border-t border-amber-100 dark:border-neutral-950 px-4 py-2.5 flex justify-around items-center z-40 select-none shadow-xl">
              
              {/* Home/Feed */}
              <button
                onClick={() => setCurrentScreen(AppScreen.FEED)}
                className={`flex flex-col items-center gap-1.5 transition ${
                  currentScreen === AppScreen.FEED ? 'text-amber-600 dark:text-amber-400 font-extrabold scale-105' : 'text-slate-400 dark:text-neutral-500 hover:text-amber-500'
                }`}
                aria-label="Feed"
              >
                <Rss className="w-5 h-5" />
                <span className="text-[9px] font-bold">ফিড</span>
              </button>

              {/* Create Dynamic Post */}
              <button
                onClick={() => setCurrentScreen(AppScreen.CREATE_POST)}
                className="flex flex-col items-center gap-1.5 -translate-y-2 cursor-pointer scale-105"
                aria-label="Create Post"
              >
                <div className="bg-gradient-to-tr from-amber-500 to-amber-600 text-white p-3 rounded-2xl shadow-lg shadow-amber-500/20 ring-4 ring-white dark:ring-neutral-900 hover:scale-110 active:scale-95 transition-all">
                  <PlusCircle className="w-6 h-6" />
                </div>
              </button>

              {/* Messenger chat */}
              <button
                onClick={() => setCurrentScreen(AppScreen.CHAT)}
                className={`flex flex-col items-center gap-1.5 transition relative ${
                  currentScreen === AppScreen.CHAT ? 'text-amber-600 dark:text-amber-400 font-extrabold scale-105' : 'text-slate-400 dark:text-neutral-500 hover:text-amber-500'
                }`}
                aria-label="Chats"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-[9px] font-bold">মেসেজ</span>
              </button>

              {/* Profile */}
              <button
                onClick={() => setCurrentScreen(AppScreen.PROFILE)}
                className={`flex flex-col items-center gap-1.5 transition ${
                  currentScreen === AppScreen.PROFILE ? 'text-amber-600 dark:text-amber-400 font-extrabold scale-105' : 'text-slate-400 dark:text-neutral-500 hover:text-amber-500'
                }`}
                aria-label="Profile"
              >
                <User className="w-5 h-5" />
                <span className="text-[9px] flex items-center gap-0.5 font-bold">
                  <span>প্রোফাইল</span>
                  {currentUser.isVerified && <span className="text-[8px] text-blue-500">✔</span>}
                </span>
              </button>

            </div>
          )}

        </div>
      )}
    </PhoneFrame>
  );
}
