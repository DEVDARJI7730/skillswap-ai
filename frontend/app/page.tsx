'use client';

import React, { useState } from 'react';
import { useApp } from '@/store/app-context';
import { AuthScreen } from '@/components/AuthScreen';
import { DashboardView } from '@/components/DashboardView';
import { MatchesView } from '@/components/MatchesView';
import { RoadmapsView } from '@/components/RoadmapsView';
import { QuizzesView } from '@/components/QuizzesView';
import { ChatView } from '@/components/ChatView';
import { CollaborationView } from '@/components/CollaborationView';
import { ForumView } from '@/components/ForumView';
import { LeaderboardView } from '@/components/LeaderboardView';
import { AdminView } from '@/components/AdminView';

export default function Home() {
  const { user, loading, activeTab, setActiveTab, toggleTheme, theme, logoutUser } = useApp();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090a12] text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          <p className="text-xs text-slate-400 font-medium">Bootstrapping SkillSwap AI Workspace...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Auth Screen
  if (!user) {
    return <AuthScreen />;
  }

  // Define sidebar navigation items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'matches', label: 'Match Center' },
    { id: 'roadmaps', label: 'Roadmaps' },
    { id: 'quizzes', label: 'Quiz Center' },
    { id: 'chat', label: 'Real-time Chat' },
    { id: 'projects', label: 'Collaboration' },
    { id: 'forum', label: 'Peer Forums' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'admin', label: 'Admin KPIs', adminOnly: true },
  ];

  const renderMenuIcon = (id: string) => {
    switch (id) {
      case 'dashboard':
        return (
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'matches':
        return (
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'roadmaps':
        return (
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        );
      case 'quizzes':
        return (
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
          </svg>
        );
      case 'chat':
        return (
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'projects':
        return (
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        );
      case 'forum':
        return (
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'leaderboard':
        return (
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'admin':
        return (
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'matches':
        return <MatchesView />;
      case 'roadmaps':
        return <RoadmapsView />;
      case 'quizzes':
        return <QuizzesView />;
      case 'chat':
        return <ChatView />;
      case 'projects':
        return <CollaborationView />;
      case 'forum':
        return <ForumView />;
      case 'leaderboard':
        return <LeaderboardView />;
      case 'admin':
        return <AdminView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex text-slate-800 dark:text-slate-200 relative bg-slate-50 dark:bg-[#090a12] transition-colors duration-200">
      {/* Glow Backdrops */}
      <div className="animated-bg" />

      {/* Modern Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-card border-r border-slate-200 dark:border-slate-800 m-4 mr-0 rounded-xl overflow-hidden shrink-0 transition-colors duration-200">
        {/* Brand & Quick Actions */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              SkillSwap AI
            </h1>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold tracking-wider block uppercase mt-0.5">Dashboard Console</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/30 hover:bg-slate-200 dark:hover:bg-slate-850 rounded-lg flex items-center justify-center cursor-pointer transition-all active:scale-[0.98]"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.364l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={logoutUser}
              className="flex-1 py-2 px-3 text-xs font-bold border border-red-200 dark:border-red-600/20 bg-red-600/5 dark:bg-red-600/10 text-red-500 dark:text-red-400 hover:bg-red-200/50 dark:hover:bg-red-600/20 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
              title="Logout Session"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Menu list */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            if (item.adminOnly && user.role !== 'admin') return null;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/10 border-l-4 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/30'
                }`}
              >
                <span className={`transition-transform duration-200 ${isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400'}`}>
                  {renderMenuIcon(item.id)}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Standalone Logout footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={logoutUser}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold text-red-550 dark:text-red-400 hover:bg-red-500/5 dark:hover:bg-red-500/10 transition-all cursor-pointer focus:outline-none"
          >
            <svg className="w-4.5 h-4.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <header className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger menu toggle */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-655 dark:text-slate-300 focus:outline-none transition-colors"
                title="Toggle Navigation Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 to-indigo-650 dark:from-indigo-400 dark:to-indigo-500 bg-clip-text text-transparent">
                SkillSwap AI
              </span>
            </div>
            <div className="hidden md:block">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                {menuItems.find((m) => m.id === activeTab)?.label}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {user.role === 'admin' ? 'Root Admin' : 'Status: Active'}
            </span>
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)} 
                className="flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/30 hover:border-indigo-500 dark:hover:border-indigo-400 cursor-pointer transition-all active:scale-[0.98] group"
                title="View Profile Settings & Actions"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.profile?.avatar_url} alt="Profile" className="h-6 w-6 rounded-full object-cover" />
                <svg className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-550 dark:group-hover:text-indigo-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showProfileMenu && (
                <>
                  {/* Backdrop click listener to close menu */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  
                  {/* Dropdown Menu Container */}
                  <div className="absolute right-0 mt-2.5 w-60 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-[#090a12]/95 backdrop-blur-md shadow-xl p-4 flex flex-col gap-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User profile brief card header */}
                    <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <img src={user.profile?.avatar_url} alt="Avatar" className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-800" />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">{user.profile?.name || user.username}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">@{user.username}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Actions links list */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          setActiveTab('dashboard');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-indigo-650 dark:hover:text-indigo-400 flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <span>🏠</span> View Dashboard
                      </button>
                      
                      <button
                        onClick={() => {
                          setActiveTab('dashboard');
                          setShowProfileMenu(false);
                          // Smooth scroll to profile edit card
                          setTimeout(() => {
                            const elem = document.getElementById('profile-settings-card');
                            elem?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 100);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-indigo-650 dark:hover:text-indigo-400 flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <span>⚙️</span> Edit Profile Details
                      </button>

                      <button
                        onClick={() => {
                          toggleTheme();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-indigo-650 dark:hover:text-indigo-400 flex items-center justify-between gap-2 cursor-pointer transition-all"
                      >
                        <span className="flex items-center gap-2">
                          <span>{theme === 'dark' ? '☀️' : '🌙'}</span> Theme Mode
                        </span>
                        <span className="text-[9px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-extrabold uppercase">
                          {theme}
                        </span>
                      </button>
                    </div>

                    {/* Footer sign out button */}
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logoutUser();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/5 dark:hover:bg-red-500/10 flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Workspace Scroll */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Drawer Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-[#0c0d1b] border-r border-slate-200 dark:border-slate-800 p-6 shadow-2xl transition-all duration-300 ease-in-out transform">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 to-indigo-650 dark:from-indigo-400 dark:to-indigo-500 bg-clip-text text-transparent">
                SkillSwap AI
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 focus:outline-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
              {menuItems.map((item) => {
                if (item.adminOnly && user.role !== 'admin') return null;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600/10 border-l-4 border-indigo-550 text-indigo-650 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <span className={`transition-transform duration-200 ${isActive ? 'text-indigo-550 dark:text-indigo-400' : 'text-slate-400'}`}>
                      {renderMenuIcon(item.id)}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Standalone Logout footer in mobile drawer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logoutUser();
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold text-red-550 dark:text-red-400 hover:bg-red-500/5 dark:hover:bg-red-500/10 transition-all cursor-pointer focus:outline-none"
              >
                <svg className="w-4.5 h-4.5 text-red-550" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
