'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useApp } from '@/store/app-context';

export const QuizzesView: React.FC = () => {
  const { refreshUser } = useApp();
  const [topicInput, setTopicInput] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Dict<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) return;
    setGenerating(true);
    setResults(null);
    setAnswers({});
    try {
      const res = await api.post('/api/quizzes/generate', {
        topic: topicInput,
        difficulty: difficulty,
      });
      setActiveQuiz(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectAnswer = (qId: number, option: string) => {
    setAnswers({ ...answers, [String(qId)]: option });
  };

  const handleSubmit = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/api/quizzes/submit/${activeQuiz.id}`, {
        answers: answers,
      });
      setResults(res.data);
      setActiveQuiz(null);
      await refreshUser(); // Update badges on dashboard
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">AI Quiz Generator</h2>
        <p className="text-sm text-slate-655 dark:text-slate-350 font-medium">Test your mastery of any topic and earn skill verification badges.</p>
      </div>

      <div className="max-w-3xl mx-auto w-full">
        {!activeQuiz && !results && (
          <Card className="border-indigo-500/10">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Generate Custom Test</h3>
            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
              <Input
                label="Assessment Topic"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="React Hooks, Python OOP, SQL Join queries"
                required
              />
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Difficulty Level</label>
                <div className="flex gap-2">
                  {['Easy', 'Medium', 'Hard'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        difficulty === diff
                          ? 'bg-indigo-550/10 dark:bg-indigo-500/10 border-indigo-550 dark:border-indigo-500 text-indigo-650 dark:text-indigo-400'
                          : 'bg-slate-100 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full mt-2" disabled={generating}>
                {generating ? 'Formulating AI Questions...' : 'Start Assessment'}
              </Button>
            </form>
          </Card>
        )}

        {activeQuiz && (
          <Card className="flex flex-col gap-6 border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-md font-bold text-slate-200">{activeQuiz.title}</h3>
                <span className="text-[10px] text-slate-400">Topic: {activeQuiz.topic} ({activeQuiz.difficulty})</span>
              </div>
              <Badge variant="primary">5 Questions</Badge>
            </div>

            <div className="flex flex-col gap-6">
              {activeQuiz.questions.map((q: any) => (
                <div key={q.id} className="flex flex-col gap-3 p-4 rounded-lg bg-slate-900/30 border border-slate-800">
                  <h4 className="text-sm font-semibold text-slate-200">{q.id}. {q.question}</h4>
                  
                  {q.type === 'mcq' || q.type === 'boolean' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {q.options.map((opt: string, i: number) => {
                        const isSelected = answers[String(q.id)] === opt;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectAnswer(q.id, opt)}
                            className={`text-left p-3 text-xs rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400'
                                : 'bg-slate-850/40 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-2">
                      <Input
                        placeholder="Write your answer..."
                        value={answers[String(q.id)] || ''}
                        onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
              <Button variant="outline" onClick={() => setActiveQuiz(null)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Grading responses...' : 'Submit Answers'}
              </Button>
            </div>
          </Card>
        )}

        {results && (
          <Card className="flex flex-col gap-6 border-slate-800 glass-card-glow" glow>
            <div className="flex flex-col items-center justify-center text-center gap-2 pb-4 border-b border-slate-800">
              <span className={`text-5xl font-extrabold p-4 rounded-full ${
                results.score >= 80 ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
              }`}>
                {results.score}%
              </span>
              <h3 className="text-lg font-bold text-slate-200 mt-2">Assessment Results</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md">{results.feedback}</p>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              {results.certificate_issued && (
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/25 rounded-lg flex items-center gap-3">
                  <span className="text-3xl">🏅</span>
                  <div>
                    <h4 className="font-bold text-slate-100">Verification Certificate Issued!</h4>
                    <p className="text-slate-400">This badge has been added to your profile achievements and is viewable publicly.</p>
                  </div>
                </div>
              )}

              <div>
                <strong className="text-slate-300 block mb-1">RECOMMENDED STUDY STEPS</strong>
                <ul className="list-disc pl-5 text-slate-400 flex flex-col gap-1.5">
                  {results.suggested_next_steps?.map((step: string, i: number) => <li key={i}>{step}</li>)}
                </ul>
              </div>
            </div>

            <div className="flex justify-center border-t border-slate-800 pt-4">
              <Button onClick={() => setResults(null)}>Take Another Quiz</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
export default QuizzesView;
