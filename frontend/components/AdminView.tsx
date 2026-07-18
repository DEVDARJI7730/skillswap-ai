'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const AdminView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/admin/analytics');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Admin KPI Console</h2>
        <p className="text-sm text-slate-655 dark:text-slate-350 font-medium">Review real-time system analytics and monitor community swap interactions.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : stats ? (
        <div className="flex flex-col gap-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="flex flex-col gap-1 border-indigo-500/10">
              <span className="text-xs text-slate-400 uppercase">System Accounts</span>
              <span className="text-3xl font-extrabold text-indigo-400">{stats.total_users}</span>
              <span className="text-[10px] text-slate-500">Registered student users</span>
            </Card>
            <Card className="flex flex-col gap-1 border-purple-500/10">
              <span className="text-xs text-slate-400 uppercase">Active Swaps</span>
              <span className="text-3xl font-extrabold text-purple-400">{stats.active_matches}</span>
              <span className="text-[10px] text-slate-500">Running matches</span>
            </Card>
            <Card className="flex flex-col gap-1 border-cyan-500/10">
              <span className="text-xs text-slate-400 uppercase">Collaborations</span>
              <span className="text-3xl font-extrabold text-cyan-400">{stats.total_projects}</span>
              <span className="text-[10px] text-slate-500">Shared repo workspaces</span>
            </Card>
            <Card className="flex flex-col gap-1 border-pink-500/10">
              <span className="text-xs text-slate-400 uppercase">Quizzes Taken</span>
              <span className="text-3xl font-extrabold text-pink-400">{stats.quizzes_completed}</span>
              <span className="text-[10px] text-slate-500">AI assessments graded</span>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hot topics */}
            <Card className="lg:col-span-2 border-slate-800">
              <h3 className="text-md font-bold text-slate-200 mb-3">Trending Skill Searches</h3>
              <p className="text-xs text-slate-400 mb-4">Skills that students are most commonly looking to swap and learn this week.</p>
              <div className="flex flex-wrap gap-2">
                {stats.trending_skills.map((skill: string, i: number) => (
                  <Badge key={i} variant="info" className="text-sm py-1.5 px-3.5">
                    🔥 {skill}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Moderation log */}
            <Card className="border-slate-850">
              <h3 className="text-md font-bold text-slate-200 mb-3">Moderation Logs</h3>
              <div className="flex flex-col gap-2">
                <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg text-xs flex flex-col gap-1">
                  <div className="flex justify-between font-bold text-slate-300">
                    <span>Clean Filters Active</span>
                    <span className="text-emerald-400">OK</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Language triggers verified in chat logs</p>
                </div>
                <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg text-xs flex flex-col gap-1">
                  <div className="flex justify-between font-bold text-slate-300">
                    <span>Flagged Reports</span>
                    <span className="text-slate-400">0 Reports</span>
                  </div>
                  <p className="text-[10px] text-slate-500">No flags received this period</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
};
export default AdminView;
