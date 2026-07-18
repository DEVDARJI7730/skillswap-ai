'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export const RoadmapsView: React.FC = () => {
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<any | null>(null);
  const [goalInput, setGoalInput] = useState('');
  const [weeksInput, setWeeksInput] = useState(8);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchRoadmaps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/roadmaps/list');
      setRoadmaps(res.data);
      if (res.data.length > 0 && !activeRoadmap) {
        setActiveRoadmap(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;
    setGenerating(true);
    try {
      const res = await api.post('/api/roadmaps/generate', {
        goal: goalInput,
        weeks: weeksInput,
      });
      setGoalInput('');
      await fetchRoadmaps();
      setActiveRoadmap(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleWeek = async (roadmapId: string, weekNumber: number) => {
    try {
      const res = await api.put(`/api/roadmaps/${roadmapId}/toggle/${weekNumber}`);
      // Update local states
      if (activeRoadmap && activeRoadmap.id === roadmapId) {
        setActiveRoadmap({ ...activeRoadmap, weeks: res.data.weeks });
      }
      setRoadmaps(roadmaps.map((r) => r.id === roadmapId ? { ...r, weeks: res.data.weeks } : r));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">AI Learning Roadmaps</h2>
        <p className="text-sm text-slate-655 dark:text-slate-350 font-medium">Generate structured curriculum roadmaps powered by Gemini AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: roadmap manager and list */}
        <div className="flex flex-col gap-4">
          <Card className="border-indigo-500/10">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Create New Roadmap</h3>
            <form onSubmit={handleGenerate} className="flex flex-col gap-3">
              <Input
                label="Learning Goal"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Become Python Backend Engineer"
                required
              />
              <Input
                label="Duration (Weeks)"
                type="number"
                min={2}
                max={24}
                value={weeksInput}
                onChange={(e) => setWeeksInput(Number(e.target.value))}
                required
              />
              <Button type="submit" className="w-full" disabled={generating}>
                {generating ? 'Generating AI Roadmap...' : 'Generate Roadmap'}
              </Button>
            </form>
          </Card>

          <Card className="border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Your Roadmaps</h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
              </div>
            ) : roadmaps.length === 0 ? (
              <p className="text-xs text-slate-500 text-center">No roadmaps generated yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {roadmaps.map((r) => {
                  const completedWeeks = r.weeks.filter((w: any) => w.completed).length;
                  const progress = Math.round((completedWeeks / r.weeks.length) * 100);
                  
                  return (
                    <button
                      key={r.id}
                      onClick={() => setActiveRoadmap(r)}
                      className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                        activeRoadmap?.id === r.id
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold'
                          : 'bg-slate-100 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <h4 className="text-xs font-extrabold truncate">{r.goal}</h4>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-slate-600 dark:text-slate-450">
                        <span>{r.weeks.length} Weeks</span>
                        <span>{progress}% complete</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-indigo-500 h-full" style={{ width: `${progress}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right column: active roadmap details */}
        <div className="lg:col-span-2">
          {activeRoadmap ? (
            <Card className="flex flex-col gap-6 border-slate-200 dark:border-slate-800">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{activeRoadmap.goal}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Active Syllabus Program</p>
                </div>
                <Badge variant="info">AI Generated</Badge>
              </div>

              <div className="flex flex-col gap-4">
                {activeRoadmap.weeks.map((week: any) => (
                  <div
                    key={week.week_number}
                    className={`p-4 rounded-lg border transition-all ${
                      week.completed
                        ? 'bg-indigo-500/5 border-indigo-500/20 opacity-80'
                        : 'bg-slate-100/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded">
                          Week {week.week_number}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{week.topic}</h4>
                      </div>
                      <input
                        type="checkbox"
                        checked={week.completed}
                        onChange={() => handleToggleWeek(activeRoadmap.id, week.week_number)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    <div className="pl-2 border-l border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                      <div>
                        <span className="text-[10px] text-slate-655 dark:text-slate-450 uppercase font-semibold">Objectives</span>
                        <ul className="list-disc pl-5 text-xs text-slate-650 dark:text-slate-300 mt-1 flex flex-col gap-1">
                          {week.objectives.map((obj: string, i: number) => <li key={i}>{obj}</li>)}
                        </ul>
                      </div>

                      {week.resources && week.resources.length > 0 && (
                        <div className="mt-2">
                          <span className="text-[10px] text-slate-655 dark:text-slate-450 uppercase font-semibold">Suggested Study Resources</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {week.resources.map((res: string, i: number) => (
                              <span key={i} className="text-xs text-indigo-650 dark:text-indigo-300 bg-indigo-500/5 border border-indigo-500/15 px-2 py-1 rounded">
                                📖 {res}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl gap-4 my-2 min-h-[300px]">
              <div className="p-4 bg-indigo-500/5 text-indigo-500 dark:text-indigo-400 rounded-full border border-indigo-500/10">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="flex flex-col gap-1.5 max-w-sm">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">No Active Roadmap</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enter your learning target in the generator tool on the left to receive a custom weekly roadmap powered by Gemini AI.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
export default RoadmapsView;
