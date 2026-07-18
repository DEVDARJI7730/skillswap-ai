'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export const ForumView: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Ask Question Form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Answer Form
  const [ansContent, setAnsContent] = useState('');
  const [answering, setAnswering] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/forum/list');
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setPublishing(true);
    try {
      const parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      await api.post('/api/forum/ask', { title, content, tags: parsedTags });
      setTitle('');
      setContent('');
      setTags('');
      await fetchPosts();
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  const handleSelectPost = async (postId: string) => {
    try {
      const res = await api.get(`/api/forum/${postId}`);
      setSelectedPost(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ansContent.trim() || !selectedPost) return;
    setAnswering(true);
    try {
      await api.post(`/api/forum/${selectedPost.id}/answer`, { content: ansContent });
      setAnsContent('');
      await handleSelectPost(selectedPost.id);
      await fetchPosts();
    } catch (err) {
      console.error(err);
    } finally {
      setAnswering(false);
    }
  };

  const handleVote = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/api/forum/${postId}/vote`);
      await fetchPosts();
      if (selectedPost && selectedPost.id === postId) {
        await handleSelectPost(postId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Discussion Forum</h2>
        <p className="text-sm text-slate-655 dark:text-slate-350 font-medium">Ask questions, share wisdom, and earn Community badges from peer upvotes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Ask thread and list */}
        <div className="flex flex-col gap-4">
          <Card className="border-indigo-500/10">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Publish Discussion</h3>
            <form onSubmit={handleAsk} className="flex flex-col gap-3">
              <Input
                label="Topic Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="How to deploy FastAPI to Render?"
                required
              />
              <Input
                label="Tags (Comma Separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="fastapi, render, deployment"
              />
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Context Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="I am trying to run Render builds but connection drops..."
                  className="w-full min-h-[100px] px-4 py-2 text-xs border rounded-lg focus:outline-none transition-all duration-200 glass-input"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={publishing}>
                {publishing ? 'Publishing...' : 'Ask Community'}
              </Button>
            </form>
          </Card>

          <Card className="border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 font-semibold uppercase">Feed</h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
              </div>
            ) : posts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center">No discussion threads found.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {posts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => handleSelectPost(post.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer flex justify-between items-start ${
                      selectedPost?.id === post.id
                        ? 'bg-indigo-600/10 border-indigo-500 text-slate-100'
                        : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                      <h4 className="text-xs font-bold truncate text-slate-200">{post.title}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {post.tags.slice(0, 2).map((t: string, i: number) => (
                          <Badge key={i} variant="secondary" className="px-1.5 py-0">#{t}</Badge>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleVote(post.id, e)}
                      className="ml-2 py-1 px-2.5 bg-slate-850 hover:bg-indigo-600/20 text-[10px] rounded-lg border border-slate-800 flex flex-col items-center gap-0.5 text-indigo-300 font-bold transition-all"
                    >
                      ▲ <span>{post.votes?.length || 0}</span>
                    </button>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Detailed Thread */}
        <div className="lg:col-span-2">
          {selectedPost ? (
            <div className="flex flex-col gap-4">
              <Card className="border-slate-800">
                <div className="flex items-start justify-between gap-4 border-b border-slate-850 pb-3">
                  <div>
                    <h3 className="text-md font-bold text-slate-200">{selectedPost.title}</h3>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="text-[10px] text-slate-400">Asked by @{selectedPost.author?.username}</span>
                      <span className="text-[10px] text-slate-500">• {new Date(selectedPost.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleVote(selectedPost.id, e)}
                    className="py-1 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs rounded-lg border border-indigo-500/20 text-indigo-400 font-bold flex items-center gap-1.5 transition-all"
                  >
                    ▲ Upvote ({selectedPost.votes?.length || 0})
                  </button>
                </div>

                <p className="text-xs text-slate-300 mt-4 leading-relaxed whitespace-pre-line bg-slate-900/20 p-4 rounded-lg border border-slate-850">
                  {selectedPost.content}
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedPost.tags.map((t: string, i: number) => (
                    <Badge key={i} variant="primary">#{t}</Badge>
                  ))}
                </div>
              </Card>

              {/* Answers list */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Answers ({selectedPost.answers?.length || 0})</h4>
                {selectedPost.answers.length === 0 ? (
                  <Card className="p-4 text-center text-slate-500 text-xs border-dashed">
                    No replies yet. Be the first to advise!
                  </Card>
                ) : (
                  selectedPost.answers.map((ans: any) => (
                    <Card key={ans.id} className="p-4 border-slate-850 bg-slate-900/10">
                      <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-2">
                        <span className="text-[10px] text-slate-400 font-semibold">@{ans.author?.username || 'member'}</span>
                        <span className="text-[9px] text-slate-500">{new Date(ans.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{ans.content}</p>
                    </Card>
                  ))
                )}
              </div>

              {/* Write Answer Form */}
              <Card className="border-slate-800">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Your Answer</h4>
                <form onSubmit={handleAnswerSubmit} className="flex flex-col gap-3">
                  <textarea
                    value={ansContent}
                    onChange={(e) => setAnsContent(e.target.value)}
                    placeholder="Write a clear response to help this peer..."
                    className="w-full min-h-[100px] px-4 py-2 text-xs border rounded-lg focus:outline-none transition-all duration-200 glass-input"
                    required
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={answering}>
                      {answering ? 'Posting...' : 'Post Answer'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl gap-4 my-2 min-h-[300px]">
              <div className="p-4 bg-indigo-500/5 text-indigo-500 dark:text-indigo-400 rounded-full border border-indigo-500/10">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex flex-col gap-1.5 max-w-sm">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">No Selected Thread</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Select a discussion thread from the Feed to review replies or write your answer to help a peer.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
export default ForumView;
