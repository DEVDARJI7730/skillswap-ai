'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

export const MatchesView: React.FC = () => {
  const [recs, setRecs] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const fetchMatchesData = async () => {
    setLoading(true);
    try {
      const recsRes = await api.get('/api/matches/recommendations');
      const matchesRes = await api.get('/api/matches/list');
      setRecs(recsRes.data);
      setMatches(matchesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchesData();
  }, []);

  const handleRequestSwap = async (userId: string) => {
    try {
      await api.post(`/api/matches/request/${userId}`);
      await fetchMatchesData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRespond = async (matchId: string, action: 'accept' | 'reject') => {
    try {
      const res = await api.post(`/api/matches/respond/${matchId}/${action}`);
      if (action === 'accept' && res.data.report) {
        setSelectedReport(res.data.report);
      }
      await fetchMatchesData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">AI Matching Engine</h2>
        <p className="text-sm text-slate-650 dark:text-slate-350 font-medium">Discover peers based on shared learning goals, taught skills, and timezone compatibility.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recommendations list */}
          <div id="matches-recs-column" className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200">Recommended Swap Partner</h3>
            {recs.length === 0 ? (
              <Card className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl gap-4 my-2">
                <div className="p-3 bg-indigo-500/5 text-indigo-500 dark:text-indigo-400 rounded-full border border-indigo-500/10">
                  <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1 max-w-sm">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Finding Matches</h4>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    No recommendations found yet. Update your skills to find compatible swap matches.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                {recs.map((rec) => (
                  <Card key={rec.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-slate-800">
                    <div className="flex items-start gap-4">
                      <Avatar src={rec.profile.avatar_url} alt={rec.username} size="md" />
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-200">{rec.profile.name}</h4>
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">@{rec.username}</span>
                        </div>
                        <p className="text-xs text-slate-400">{rec.profile.university || 'Independent Learner'}</p>
                        
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[10px] text-indigo-400 mr-1.5 flex items-center">Can Teach:</span>
                          {rec.profile.skills_teach.slice(0, 3).map((s: string, idx: number) => (
                            <Badge key={idx} variant="primary">{s}</Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] text-purple-400 mr-1.5 flex items-center">Wants to Learn:</span>
                          {rec.profile.skills_learn.slice(0, 3).map((s: string, idx: number) => (
                            <Badge key={idx} variant="secondary">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
                        {rec.compatibility_score}% Match
                      </span>
                      <Button onClick={() => handleRequestSwap(rec.id)} size="sm">
                        Request Swap
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Active / Pending Matches */}
          <div className="flex flex-col gap-4">
            <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200">Your Swaps</h3>
            {matches.length === 0 ? (
              <Card className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl gap-3 my-2">
                <div className="p-2 bg-indigo-500/5 text-indigo-500 dark:text-indigo-400 rounded-full border border-indigo-500/10">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <h4 className="text-[10px] font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">No Active Swaps</h4>
                  <p className="text-[9px] text-slate-650 dark:text-slate-400 max-w-[180px] leading-relaxed">
                    No swaps requested or accepted yet. Start connecting!
                  </p>
                  <button
                    onClick={() => {
                      const leftCol = document.getElementById('matches-recs-column');
                      if (leftCol) leftCol.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="mt-2 py-1.5 px-3 text-[10px] font-bold border border-indigo-500/25 bg-indigo-600/5 hover:bg-indigo-600/10 text-indigo-650 dark:text-indigo-400 rounded-lg cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Browse Peers →
                  </button>
                </div>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {matches.map((m) => {
                  const isReceiver = m.target_user.id !== m.user_2_id;
                  const isPending = m.status === 'pending';
                  
                  return (
                    <Card key={m.id} className="p-4 border-slate-800/80 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={m.target_user.profile.avatar_url} alt={m.target_user.username} size="sm" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-200 truncate">{m.target_user.profile.name}</h4>
                          <span className="text-[10px] text-slate-400">Status: {m.status}</span>
                        </div>
                        {m.status === 'accepted' && (
                          <Badge variant="success" className="cursor-pointer" onClick={() => setSelectedReport(m.matching_details)}>
                            Report
                          </Badge>
                        )}
                      </div>

                      {isPending && isReceiver ? (
                        <div className="flex gap-2">
                          <Button className="flex-1" size="sm" onClick={() => handleRespond(m.id, 'accept')}>
                            Accept
                          </Button>
                          <Button className="flex-1" size="sm" variant="outline" onClick={() => handleRespond(m.id, 'reject')}>
                            Decline
                          </Button>
                        </div>
                      ) : isPending ? (
                        <span className="text-[10px] text-slate-500 text-center block bg-slate-800/50 py-1.5 rounded">
                          Waiting for partner confirmation
                        </span>
                      ) : null}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compatibility Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <Card className="w-full max-w-xl flex flex-col gap-4 relative glass-card border-indigo-500/30">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              ✕
            </button>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-extrabold text-indigo-400 bg-indigo-500/10 p-3 rounded-full">
                {selectedReport.compatibility_score}%
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-200">AI Compatibility Report</h3>
                <p className="text-xs text-slate-400">Match score generated by Gemini AI</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-sm text-slate-300 overflow-y-auto max-h-[300px] pr-2">
              <div>
                <strong className="text-slate-100 text-xs block uppercase tracking-wider text-indigo-300">Reason for Match</strong>
                <p className="mt-1 text-slate-300 leading-relaxed text-xs">{selectedReport.reason}</p>
              </div>
              <div>
                <strong className="text-slate-100 text-xs block uppercase tracking-wider text-purple-300">Strengths</strong>
                <ul className="list-disc pl-5 mt-1 text-xs text-slate-300 flex flex-col gap-1">
                  {selectedReport.strengths.map((str: string, i: number) => <li key={i}>{str}</li>)}
                </ul>
              </div>
              <div>
                <strong className="text-slate-100 text-xs block uppercase tracking-wider text-pink-300">Challenges / Weaknesses</strong>
                <ul className="list-disc pl-5 mt-1 text-xs text-slate-300 flex flex-col gap-1">
                  {selectedReport.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                </ul>
              </div>
              <div>
                <strong className="text-slate-100 text-xs block uppercase tracking-wider text-cyan-300">Learning Suggestions</strong>
                <ul className="list-disc pl-5 mt-1 text-xs text-slate-300 flex flex-col gap-1">
                  {selectedReport.suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <Button onClick={() => setSelectedReport(null)} size="sm">Close Report</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
export default MatchesView;
