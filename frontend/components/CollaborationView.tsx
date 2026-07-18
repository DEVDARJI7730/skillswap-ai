'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export const CollaborationView: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Project creation fields
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Task creation fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/projects/list');
      setProjects(res.data);
      if (res.data.length > 0 && !activeProject) {
        handleSelectProject(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSelectProject = async (projId: string) => {
    try {
      const res = await api.get(`/api/projects/${projId}`);
      setActiveProject(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      await api.post('/api/projects/create', { title, description: desc });
      setTitle('');
      setDesc('');
      await fetchProjects();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !activeProject) return;
    try {
      await api.post(`/api/projects/${activeProject.id}/tasks`, {
        title: taskTitle,
        description: taskDesc,
        deadline: taskDeadline,
      });
      setTaskTitle('');
      setTaskDesc('');
      setTaskDeadline('');
      await handleSelectProject(activeProject.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, nextStatus: string) => {
    if (!activeProject) return;
    try {
      await api.put(`/api/projects/${activeProject.id}/tasks/${taskId}`, {
        status: nextStatus,
      });
      await handleSelectProject(activeProject.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Project Collaboration</h2>
        <p className="text-sm text-slate-655 dark:text-slate-350 font-medium">Launch joint portfolios and complete real-world coding benchmarks together.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side: project creation and lists */}
        <div className="flex flex-col gap-4">
          <Card className="border-indigo-500/10">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Create Shared Project</h3>
            <form onSubmit={handleCreateProject} className="flex flex-col gap-3">
              <Input
                label="Project Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E-Commerce API Service"
                required
              />
              <Input
                label="Brief Description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Building modular endpoints..."
              />
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? 'Creating...' : 'Initialize Workspace'}
              </Button>
            </form>
          </Card>

          <Card className="border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Active Workspace</h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
              </div>
            ) : projects.length === 0 ? (
              <p className="text-xs text-slate-500 text-center">No projects created yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {projects.map((p) => {
                  const isActive = activeProject?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProject(p.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer flex justify-between items-center ${
                        isActive
                          ? 'bg-indigo-600/10 border-indigo-500 text-slate-100'
                          : 'bg-slate-800/30 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold truncate">{p.title}</h4>
                        <span className="text-[10px] text-slate-400 block mt-1">{p.progress}% completed</span>
                      </div>
                      <Badge variant="info">{p.progress}%</Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right side: tasks board */}
        <div className="lg:col-span-2">
          {activeProject ? (
            <div className="flex flex-col gap-6">
              {/* Project Headers */}
              <Card className="border-slate-800">
                <h3 className="text-lg font-bold text-slate-200">{activeProject.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{activeProject.description}</p>
                
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Completion Metrics</span>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-indigo-500 h-full" style={{ width: `${activeProject.progress}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-indigo-400">{activeProject.progress}%</span>
                </div>
              </Card>

              {/* Tasks manager columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Column pending */}
                <Card className="p-4 border-slate-850 bg-slate-900/10">
                  <h4 className="text-xs font-bold text-slate-300 mb-3 border-b border-slate-800 pb-2">Pending</h4>
                  <div className="flex flex-col gap-2">
                    {activeProject.tasks.filter((t: any) => t.status === 'pending').map((t: any) => (
                      <div key={t.id} className="p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg flex flex-col gap-1.5">
                        <h5 className="text-xs font-semibold text-slate-200">{t.title}</h5>
                        <p className="text-[10px] text-slate-400">{t.description}</p>
                        <Button size="sm" className="mt-1" onClick={() => handleUpdateTaskStatus(t.id, 'in_progress')}>
                          Start
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Column in progress */}
                <Card className="p-4 border-slate-850 bg-slate-900/10">
                  <h4 className="text-xs font-bold text-slate-300 mb-3 border-b border-slate-800 pb-2">In Progress</h4>
                  <div className="flex flex-col gap-2">
                    {activeProject.tasks.filter((t: any) => t.status === 'in_progress').map((t: any) => (
                      <div key={t.id} className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg flex flex-col gap-1.5">
                        <h5 className="text-xs font-semibold text-indigo-300">{t.title}</h5>
                        <p className="text-[10px] text-slate-400">{t.description}</p>
                        <Button size="sm" className="mt-1" onClick={() => handleUpdateTaskStatus(t.id, 'completed')}>
                          Complete
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Column completed */}
                <Card className="p-4 border-slate-850 bg-slate-900/10">
                  <h4 className="text-xs font-bold text-slate-300 mb-3 border-b border-slate-800 pb-2">Completed</h4>
                  <div className="flex flex-col gap-2 opacity-70">
                    {activeProject.tasks.filter((t: any) => t.status === 'completed').map((t: any) => (
                      <div key={t.id} className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex flex-col gap-1.5">
                        <h5 className="text-xs font-semibold text-emerald-300 line-through">{t.title}</h5>
                        <p className="text-[10px] text-slate-400">{t.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Add task block */}
              <Card className="border-slate-800">
                <h4 className="text-sm font-semibold text-slate-200 mb-3">Add Shared Task</h4>
                <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Task Title"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Integrate JWT verification middleware"
                    required
                  />
                  <Input
                    label="Deadline"
                    type="date"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Task Description"
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      placeholder="Add middleware check on private endpoints..."
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <Button type="submit">Add Task</Button>
                  </div>
                </form>
              </Card>
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl gap-4 my-2 min-h-[300px]">
              <div className="p-4 bg-indigo-500/5 text-indigo-500 dark:text-indigo-400 rounded-full border border-indigo-500/10">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex flex-col gap-1.5 max-w-sm">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">No Active Project</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Select or configure a shared collaboration space on the left to start assigning tasks and building projects.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
export default CollaborationView;
