'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/store/app-context';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const AuthScreen: React.FC = () => {
  const { loginUser, registerUser, loginGoogle, error, clearError } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [googleClientReady, setGoogleClientReady] = useState(false);

  // Password Recovery States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            setLoading(true);
            try {
              await loginGoogle(response.credential);
            } catch (err) {
              console.error("Google auth failed", err);
            } finally {
              setLoading(false);
            }
          }
        });
        setGoogleClientReady(true);
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [loginGoogle]);

  useEffect(() => {
    if (googleClientReady && window.google) {
      const btnContainer = document.getElementById('real-google-btn');
      if (btnContainer) {
        window.google.accounts.id.renderButton(
          btnContainer,
          { 
            theme: 'outline', 
            size: 'large', 
            shape: 'pill',
            width: 384
          }
        );
      }
    }
  }, [googleClientReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await loginUser({ email: formData.email, password: formData.password });
      } else {
        await registerUser(formData);
      }
    } catch (err) {
      // Error handled by context
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);
    setInfoMsg(null);
    try {
      const res = await api.post('/api/auth/forgot-password', { email: forgotEmail });
      setInfoMsg(res.data.message || 'Reset token generated! Check server logs if running locally.');
      setForgotStep('reset');
    } catch (err: any) {
      setLocalError(err.response?.data?.detail || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);
    setInfoMsg(null);
    try {
      const res = await api.post('/api/auth/reset-password', {
        token: resetToken.trim(),
        new_password: newPassword
      });
      setInfoMsg(res.data.message || 'Password updated successfully!');
      setTimeout(() => {
        setIsForgotPassword(false);
        setForgotStep('request');
        setForgotEmail('');
        setResetToken('');
        setNewPassword('');
        setInfoMsg(null);
        clearError();
      }, 2500);
    } catch (err: any) {
      setLocalError(err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      await loginUser({ email: 'dev@skillswap.ai', password: 'developer' });
    } catch (err) {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const gmail = window.prompt("Enter your Gmail address to sign in with Google:", "user@gmail.com");
    if (!gmail) return;
    
    if (!gmail.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const mockGoogleIdToken = `mock_email:${gmail.trim().toLowerCase()}`;
      await loginGoogle(mockGoogleIdToken);
    } catch (err) {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute top-10 flex flex-col items-center">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
          SkillSwap AI
        </h1>
        <p className="text-sm font-semibold text-slate-655 dark:text-slate-400 mt-2.5">Intelligent Peer-to-Peer Learning & Roadmaps</p>
      </div>

      <Card className="w-full max-w-md border border-slate-200/80 dark:border-slate-800/80 shadow-2xl bg-white/95 dark:bg-[#0c0d1b]/95 glass-card-glow" glow>
        {isForgotPassword ? (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold text-slate-805 dark:text-slate-200">
                {forgotStep === 'request' ? 'Password Recovery' : 'Reset Your Password'}
              </h3>
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setInfoMsg(null);
                  setLocalError(null);
                  clearError();
                }}
                className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer focus:outline-none"
              >
                Back to Login
              </button>
            </div>

            {infoMsg && (
              <div className="mb-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-lg">
                {infoMsg}
              </div>
            )}
            {localError && (
              <div className="mb-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                {localError}
              </div>
            )}

            {forgotStep === 'request' ? (
              <form onSubmit={handleRequestReset} className="flex flex-col gap-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-1">
                  Enter your registered email address. If the account exists, we will send a 6-digit OTP code to your inbox.
                </p>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g., alex@university.edu"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full py-2.5" disabled={loading}>
                  {loading ? 'Requesting OTP...' : 'Send OTP Code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-1">
                  Check your email inbox for the 6-digit OTP code and enter your new password below.
                </p>
                <Input
                  label="OTP Code"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Enter secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full py-2.5" disabled={loading}>
                  {loading ? 'Resetting Password...' : 'Update Password'}
                </Button>
              </form>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => { setIsLogin(true); clearError(); }}
                className={`pb-2 px-4 text-sm font-bold transition-all cursor-pointer focus:outline-none ${
                  isLogin
                    ? 'border-b-2 border-indigo-550 dark:border-indigo-500 text-indigo-650 dark:text-indigo-400'
                    : 'border-b-2 border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => { setIsLogin(false); clearError(); }}
                className={`pb-2 px-4 text-sm font-bold transition-all cursor-pointer focus:outline-none ${
                  !isLogin
                    ? 'border-b-2 border-indigo-550 dark:border-indigo-500 text-indigo-650 dark:text-indigo-400'
                    : 'border-b-2 border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                }`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {!isLogin && (
                <Input
                  label="Username"
                  type="text"
                  placeholder="e.g., alex_dev"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              )}

              <Input
                label="Email Address"
                type="email"
                placeholder="e.g., alex@university.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />

              <div className="w-full flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setForgotStep('request');
                        setInfoMsg(null);
                        setLocalError(null);
                        clearError();
                      }}
                      className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer focus:outline-none"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  placeholder=""
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 text-sm border rounded-lg focus:outline-none transition-all duration-200 glass-input"
                  required
                />
              </div>

              <Button type="submit" className="mt-2 w-full py-2.5" disabled={loading}>
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
                <span className="bg-white dark:bg-[#0c0d1b] px-3 text-slate-400 dark:text-slate-500">Or Continue With</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {googleClientReady ? (
                <div id="real-google-btn" className="w-full flex justify-center py-1"></div>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-2.5 px-6 text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-full flex items-center justify-center gap-3 cursor-pointer transition-all active:scale-[0.98] shadow-sm focus:outline-none"
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.33 0 3.33 2.69 1.432 6.618l3.834 3.147z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.273c0-.818-.073-1.609-.209-2.373H12v4.509h6.464a5.53 5.53 0 0 1-2.4 3.636l3.782 2.927c2.209-2.036 3.645-5.036 3.645-8.7z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.266 14.235A7.1 7.1 0 0 1 4.909 12c0-.79.136-1.555.357-2.264l-3.834-3.147A11.907 11.907 0 0 0 0 12c0 2.055.518 3.99 1.432 5.682l3.834-3.447z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.245 0 5.973-1.073 7.964-2.927l-3.782-2.927a7.1 7.1 0 0 1-4.182 1.182c-3.718 0-6.855-2.509-7.973-5.882L.19 16.89A11.905 11.905 0 0 0 12 24z"
                    />
                  </svg>
                  Sign in with Google
                </button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
export default AuthScreen;
