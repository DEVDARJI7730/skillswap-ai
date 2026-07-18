'use client';

import React, { useState } from 'react';
import { useApp } from '@/store/app-context';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { api } from '@/lib/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const chartData = [
  { name: 'Week 1', learn: 4, teach: 2 },
  { name: 'Week 2', learn: 8, teach: 5 },
  { name: 'Week 3', learn: 12, teach: 8 },
  { name: 'Week 4', learn: 18, teach: 11 },
  { name: 'Week 5', learn: 24, teach: 18 },
];

export const DashboardView: React.FC = () => {
  const { user, refreshUser, setActiveTab } = useApp();
  const [profileForm, setProfileForm] = useState({
    name: user?.profile?.name || '',
    university: user?.profile?.university || '',
    course: user?.profile?.course || '',
    year: user?.profile?.year || '',
    country: user?.profile?.country || '',
    city: user?.profile?.city || '',
    bio: user?.profile?.bio || '',
    skills_teach: user?.profile?.skills_teach?.join(', ') || '',
    skills_learn: user?.profile?.skills_learn?.join(', ') || '',
    languages: user?.profile?.languages?.join(', ') || '',
    availability: user?.profile?.availability || '',
    learning_style: user?.profile?.learning_style || '',
    experience: user?.profile?.experience || '',
  });
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setSuccessMsg(false);
    try {
      const payload = {
        ...user?.profile,
        ...profileForm,
        skills_teach: profileForm.skills_teach.split(',').map((s: string) => s.trim()).filter(Boolean),
        skills_learn: profileForm.skills_learn.split(',').map((s: string) => s.trim()).filter(Boolean),
        languages: profileForm.languages.split(',').map((s: string) => s.trim()).filter(Boolean),
      };
      await api.put('/api/users/profile', payload);
      await refreshUser();
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <div className="flex items-center justify-between glass-card p-6 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border-indigo-500/25">
        <div className="flex items-center gap-4">
          <Avatar src={user?.profile?.avatar_url} alt={user?.username} size="lg" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Welcome, {user?.profile?.name || user?.username}!</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Manage your skills, track weekly learning targets and swap roadmaps.</p>
          </div>
        </div>
        <div className="hidden sm:flex gap-2">
          {user?.profile?.achievements?.slice(0, 3).map((badge: string, i: number) => (
            <Badge key={i} variant="info" className="py-1 px-3">🏆 {badge}</Badge>
          ))}
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Card 1: Learning Hours */}
        <Card className="flex flex-col justify-between border-slate-200 dark:border-indigo-500/10 relative overflow-hidden group min-h-[125px]">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Learning</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">24 hrs</span>
            </div>
            <span className="p-2 rounded-lg bg-indigo-500/5 text-indigo-500 dark:text-indigo-400 border border-indigo-500/10">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>↑ 15% this week</span>
          </div>
        </Card>

        {/* Card 2: Teaching Hours */}
        <Card className="flex flex-col justify-between border-slate-200 dark:border-purple-500/10 relative overflow-hidden group min-h-[125px]">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Teaching</span>
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400">18 hrs</span>
            </div>
            <span className="p-2 rounded-lg bg-purple-500/5 text-purple-500 dark:text-purple-400 border border-purple-500/10">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>↑ 8% this week</span>
          </div>
        </Card>

        {/* Card 3: Shared Projects */}
        <Card className="flex flex-col justify-between border-slate-200 dark:border-cyan-500/10 relative overflow-hidden group min-h-[125px]">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Projects</span>
              <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">3 Active</span>
            </div>
            <span className="p-2 rounded-lg bg-cyan-500/5 text-cyan-500 dark:text-cyan-400 border border-cyan-500/10">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>↑ 33% this week</span>
          </div>
        </Card>

        {/* Card 4: Certificates */}
        <Card className="flex flex-col justify-between border-slate-200 dark:border-pink-500/10 relative overflow-hidden group min-h-[125px]">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Certificates</span>
              <span className="text-2xl font-black text-pink-600 dark:text-pink-400">{user?.profile?.achievements?.length || 0} Badges</span>
            </div>
            <span className="p-2 rounded-lg bg-pink-500/5 text-pink-500 dark:text-pink-400 border border-pink-500/10">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </span>
          </div>
          {!(user?.profile?.achievements?.length) ? (
            <div className="mt-2 flex flex-col gap-1 w-full">
              <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                <span>2 quizzes to next tier</span>
                <span className="text-pink-500 font-extrabold">0%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-pink-500 h-full rounded-full transition-all duration-300" style={{ width: '10%' }}></div>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>↑ {user.profile.achievements.length} earned</span>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section */}
        <Card className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Learning & Teaching Metrics</h3>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                Learning
              </span>
              <span className="text-xs text-pink-500 dark:text-pink-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-pink-500"></span>
                Teaching
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-900/30 px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                Live Progress
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLearn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTeach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#111322', borderColor: '#334155', color: '#f8fafc' }} />
                <Area type="monotone" dataKey="learn" stroke="#6366f1" fillOpacity={1} fill="url(#colorLearn)" name="Learn Hours" />
                <Area type="monotone" dataKey="teach" stroke="#ec4899" fillOpacity={1} fill="url(#colorTeach)" name="Teach Hours" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Badges and achievements */}
        <Card className="flex flex-col gap-4 justify-between h-full">
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Badges & Certificates</h3>
            <div className="flex flex-col gap-3">
              {!(user?.profile?.achievements?.length) ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl gap-3.5">
                    <div className="p-3 bg-pink-500/5 text-pink-500 dark:text-pink-400 rounded-full border border-pink-500/10">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">No Verified Badges</h4>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-[200px]">
                        Complete AI-graded quizzes to earn verified badges for your profile.
                      </p>
                    </div>
                  </div>

                  {/* Gamified Next Target Stats */}
                  <div className="flex flex-col gap-3.5 p-4 bg-slate-100/50 dark:bg-slate-900/35 border border-slate-200 dark:border-slate-800 rounded-xl mt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider">Next Target</span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">60% Complete</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-lg">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="flex-1 flex flex-col gap-0.5">
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Python Programming</h4>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400">Achieve 80%+ on quiz to unlock</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                user?.profile?.achievements?.map((ach: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg">
                    <span className="text-2xl">🥇</span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{ach}</h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Verified by SkillSwap AI</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {!(user?.profile?.achievements?.length) && (
            <button
              onClick={() => setActiveTab('quizzes')}
              className="w-full mt-2 py-2.5 px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-indigo-600/10"
            >
              Take a Quiz →
            </button>
          )}
        </Card>
      </div>

      {/* Profile configuration */}
      <Card id="profile-settings-card" className="border-slate-200 dark:border-slate-855">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Configure Your Profile</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">Keep your university, bio, and skills list updated to improve the AI matching engine recommendations.</p>
        
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg">
            Profile saved successfully!
          </div>
        )}

        <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={profileForm.name}
            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            placeholder="Priya Nair"
            required
          />
          <Input
            label="University / College"
            value={profileForm.university}
            onChange={(e) => setProfileForm({ ...profileForm, university: e.target.value })}
            placeholder="VIT University"
          />
          <Input
            label="Course / Stream"
            value={profileForm.course}
            onChange={(e) => setProfileForm({ ...profileForm, course: e.target.value })}
            placeholder="Computer Science & Engineering"
          />
          <Input
            label="Year of Study"
            value={profileForm.year}
            onChange={(e) => setProfileForm({ ...profileForm, year: e.target.value })}
            placeholder="3rd Year"
          />
          <Input
            label="Skills I Can Teach (Comma Separated)"
            value={profileForm.skills_teach}
            onChange={(e) => setProfileForm({ ...profileForm, skills_teach: e.target.value })}
            placeholder="React, CSS, Figma"
          />
          <Input
            label="Skills I Want To Learn (Comma Separated)"
            value={profileForm.skills_learn}
            onChange={(e) => setProfileForm({ ...profileForm, skills_learn: e.target.value })}
            placeholder="Python, FastAPI, Docker"
          />
          <Input
            label="Languages Spoken (Comma Separated)"
            value={profileForm.languages}
            onChange={(e) => setProfileForm({ ...profileForm, languages: e.target.value })}
            placeholder="English, Hindi"
          />
          <Input
            label="Availability"
            value={profileForm.availability}
            onChange={(e) => setProfileForm({ ...profileForm, availability: e.target.value })}
            placeholder="Weekends, 5-8 hrs/week"
          />
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Profile Bio</label>
            <textarea
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              placeholder="Tell other students about yourself, your career goals, and your passion."
              className="w-full min-h-[100px] px-4 py-2 text-sm border rounded-lg focus:outline-none transition-all duration-200 glass-input"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={updating}>
              {updating ? 'Saving...' : 'Save Profile Details'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
export default DashboardView;
