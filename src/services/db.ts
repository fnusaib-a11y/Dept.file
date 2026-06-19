/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  AppScreen, 
  UserProfile, 
  Post, 
  Comment, 
  Chat, 
  Message, 
  Story, 
  Report, 
  NotificationItem, 
  StarPackage, 
  WithdrawalRequest, 
  TransactionItem,
  ReferralSettings
} from '../types';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  collection, 
  onSnapshot, 
  Firestore 
} from 'firebase/firestore';

import firebaseConfig from '../../firebase-applet-config.json';

const STORAGE_KEYS = {
  CURRENT_USER: 'starconnect_current_user',
  USERS: 'starconnect_users_db',
  POSTS: 'starconnect_posts_db',
  COMMENTS: 'starconnect_comments_db',
  MESSAGES: 'starconnect_messages_db',
  CHATS: 'starconnect_chats_db',
  STORIES: 'starconnect_stories_db',
  REPORTS: 'starconnect_reports_db',
  NOTIFICATIONS: 'starconnect_notifications_db',
  WITHDRAWALS: 'starconnect_withdrawals_db',
  TRANSACTIONS: 'starconnect_transactions_db',
  REFERRAL_SETTINGS: 'starconnect_referral_settings',
};

// Standard Star Packages
export const STAR_PACKAGES: StarPackage[] = [
  { id: 'pkg_1', starsCount: 50, priceBDT: 50, badge: 'স্টার্টার' },
  { id: 'pkg_2', starsCount: 250, priceBDT: 230, badge: 'ব্রোঞ্জ ট্রাস্ট' },
  { id: 'pkg_3', starsCount: 600, priceBDT: 500, badge: 'গোল্ডেন প্যাক (সেরা)' },
  { id: 'pkg_4', starsCount: 1300, priceBDT: 1000, badge: 'ভিআইপি ডায়মন্ড' }
];

// Initial Data Bootstrap
const BOOTSTRAP_DATA = {
  currentUser: null as UserProfile | null,

  users: [
    {
      id: 'user_admin',
      name: 'StarConnect Admin',
      username: 'admin',
      phone: '01877722819',
      password: '123456',
      bio: 'StarConnect অফিসিয়াল অ্যাডমিন প্যানেল। নিরাপদ ক্রিয়েটর ইকোসিস্টেম গড়ে তোলাই আমাদের লক্ষ্য। 🛡️🔐',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      role: 'admin' as const,
      isVerified: true,
      isPremium: false,
      kycStatus: 'approved' as const,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date().toISOString(),
      blockedUsers: [],
      starBalance: 999999,
      totalStarsEarned: 0,
      totalStarsSpent: 0,
      pendingBalanceStars: 0
    }
  ] as UserProfile[],

  posts: [] as Post[],

  comments: [] as Comment[],

  chats: [] as Chat[],

  messages: [] as Message[],

  stories: [] as Story[],

  reports: [] as Report[],

  notifications: [] as NotificationItem[],

  withdrawals: [] as WithdrawalRequest[],

  transactions: [] as TransactionItem[],

  referralSettings: {
    isEnabled: true,
    signupBonusStars: 10,
    purchaseCommissionPercent: 10
  } as ReferralSettings
};

class StarConnectDatabaseService {
  private cache: typeof BOOTSTRAP_DATA;
  private db: Firestore | null = null;
  private isFirebaseReady = false;
  public firebaseAuthError: string | null = null;

  constructor() {
    this.cache = this.loadFromStorage();
    
    // Ensure the admin user is always in the cache with the correct, updated information
    const adminTemplate = BOOTSTRAP_DATA.users.find(u => u.id === 'user_admin');
    if (adminTemplate) {
      const existingAdminIdx = this.cache.users.findIndex(u => u.id === 'user_admin');
      if (existingAdminIdx !== -1) {
        this.cache.users[existingAdminIdx] = {
          ...this.cache.users[existingAdminIdx],
          phone: adminTemplate.phone,
          password: adminTemplate.password,
          role: 'admin',
          username: adminTemplate.username,
          name: adminTemplate.name
        };
      } else {
        this.cache.users.push(adminTemplate);
      }
      this.sync();
    }

    this.initFirebase();
  }

  getAuthError(): string | null {
    return this.firebaseAuthError;
  }

  private initFirebase() {
    try {
      if (firebaseConfig && firebaseConfig.projectId) {
        const app = initializeApp(firebaseConfig);
        const dbId = (firebaseConfig as any).firestoreDatabaseId;
        this.db = dbId ? getFirestore(app, dbId) : getFirestore(app);
        
        const auth = getAuth(app);
        signInAnonymously(auth).then((cred) => {
          this.isFirebaseReady = true;
          this.firebaseAuthError = null;
          console.log("StarConnect Real Firestore Connected & Authenticated:", cred.user.uid);
          
          const me = this.cache.currentUser;
          
          // Push profile record so it exists in Firebase Users database under their stable target ID
          if (me && this.db) {
            setDoc(doc(this.db, 'users', me.id), me).catch(console.warn);
          }
          
          // Run background sync for posts and updates
          this.syncFromFirestore();
        }).catch(err => {
          this.firebaseAuthError = err.code || err.message || String(err);
          console.warn("[Firebase Authentication Info] Anonymous auth provider is disabled or not fully configured in your Firebase Project Console. Applet is executing with high-performance local database fallback state. Action required: Go to your Firebase console (Authentication -> Sign-in method) and enable the 'Anonymous' provider.", err);
        });
      }
    } catch (e) {
      console.warn("Operating in local database model fallback.", e);
    }
  }

