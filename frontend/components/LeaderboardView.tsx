'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';

export const LeaderboardView: React.FC = () => {
  const [board, setBoard] = useState<{ top_mentors: any[], top_learners: any[] }>({
    top_mentors: [],
    top_learners: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const res = await api.get('/api/admin/leaderboard');
        setBoard(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBoard();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Global Leaderboard</h2>
        <p className="text-sm text-slate-655 dark:text-slate-350 font-medium">Review rankings of the most active mentors and verified fast learners in the community.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Mentors */}
          <Card className="border-slate-200 dark:border-slate-800">
            <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <span>🌟</span> Top Mentors (Ratings)
            </h3>
            <div className="flex flex-col gap-3">
              {board.top_mentors.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl gap-2.5 my-2">
                  <span className="text-2xl">⭐</span>
                  <div className="flex flex-col gap-1 max-w-[220px]">
                    <h4 className="text-[10px] font-bold text-slate-750 dark:text-slate-350 uppercase tracking-wider">No Rated Mentors</h4>
                    <p className="text-[9px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      No mentor ratings yet — be the first to teach a skill to earn reviews!
                    </p>
                  </div>
                </div>
              ) : (
                board.top_mentors.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/5 dark:bg-slate-900/25 border border-slate-200 dark:border-slate-850 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>
                      <Avatar src={m.avatar} alt={m.name || m.username} size="sm" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.name}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">@{m.username}</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400">
                      {m.score > 0 ? `⭐ ${m.score.toFixed(1)} / 5` : 'Active Mentor'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Top Learners */}
          <Card className="border-slate-200 dark:border-slate-800">
            <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <span>🎓</span> Fast Learners (Badges)
            </h3>
            <div className="flex flex-col gap-3">
              {board.top_learners.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl gap-2.5 my-2">
                  <span className="text-2xl">🏆</span>
                  <div className="flex flex-col gap-1 max-w-[220px]">
                    <h4 className="text-[10px] font-bold text-slate-750 dark:text-slate-350 uppercase tracking-wider">No Badges Awarded</h4>
                    <p className="text-[9px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Complete AI quiz assessments to earn verified badges and lead!
                    </p>
                  </div>
                </div>
              ) : (
                board.top_learners.map((l, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/5 dark:bg-slate-900/25 border border-slate-200 dark:border-slate-850 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>
                      <Avatar src={l.avatar} alt={l.name || l.username} size="sm" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{l.name}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">@{l.username}</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-purple-650 dark:text-purple-400">
                      {l.score > 0 ? `🥇 ${l.score} Badges` : 'Active Learner'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
export default LeaderboardView;