  private async syncFromFirestore() {
    if (!this.isFirebaseReady || !this.db) return;
    try {
      // Sync Users
      const usersSnap = await getDocs(collection(this.db, 'users'));
      usersSnap.forEach(d => {
        const u = d.data() as UserProfile;
        const idx = this.cache.users.findIndex(item => item.id === u.id);
        if (idx !== -1) {
          this.cache.users[idx] = { ...this.cache.users[idx], ...u };
        } else {
          this.cache.users.push(u);
        }
      });

      // Sync Posts
      const postsSnap = await getDocs(collection(this.db, 'posts'));
      postsSnap.forEach(d => {
        const p = d.data() as Post;
        const idx = this.cache.posts.findIndex(item => item.id === p.id);
        if (idx !== -1) {
          this.cache.posts[idx] = { ...this.cache.posts[idx], ...p };
        } else {
          this.cache.posts.push(p);
        }
      });

      this.sync();
      window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    } catch (err) {
      console.warn("Error running Firestore collections catchup:", err);
    }
  }

  async fetchCommentsFromFirestore(postId: string): Promise<Comment[]> {
    if (!this.isFirebaseReady || !this.db) {
      return this.getComments(postId);
    }
    try {
      const q = collection(this.db, 'posts', postId, 'comments');
      const snapshot = await getDocs(q);
      const list: Comment[] = [];
      snapshot.forEach(d => {
        const c = d.data() as Comment;
        list.push(c);
        
        // Populate local cache copy if missing
        if (!this.cache.comments.some(x => x.id === c.id)) {
          this.cache.comments.push(c);
        }
      });
      this.sync();
      return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (err) {
      console.warn("Exception during Comments download from Firestore:", err);
      return this.getComments(postId);
    }
  }

  private loadFromStorage(): typeof BOOTSTRAP_DATA {
    const data: any = {};
    try {
      const uCurrent = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      const uAll = localStorage.getItem(STORAGE_KEYS.USERS);
      const posts = localStorage.getItem(STORAGE_KEYS.POSTS);
      const comments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      const messages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      const chats = localStorage.getItem(STORAGE_KEYS.CHATS);
      const stories = localStorage.getItem(STORAGE_KEYS.STORIES);
      const reports = localStorage.getItem(STORAGE_KEYS.REPORTS);
      const notifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const withdrawals = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
      const transactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const referralSettings = localStorage.getItem(STORAGE_KEYS.REFERRAL_SETTINGS);

      data.currentUser = uCurrent && uCurrent !== 'null' ? JSON.parse(uCurrent) : null;
      data.users = uAll ? JSON.parse(uAll) : BOOTSTRAP_DATA.users;
      data.posts = posts ? JSON.parse(posts) : BOOTSTRAP_DATA.posts;
      data.comments = comments ? JSON.parse(comments) : BOOTSTRAP_DATA.comments;
      data.messages = messages ? JSON.parse(messages) : BOOTSTRAP_DATA.messages;
      data.chats = chats ? JSON.parse(chats) : BOOTSTRAP_DATA.chats;
      data.stories = stories ? JSON.parse(stories) : BOOTSTRAP_DATA.stories;
      data.reports = reports ? JSON.parse(reports) : BOOTSTRAP_DATA.reports;
      data.notifications = notifications ? JSON.parse(notifications) : BOOTSTRAP_DATA.notifications;
      data.withdrawals = withdrawals ? JSON.parse(withdrawals) : BOOTSTRAP_DATA.withdrawals;
      data.transactions = transactions ? JSON.parse(transactions) : BOOTSTRAP_DATA.transactions;
      data.referralSettings = referralSettings ? JSON.parse(referralSettings) : BOOTSTRAP_DATA.referralSettings;
      
      if (!uCurrent) this.saveToStorage(data);
      return data as typeof BOOTSTRAP_DATA;
    } catch (e) {
      return BOOTSTRAP_DATA;
    }
  }

  private saveToStorage(data: typeof BOOTSTRAP_DATA) {
    try {
      if (data.currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(data.posts));
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(data.comments));
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(data.messages));
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(data.chats));
      localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(data.stories));
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(data.reports));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
      localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(data.withdrawals));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
      localStorage.setItem(STORAGE_KEYS.REFERRAL_SETTINGS, JSON.stringify(data.referralSettings));
    } catch (e: any) {
      console.error("[Storage Quota Info] Local storage exceeded 5MB limit or threw an exception:", e);
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn("সতর্কতা: আপনার ব্রাউজারের লোকাল স্টোরেজ (৫ মেগাবাইট) পূর্ণ হয়ে গিয়েছে! অতিরিক্ত বড় ছবি বা ভিডিও আপলোড করার কারণে এটি হতে পারে।");
      }
    }
  }

  private sync() {
    this.saveToStorage(this.cache);
  }

  // --- Auth & Users ---
  getCurrentUser(): UserProfile | null {
    return this.cache.currentUser;
  }

  getUsers(): UserProfile[] {
    return this.cache.users;
  }

  getUserById(userId: string): UserProfile | undefined {
    return this.cache.users.find(u => u.id === userId);
  }

  private isSamePhone(p1: string, p2: string): boolean {
    const clean = (p: string) => p.replace(/\D/g, '');
    const c1 = clean(p1);
    const c2 = clean(p2);
    if (!c1 || !c2) return false;
    
    // Support Bangladeshi phone formats (+88018..., 88018..., 018...) by comparing the last 10 digits
    if (c1.length >= 10 && c2.length >= 10) {
      return c1.slice(-10) === c2.slice(-10);
    }
    
    return c1 === c2 || c1.endsWith(c2) || c2.endsWith(c1);
  }

  signupUser(name: string, phone: string, email: string, password: string, role: 'user' | 'creator' = 'user', referrerCodeInput?: string): { success: boolean; error?: string; user?: UserProfile } {
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    
    // Check if duplicate phone exists in cache
    const existingLocal = this.cache.users.find(u => this.isSamePhone(u.phone, trimmedPhone));
    if (existingLocal) {
      return { success: false, error: 'এই মোবাইল নম্বরটি দিয়ে ইতোমধ্যে অ্যাকাউন্ট খোলা হয়েছে!' };
    }

    // Check referral code if provided
    let referredByUser: UserProfile | undefined;
    const refCodeClean = referrerCodeInput ? referrerCodeInput.trim().toLowerCase() : '';
    if (refCodeClean) {
      referredByUser = this.cache.users.find(u => 
        (u.username && u.username.toLowerCase() === refCodeClean) || 
        (u.referralCode && u.referralCode.toLowerCase() === refCodeClean)
      );
      if (!referredByUser) {
        return { success: false, error: 'ভুল রেফার কোড! সঠিক রেফার কোড লিখুন অথবা ঘরটি খালি রাখুন।' };
      }
    }

    const uid = 'user_' + Math.random().toString(36).substr(2, 9);
    const username = name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 100);
    const newUser: UserProfile = {
      id: uid,
      name: name.trim(),
      username,
      phone: trimmedPhone,
      email: trimmedEmail,
      password: password,
      bio: `StarConnect-এ আপনাকে স্বাগতম! 🌟 (${role === 'creator' ? 'ক্রিয়েটর প্রোফাইল' : 'সদস্য প্রোফাইল'})`,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`,
      coverUrl: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
      role,
      isVerified: false,
      isPremium: role === 'creator',
      kycStatus: 'none',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date().toISOString(),
      blockedUsers: [],
      starBalance: role === 'creator' ? 0 : 100, // starting balance
      totalStarsEarned: 0,
      totalStarsSpent: 0,
      pendingBalanceStars: 0,
      
      // Referral fields on signup
      referralCode: username,
      referredBy: referredByUser ? referredByUser.id : undefined,
      referralsCount: 0,
      totalReferralBonus: 0
    };

    // Credit bonus to the referrer if settings allow it
    const refSettings = this.cache.referralSettings || {
      isEnabled: true,
      signupBonusStars: 10,
      purchaseCommissionPercent: 10
    };

    if (referredByUser && refSettings.isEnabled && refSettings.signupBonusStars > 0) {
      referredByUser.starBalance = (referredByUser.starBalance || 0) + refSettings.signupBonusStars;
      referredByUser.totalStarsEarned = (referredByUser.totalStarsEarned || 0) + refSettings.signupBonusStars;
      referredByUser.referralsCount = (referredByUser.referralsCount || 0) + 1;
      referredByUser.totalReferralBonus = (referredByUser.totalReferralBonus || 0) + refSettings.signupBonusStars;
      
      this.updateUserRecord(referredByUser);

      this.addTransaction(
        referredByUser.id, 
        'post_earn', 
        refSettings.signupBonusStars, 
        undefined, 
        uid, 
        `নতুন মেম্বার রেফারেল বোনাস (${newUser.name})`
      );

      this.addNotification(
        referredByUser.id, 
        'user_admin', 
        'StarConnect Referral', 
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 
        'stars_received', 
        `অভিনন্দন! আপনার রেফারেল কোড ব্যবহার করে ${newUser.name} জয়েন করেছেন। আপনি ${refSettings.signupBonusStars}টি বোনাস স্টার পেয়েছেন! 🌟`
      );

      // Save updated referrer to Firestore if online
      if (this.isFirebaseReady && this.db) {
        setDoc(doc(this.db, 'users', referredByUser.id), referredByUser).catch(console.warn);
      }
    }

    this.cache.users.push(newUser);
    this.cache.currentUser = newUser;
    this.sync();

    // Firestore Sync
    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'users', uid), newUser).catch(console.warn);
    }

    return { success: true, user: newUser };
  }

  loginUser(phone: string, password: string): { success: boolean; error?: string; user?: UserProfile } {
    const trimmedPhone = phone.trim();
    // Find matching user
    const user = this.cache.users.find(u => this.isSamePhone(u.phone, trimmedPhone));
    if (!user) {
      return { success: false, error: 'এই মোবাইল নম্বর দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি!' };
    }

    const storedPassword = user.password || '123456'; // standard default password for preset seed users
    if (storedPassword !== password) {
      return { success: false, error: 'ভুল পাসওয়ার্ড! অনুগ্রহ করে আবার চেষ্টা করুন।' };
    }

    this.cache.currentUser = user;
    this.sync();

    // Sync to Firestore Users collection
    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'users', user.id), user).catch(console.warn);
    }

    return { success: true, user };
  }

  registerUser(name: string, phone: string, role: 'user' | 'creator' = 'user'): UserProfile {
    const existing = this.cache.users.find(u => this.isSamePhone(u.phone, phone));
    if (existing) {
      this.cache.currentUser = existing;
      this.sync();
      return existing;
    }

    const uid = 'user_' + Math.random().toString(36).substr(2, 9);
    const username = name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 100);
    const newUser: UserProfile = {
      id: uid,
      name,
      username,
      phone,
      bio: `StarConnect-এ আপনাকে স্বাগতম! 🌟 (${role === 'creator' ? 'ক্রিয়েটর প্রোফাইল' : 'সদস্য প্রোফাইল'})`,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`,
      coverUrl: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
      role,
      isVerified: false,
      isPremium: role === 'creator',
      kycStatus: 'none',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date().toISOString(),
      blockedUsers: [],
      starBalance: role === 'creator' ? 0 : 100, // 100 starter stars for testing!
      totalStarsEarned: 0,
      totalStarsSpent: 0,
      pendingBalanceStars: 0
    };

    this.cache.users.push(newUser);
    this.cache.currentUser = newUser;
    this.sync();

    // Firestore Sync
    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'users', uid), newUser).catch(console.warn);
    }

    return newUser;
  }

  updateProfile(updates: Partial<UserProfile>): UserProfile {
    const user = this.cache.currentUser;
    Object.assign(user, updates);

    const idx = this.cache.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.cache.users[idx] = { ...user };
    }

    this.cache.posts = this.cache.posts.map(p => {
      if (p.authorId === user.id) {
        return {
          ...p,
          authorName: user.name,
          authorAvatarUrl: user.avatarUrl,
          authorIsVerified: user.isVerified
        };
      }
      return p;
    });

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));

    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'users', user.id), user).catch(console.warn);
    }

    return user;
  }

  switchRole(role: 'user' | 'creator' | 'admin') {
    const user = this.cache.currentUser;
    user.role = role;
    
    // Modify verified and premium tags on creator role for safety checks
    if (role === 'creator') {
      user.isPremium = true;
      if (user.kycStatus === 'none') {
        user.kycStatus = 'approved'; // auto-approve mock role switch as well
        user.isVerified = true;
      }
    } else if (role === 'admin') {
      user.isVerified = true;
    }

    const idx = this.cache.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.cache.users[idx] = { ...user };
    }
    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  submitKyc(realName: string, idNum: string): UserProfile {
    const user = this.cache.currentUser;
    user.kycStatus = 'pending';
    user.kycRealName = realName;
    user.kycNidOrPassport = idNum;

    const idx = this.cache.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.cache.users[idx] = { ...user };
    }
    this.sync();

    // Notify admins
    this.addNotification('user_admin', user.id, user.name, user.avatarUrl, 'kyc_update', `ক্রিয়েটর ভেরিফিকেশন (KYC) এর জন্য রিকোয়েস্ট জমা দিয়েছেন। NID: ${idNum}`);

    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'users', user.id), user).catch(console.warn);
    }

    return user;
  }

  logout() {
    // Simply clear session locally can trigger login
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.cache.currentUser = null as any;
  }

  // --- Follow Rules ---
  toggleFollow(targetUserId: string): { isFollowing: boolean; targetUser: UserProfile } {
    const me = this.cache.currentUser;
    const target = this.getUserById(targetUserId);
    if (!target) return { isFollowing: false, targetUser: null as any };

    const followKey = `follow_${me.id}_${target.id}`;
    const followExists = localStorage.getItem(followKey) === 'true';

    if (followExists) {
      localStorage.setItem(followKey, 'false');
      me.followingCount = Math.max(0, me.followingCount - 1);
      target.followersCount = Math.max(0, target.followersCount - 1);
    } else {
      localStorage.setItem(followKey, 'true');
      me.followingCount++;
      target.followersCount++;
      this.addNotification(target.id, me.id, me.name, me.avatarUrl, 'follow', 'আপনার প্রোফাইল ফলো করছেন।');
    }

    this.cache.currentUser = { ...me };
    const idxMe = this.cache.users.findIndex(u => u.id === me.id);
    if (idxMe !== -1) this.cache.users[idxMe] = { ...me };

    const idxTarget = this.cache.users.findIndex(u => u.id === target.id);
    if (idxTarget !== -1) this.cache.users[idxTarget] = { ...target };

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return { isFollowing: !followExists, targetUser: target };
  }

  isFollowing(targetUserId: string): boolean {
    const me = this.cache.currentUser;
    if (!me) return false;
    return localStorage.getItem(`follow_${me.id}_${targetUserId}`) === 'true';
  }

  // --- Post Functions ---
  getPosts(category: string = 'সব'): Post[] {
    const me = this.cache.currentUser;
    const blocked = me?.blockedUsers || [];
    let list = this.cache.posts.filter(p => !blocked.includes(p.authorId));

    if (category !== 'সব') {
      list = list.filter(p => p.category === category);
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getReels(): Post[] {
    const me = this.cache.currentUser;
    const blocked = me?.blockedUsers || [];
    return this.cache.posts
      .filter(p => !blocked.includes(p.authorId) && (p.isReel || p.mediaType === 'video'))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getPostsByAuthor(authorId: string): Post[] {
    return this.cache.posts.filter(p => p.authorId === authorId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createPost(title: string, content: string, mediaUrl: string, mediaType: 'image' | 'video' | 'none', category: string, isPremium: boolean, starPrice: number, tags: string[] = []): Post {
    const me = this.cache.currentUser;
    const postId = 'post_' + Math.random().toString(36).substr(2, 9);
    
    // Fallback beautiful images if none provided
    let finalMedia = mediaUrl;
    if (mediaType === 'image' && !mediaUrl) {
      const artImages = [
        'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80'
      ];
      finalMedia = artImages[Math.floor(Math.random() * artImages.length)];
    }

    const newPost: Post = {
      id: postId,
      authorId: me.id,
      authorName: me.name,
      authorAvatarUrl: me.avatarUrl,
      authorIsVerified: me.isVerified,
      title: title || 'নতুন চমৎকার ছবি',
      content,
      mediaUrl: finalMedia,
      mediaType,
      category,
      tags,
      isReel: false,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      isPremiumPost: isPremium,
      starPrice: isPremium ? starPrice : 0,
      unlockedByUserIds: []
    };

    this.cache.posts.unshift(newPost);
    me.postsCount++;
    this.updateUserRecord(me);
    this.sync();

    // Notify followers
    this.cache.users.forEach(u => {
      if (this.isFollowingCheck(u.id, me.id)) {
        this.addNotification(u.id, me.id, me.name, me.avatarUrl, 'premium', `${isPremium ? 'একটি এক্সক্লুসিভ ছবি' : 'একটি নতুন পাবলিক ছবি'} পোস্ট করেছেন: "${title}"`);
      }
    });

    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'posts', postId), newPost).catch(console.warn);
    }

    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return newPost;
  }

  private isFollowingCheck(followerId: string, followingId: string): boolean {
    return localStorage.getItem(`follow_${followerId}_${followingId}`) === 'true';
  }

  toggleLike(postId: string): Post | null {
    const me = this.cache.currentUser;
    const idx = this.cache.posts.findIndex(p => p.id === postId);
    if (idx === -1) return null;

    const post = this.cache.posts[idx];
    const likedIdx = post.likedBy.indexOf(me.id);

    if (likedIdx > -1) {
      post.likedBy.splice(likedIdx, 1);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likedBy.push(me.id);
      post.likesCount++;
      if (post.authorId !== me.id) {
        this.addNotification(post.authorId, me.id, me.name, me.avatarUrl, 'like', `আপনার "${post.title}" পোস্টটি পছন্দ করেছেন। ⭐`, post.id);
      }
    }

    this.cache.posts[idx] = { ...post };
    this.sync();
    return post;
  }

  addComment(postId: string, content: string): Comment {
    const me = this.cache.currentUser;
    const cid = 'c_' + Math.random().toString(36).substr(2, 9);
    const newComment: Comment = {
      id: cid,
      postId,
      authorId: me.id,
      authorName: me.name,
      authorAvatarUrl: me.avatarUrl,
      content,
      createdAt: new Date().toISOString()
    };

    this.cache.comments.push(newComment);
    const postIdx = this.cache.posts.findIndex(p => p.id === postId);
    let updatedPost: Post | null = null;
    if (postIdx !== -1) {
      const post = this.cache.posts[postIdx];
      post.commentsCount++;
      updatedPost = post;
      if (post.authorId !== me.id) {
        this.addNotification(post.authorId, me.id, me.name, me.avatarUrl, 'comment', `আপনার "${post.title}" পোস্টে মন্তব্য করেছেন: "${content}"`, postId);
      }
    }
    this.sync();

    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'posts', postId, 'comments', cid), newComment).catch(console.warn);
      if (updatedPost) {
        setDoc(doc(this.db, 'posts', postId), updatedPost).catch(console.warn);
      }
    }

    return newComment;
  }

  getComments(postId: string): Comment[] {
    return this.cache.comments.filter(c => c.postId === postId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // --- Unlock Premium Post ---
  unlockPremiumPost(postId: string): { success: boolean; error?: string } {
    const me = this.cache.currentUser;
    const post = this.cache.posts.find(p => p.id === postId);
    if (!post) return { success: false, error: 'পোস্টটি খুঁজে পাওয়া যায়নি।' };
    if (!post.isPremiumPost) return { success: true }; // already unlocked as public
    if (post.unlockedByUserIds.includes(me.id) || post.authorId === me.id) return { success: true };

    if (me.starBalance < post.starPrice) {
      return { success: false, error: 'পর্যাপ্ত স্টার ব্যালেন্স নেই। স্টার রিচার্জ করুন!' };
    }

    // Deduct and Transfer Stars
    me.starBalance -= post.starPrice;
    me.totalStarsSpent += post.starPrice;
    this.updateUserRecord(me);

    // Transfer stars to creator's cashout balance
    const creator = this.getUserById(post.authorId);
    if (creator) {
      creator.starBalance += post.starPrice; // creator earns instantly
      creator.totalStarsEarned += post.starPrice;
      creator.pendingBalanceStars += post.starPrice; // cashable pending approval
      this.updateUserRecord(creator);

      // Log transactions
      this.addTransaction(me.id, 'unlock_post', post.starPrice, undefined, post.id, post.title);
      this.addTransaction(creator.id, 'post_earn', post.starPrice, undefined, post.id, post.title);

      // Notify creator
      this.addNotification(creator.id, me.id, me.name, me.avatarUrl, 'stars_received', `আপনার "${post.title}" ছবিটি আনলক করতে ${post.starPrice}টি স্টার পাঠিয়েছেন। 🌟`);
    }

    post.unlockedByUserIds.push(me.id);
    this.sync();
    
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return { success: true };
  }

  // --- Star Transactions & Packages ---
  buyStars(pkgId: string): { success: boolean; starsAdded: number } {
    const me = this.cache.currentUser;
    const pkg = STAR_PACKAGES.find(p => p.id === pkgId);
    if (!pkg) return { success: false, starsAdded: 0 };

    me.starBalance += pkg.starsCount;
    this.updateUserRecord(me);

    this.addTransaction(me.id, 'buy_stars', pkg.starsCount, pkg.priceBDT, pkg.id, pkg.badge || 'স্টার রিচার্জ');
    this.addNotification(me.id, 'user_admin', 'StarConnect Billing', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 'premium', `অভিনন্দন! সফলভাবে বিকাশ/নগদের মাধ্যমে ${pkg.starsCount}টি স্টার রিচার্জ সম্পন্ন হয়েছে। ৳${pkg.priceBDT}`);

    // Process referral purchase commission
    const refSettings = this.cache.referralSettings || {
      isEnabled: true,
      signupBonusStars: 10,
      purchaseCommissionPercent: 10
    };

    if (refSettings.isEnabled && me.referredBy) {
      const referrer = this.getUserById(me.referredBy);
      if (referrer) {
        const commissionPercent = refSettings.purchaseCommissionPercent || 0;
        const commissionStars = Math.floor((pkg.starsCount * commissionPercent) / 100);
        if (commissionStars > 0) {
          referrer.starBalance = (referrer.starBalance || 0) + commissionStars;
          referrer.totalStarsEarned = (referrer.totalStarsEarned || 0) + commissionStars;
          referrer.totalReferralBonus = (referrer.totalReferralBonus || 0) + commissionStars;
          this.updateUserRecord(referrer);

          this.addTransaction(
            referrer.id, 
            'post_earn', 
            commissionStars, 
            undefined, 
            me.id, 
            `রেফারেল রিচার্জ কমিশন (${me.name})`
          );

          this.addNotification(
            referrer.id, 
            'user_admin', 
            'StarConnect Referral', 
            'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 
            'stars_received', 
            `অভিনন্দন! আপনার রেফার করা ইউজার ${me.name} ${pkg.starsCount} স্টার রিচার্জ করেছেন। আপনি ${commissionStars} স্টার (${commissionPercent}%) বোনাস কমিশন পেয়েছেন! 🌟`
          );

          if (this.isFirebaseReady && this.db) {
            setDoc(doc(this.db, 'users', referrer.id), referrer).catch(console.warn);
          }
        }
      }
    }

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return { success: true, starsAdded: pkg.starsCount };
  }

  sendDirectStars(targetUserId: string, amount: number): { success: boolean; error?: string } {
    const me = this.cache.currentUser;
    if (me.id === targetUserId) return { success: false, error: 'নিজেকে স্টার পাঠাতে পারবেন না!' };
    if (me.starBalance < amount) return { success: false, error: 'পর্যাপ্ত স্টার ব্যালেন্স নেই!' };

    const target = this.getUserById(targetUserId);
    if (!target) return { success: false, error: 'ইউজার খুঁজে পাওয়া যায়নি!' };

    me.starBalance -= amount;
    me.totalStarsSpent += amount;
    this.updateUserRecord(me);

    target.starBalance += amount;
    target.totalStarsEarned += amount;
    target.pendingBalanceStars += amount;
    this.updateUserRecord(target);

    // Save Transactions log
    this.addTransaction(me.id, 'send_gift', amount, undefined, target.id, target.name);
    this.addTransaction(target.id, 'receive_gift', amount, undefined, me.id, me.name);

    // Notifications
    this.addNotification(target.id, me.id, me.name, me.avatarUrl, 'stars_received', `আপনাকে সরাসরি ${amount}টি স্টার উপহার দিয়েছেন। 😍🌟`);

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return { success: true };
  }

  // --- Cash Out / Withdraw System ---
  submitWithdrawal(amountStars: number, method: 'bKash' | 'Nagad' | 'Rocket', accountNumber: string): { success: boolean; error?: string } {
    const me = this.cache.currentUser;
    
    if (amountStars < 500) {
      return { success: false, error: 'সর্বনিম্ন ৫০০ স্টার উইথড্র করতে হবে।' };
    }
    
    if (me.pendingBalanceStars < amountStars) {
      return { success: false, error: 'আপনার পর্যাপ্ত উইথড্রযোগ্য পেন্ডিং ব্যালেন্স নেই।' };
    }

    // star conversion: 1 star = ৳0.8 BDT
    const amountBDT = Math.round(amountStars * 0.8);

    // Lock/Move pending state logically
    me.pendingBalanceStars -= amountStars;
    this.updateUserRecord(me);

    const reqId = 'w_req_' + Date.now();
    const newRequest: WithdrawalRequest = {
      id: reqId,
      userId: me.id,
      userName: me.name,
      amountStars,
      amountBDT,
      method,
      accountNumber,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.cache.withdrawals.unshift(newRequest);
    this.addTransaction(me.id, 'withdraw', amountStars, amountBDT, reqId, `${method} উইথড্র আবেদন`);

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return { success: true };
  }

  getWithdrawalHistory(userId?: string): WithdrawalRequest[] {
    if (userId) {
      return this.cache.withdrawals.filter(w => w.userId === userId);
    }
    return this.cache.withdrawals;
  }

  getTransactions(userId: string): TransactionItem[] {
    return this.cache.transactions.filter(t => t.userId === userId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- Chat Systems ---
  getChats(): Chat[] {
    const me = this.cache.currentUser;
    if (!me) return [];
    return this.cache.chats.filter(c => c.participants.includes(me.id)).sort((a,b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }

  getMessages(chatId: string): Message[] {
    return this.cache.messages.filter(m => m.chatId === chatId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  sendMessage(receiverId: string, content: string, mediaType: Message['mediaType'] = 'text', starGiftAmount?: number): Message {
    const me = this.cache.currentUser;
    const chatId = [me.id, receiverId].sort().join('_');
    const msgId = 'msg_' + Date.now();
    const timestamp = new Date().toISOString();

    // Check if Paid Chat is active (where sending user must pay stars config)
    const activeChat = this.cache.chats.find(c => c.id === chatId);
    if (activeChat && activeChat.isPaidChatEnabled && activeChat.starRatePerMessage && me.role !== 'creator') {
      const rate = activeChat.starRatePerMessage;
      if (me.starBalance < rate) {
        throw new Error(`এই ক্রিয়েটরের পেইড চ্যাট সক্রিয় রয়েছে। মেসেজ পাঠাতে ${rate} স্টার প্রয়োজন।`);
      }
      // charge
      me.starBalance -= rate;
      this.updateUserRecord(me);
      
      const receiver = this.getUserById(receiverId);
      if (receiver) {
        receiver.starBalance += rate;
        receiver.totalStarsEarned += rate;
        receiver.pendingBalanceStars += rate;
        this.updateUserRecord(receiver);
        this.addTransaction(me.id, 'send_gift', rate, undefined, receiver.id, receiver.name);
        this.addTransaction(receiver.id, 'receive_gift', rate, undefined, me.id, me.name);
      }
    }

    const newMsg: Message = {
      id: msgId,
      chatId,
      senderId: me.id,
      receiverId,
      content,
      createdAt: timestamp,
      isRead: false,
      mediaType,
      starGiftAmount
    };

    this.cache.messages.push(newMsg);

    // Update chat index
    const chatIdx = this.cache.chats.findIndex(c => c.id === chatId);
    if (chatIdx !== -1) {
      this.cache.chats[chatIdx].lastMessage = mediaType === 'star_gift' ? `🎁 ${starGiftAmount} Stars Gift!` : content;
      this.cache.chats[chatIdx].lastMessageAt = timestamp;
      if (!this.cache.chats[chatIdx].unreadCount) this.cache.chats[chatIdx].unreadCount = {};
      this.cache.chats[chatIdx].unreadCount[receiverId] = (this.cache.chats[chatIdx].unreadCount[receiverId] || 0) + 1;
    } else {
      this.cache.chats.push({
        id: chatId,
        participants: [me.id, receiverId],
        lastMessage: mediaType === 'star_gift' ? `🎁 ${starGiftAmount} Stars Gift!` : content,
        lastMessageAt: timestamp,
        unreadCount: { [receiverId]: 1, [me.id]: 0 },
        isPaidChatEnabled: false
      });
    }

    this.sync();

    // Trigger auto bot reply from initial creators for gorgeous UX if desired
    if (receiverId === 'user_mymun' || receiverId === 'user_anika' || receiverId === 'user_samin') {
      setTimeout(() => {
        this.simulateCreatorAutoReply(chatId, receiverId);
      }, 1500);
    }

    window.dispatchEvent(new CustomEvent('starconnect_new_message', { detail: { chatId } }));
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return newMsg;
  }

  private simulateCreatorAutoReply(chatId: string, creatorId: string) {
    const me = this.cache.currentUser;
    const creator = this.getUserById(creatorId);
    if (!creator) return;

    const replies = [
      'আপনার মিষ্টি স্টার গিফটের জন্য অনেক ধন্যবাদ! আপনার সাপোর্ট আমার কাজ করার উৎসাহ দ্বিগুণ করে দেয়। 🥰🌟',
      'আসসালামু আলাইকুম। আমি ম্যাসেজ পেয়েছি। আমার এক্সক্লুসিভ ছবিগুলো কেমন লেগেছে আর্ট সেকশনে?',
      'চমৎকার! আপনার মেসেজ পেয়ে অনেক ভালো লেগেছে। খুব শীঘ্রই নতুন প্রিমিয়াম ছবি আপলোড দিতে যাচ্ছি। পাশে থাকবেন!',
      'ধন্যবাদ! স্টার কানেক্ট অ্যাপ দিয়ে সবার সাথে সংযুক্ত থাকতে পেরে আমি আনন্দিত। 😊'
    ];
    const picked = replies[Math.floor(Math.random() * replies.length)];
    const timestamp = new Date().toISOString();
    const msgId = 'msg_' + Date.now() + '_auto';

    const replyMsg: Message = {
      id: msgId,
      chatId,
      senderId: creatorId,
      receiverId: me.id,
      content: picked,
      createdAt: timestamp,
      isRead: false,
      mediaType: 'text'
    };

    this.cache.messages.push(replyMsg);

    const chatIdx = this.cache.chats.findIndex(c => c.id === chatId);
    if (chatIdx !== -1) {
      this.cache.chats[chatIdx].lastMessage = picked;
      this.cache.chats[chatIdx].lastMessageAt = timestamp;
      if (!this.cache.chats[chatIdx].unreadCount) this.cache.chats[chatIdx].unreadCount = {};
      this.cache.chats[chatIdx].unreadCount[me.id] = (this.cache.chats[chatIdx].unreadCount[me.id] || 0) + 1;
    }

    this.addNotification(me.id, creatorId, creator.name, creator.avatarUrl, 'message', `আপনাকে মেসেজ পাঠিয়েছেন: "${picked.substring(0,20)}..."`);
    this.sync();

    window.dispatchEvent(new CustomEvent('starconnect_new_message', { detail: { chatId } }));
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  markChatAsRead(chatId: string) {
    const me = this.cache.currentUser;
    if (!me) return;

    // Set messages to isRead: true for messages sent by the partner
    this.cache.messages = this.cache.messages.map(m => {
      if (m.chatId === chatId && m.receiverId === me.id) {
        return { ...m, isRead: true };
      }
      return m;
    });

    // Reset unread count for current user
    const chatIdx = this.cache.chats.findIndex(c => c.id === chatId);
    if (chatIdx !== -1) {
      if (!this.cache.chats[chatIdx].unreadCount) {
        this.cache.chats[chatIdx].unreadCount = {};
      }
      this.cache.chats[chatIdx].unreadCount[me.id] = 0;
    }

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  marChatAsRead(chatId: string) {
    this.markChatAsRead(chatId);
  }

  // --- Reports & Moderations ---
  getReports(): Report[] {
    return this.cache.reports;
  }

  reportContent(reportedId: string, reportedName: string, reason: string, postId?: string, postContent?: string) {
    const me = this.cache.currentUser;
    const repId = 'rep_' + Date.now();
    const rep: Report = {
      id: repId,
      reporterId: me.id,
      reporterName: me.name,
      reportedId,
      reportedName,
      postId,
      postContent,
      reason,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    this.cache.reports.push(rep);
    this.sync();
  }

  resolveReport(reportId: string) {
    this.cache.reports = this.cache.reports.map(r => {
      if (r.id === reportId) return { ...r, status: 'resolved' as const };
      return r;
    });
    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  requestPremium(): UserProfile {
    const me = this.cache.currentUser;
    me.isPremium = true;

    // Update in users array
    const idx = this.cache.users.findIndex(u => u.id === me.id);
    if (idx !== -1) {
      this.cache.users[idx].isPremium = true;
    }

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return me;
  }

  // --- ADMIN SPECIAL MANAGEMENT METHODS ---
  approveKyc(userId: string) {
    const creator = this.getUserById(userId);
    if (!creator) return;

    creator.kycStatus = 'approved';
    creator.role = 'creator';
    creator.isVerified = true;
    creator.isPremium = true;

    this.updateUserRecord(creator);
    this.addNotification(creator.id, 'user_admin', 'StarConnect Team', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 'kyc_update', 'অভিনন্দন! আপনার ক্রিয়েটর KYC এবং জাতীয় পরিচয়পত্র ভেরিফিকেশন সফলভাবে অনুমোদিত হয়েছে। এখন থেকে আপনি নিজস্ব স্টার ফি নির্ধারণ করে ছবি আপলোড দিতে পারবেন! 🌟💼');

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  rejectKyc(userId: string) {
    const creator = this.getUserById(userId);
    if (!creator) return;

    creator.kycStatus = 'rejected';
    this.updateUserRecord(creator);
    this.addNotification(creator.id, 'user_admin', 'StarConnect Team', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 'kyc_update', 'দুঃখিত, আপনার জমাকৃত KYC ডকুমেন্ট আমাদের নিয়মের সংগে সামঞ্জস্যপূর্ণ না হওয়ায় বাতিল করা হয়েছে। দয়া করে সঠিক নথিসহ পুনরায় চেষ্টা করুন।');

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  approveWithdrawal(withdrawalId: string) {
    const idx = this.cache.withdrawals.findIndex(w => w.id === withdrawalId);
    if (idx === -1) return;

    const req = this.cache.withdrawals[idx];
    req.status = 'approved';

    const creator = this.getUserById(req.userId);
    if (creator) {
      this.updateUserRecord(creator);
      this.addNotification(creator.id, 'user_admin', 'StarConnect Accounts', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 'withdrawal_update', `আপনার ৳${req.amountBDT} টাকা ক্যাশ আউট রিকোয়েস্টটি অনুমোদিত হয়েছে এবং আপনার ${req.method} নম্বরে সফলভাবে পাঠানো হয়েছে। রিকোয়েস্ট আইডি: ${req.id}`);
    }

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  rejectWithdrawal(withdrawalId: string) {
    const idx = this.cache.withdrawals.findIndex(w => w.id === withdrawalId);
    if (idx === -1) return;

    const req = this.cache.withdrawals[idx];
    req.status = 'rejected';

    const creator = this.getUserById(req.userId);
    if (creator) {
      // Return stars to pending balance
      creator.pendingBalanceStars += req.amountStars;
      this.updateUserRecord(creator);
      this.addNotification(creator.id, 'user_admin', 'StarConnect Accounts', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 'withdrawal_update', `দুঃখিত! আপনার ৳${req.amountBDT} টাকা ক্যাশ আউট রিকোয়েস্টটি বাতিল করা হয়েছে এবং ${req.amountStars}টি স্টার আপনার ওয়ালেটে ফেরত দেওয়া হয়েছে।`);
    }

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  banUser(userId: string) {
    const user = this.getUserById(userId);
    if (!user) return;

    // We can simulate ban simply by adding to blocked users of current user or changing bio to ban
    user.bio = '🛑 [This account has been banned/suspended by StarConnect Administration for content policy violation]';
    this.updateUserRecord(user);
    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  // --- Local Utilities ---
  private updateUserRecord(user: UserProfile) {
    const idx = this.cache.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.cache.users[idx] = { ...user };
    }
  }

  private addTransaction(userId: string, type: TransactionItem['type'], amountStars: number, amountBDT?: number, refId?: string, refName?: string) {
    const tx: TransactionItem = {
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      userId,
      type,
      amountStars,
      amountBDT,
      referenceId: refId,
      referenceName: refName,
      status: 'completed',
      createdAt: new Date().toISOString()
    };
    this.cache.transactions.unshift(tx);
    this.sync();
  }

  private addNotification(userId: string, senderId: string, senderName: string, senderAvatarUrl: string, type: NotificationItem['type'], text: string, postId?: string) {
    const notif: NotificationItem = {
      id: 'notif_' + Math.random().toString(36).substr(2, 9),
      userId,
      senderId,
      senderName,
      senderAvatarUrl,
      type,
      text,
      isRead: false,
      createdAt: new Date().toISOString(),
      postId
    };
    this.cache.notifications.unshift(notif);
    this.sync();
  }

  getNotifications(): NotificationItem[] {
    return this.cache.notifications;
  }

  markAllNotificationsRead() {
    this.cache.notifications = this.cache.notifications.map(n => ({ ...n, isRead: true }));
    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  getStories(): Story[] {
    return this.cache.stories;
  }

  addStory(mediaUrl: string): Story {
    const me = this.cache.currentUser;
    const story: Story = {
      id: 'story_' + Date.now(),
      userId: me.id,
      userName: me.name,
      userAvatarUrl: me.avatarUrl,
      mediaUrl,
      mediaType: 'image',
      createdAt: new Date().toISOString()
    };
    this.cache.stories.push(story);
    this.sync();
    return story;
  }

  deletePost(postId: string) {
    this.cache.posts = this.cache.posts.filter(p => p.id !== postId);
    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  blockUser(userId: string) {
    const me = this.cache.currentUser;
    if (!me.blockedUsers) me.blockedUsers = [];
    if (!me.blockedUsers.includes(userId)) {
      me.blockedUsers.push(userId);
    }
    this.updateUserRecord(me);
    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  getReferralSettings(): ReferralSettings {
    return this.cache.referralSettings || {
      isEnabled: true,
      signupBonusStars: 10,
      purchaseCommissionPercent: 10
    };
  }

  updateReferralSettings(settings: ReferralSettings) {
    this.cache.referralSettings = { ...settings };
    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }
}

export const dbService = new StarConnectDatabaseService();
export const firebaseReady = firebaseConfig && !!firebaseConfig.projectId;
