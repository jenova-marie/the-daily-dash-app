import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Calendar, CheckSquare, User } from 'lucide-react';

const GOOGLE_CALENDAR_CONNECTOR_ID = "69dd6fdb02883eefc6106a2a";
const GOOGLE_TASKS_CONNECTOR_ID = "69dd7015f461b3b0db0317b2";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'verify', or 'forgot'
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [pendingSignupData, setPendingSignupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const navigate = useNavigate();
  const { checkAppState } = useAuth();

  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => {
      if (authed) navigate('/dashboard');
    });
  }, [navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'forgot') {
      if (!email) { setError('Please enter your email address'); return; }
      setIsLoading(true);
      await base44.auth.resetPasswordRequest(email);
      setSuccess('Password reset link sent! Check your email.');
      setIsLoading(false);
      return;
    }

    if (mode === 'signup') {
      if (!email || !password || !fullName) { setError('Please fill in all fields'); return; }
      // Show the integration choice dialog instead of signing up immediately
      setPendingSignupData({ email, password, fullName });
      setShowSignupDialog(true);
      return;
    }

    // Login flow
    if (!email || !password) { setError('Please enter email and password'); return; }
    setIsLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      await checkAppState();
      navigate('/accept-terms');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const completeSignup = async (connectGoogle) => {
    setShowSignupDialog(false);
    setIsLoading(true);
    setError('');
    try {
      await base44.auth.register({
        email: pendingSignupData.email,
        password: pendingSignupData.password,
        full_name: pendingSignupData.fullName,
      });
      
      // Switch to verification mode
      setMode('verify');
      setEmail(pendingSignupData.email);
      setPendingSignupData({ ...pendingSignupData, connectGoogle });
      setVerificationCode('');
      setSuccess('Check your email for a verification code');
    } catch (err) {
      setError(err.message || 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    if (!verificationCode) { setError('Please enter verification code'); return; }
    setIsLoading(true);
    setError('');
    try {
      await base44.auth.verifyOtp({ email, otpCode: verificationCode });
      
      // Now log in the user
      await base44.auth.loginViaEmailPassword(pendingSignupData.email, pendingSignupData.password);
      await checkAppState();

      if (pendingSignupData.connectGoogle) {
        // Open Google Calendar OAuth popup
        const calUrl = await base44.connectors.connectAppUser(GOOGLE_CALENDAR_CONNECTOR_ID);
        const calPopup = window.open(calUrl, "_blank", "width=500,height=700");

        // Wait for calendar popup to close, then open Tasks popup
        await new Promise((resolve) => {
          const timer = setInterval(() => {
            if (!calPopup || calPopup.closed) {
              clearInterval(timer);
              resolve();
            }
          }, 500);
        });

        const tasksUrl = await base44.connectors.connectAppUser(GOOGLE_TASKS_CONNECTOR_ID);
        window.open(tasksUrl, "_blank", "width=500,height=700");
      }

      navigate('/accept-terms');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await base44.auth.resendOtp(pendingSignupData.email);
      setSuccess('Verification code resent to your email');
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">The Daily Dash</h1>
          <p className="text-muted-foreground">
            {mode === 'login' ? 'Sign in to your account' : mode === 'signup' ? 'Create your account' : mode === 'verify' ? 'Verify your email' : 'Reset your password'}
          </p>
        </div>

        <form onSubmit={mode === 'verify' ? handleVerification : handleAuth} className="space-y-4 bg-card border border-border rounded-lg p-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-600">
              {success}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {mode === 'verify' && (
            <div>
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter code from your email"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}

          {mode !== 'forgot' && mode !== 'verify' && (
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Loading...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : mode === 'verify' ? 'Verify Email' : 'Send Reset Link'}
          </Button>

          {mode === 'verify' && (
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading}
              className="w-full text-xs text-primary hover:underline"
            >
              Didn't receive code? Resend
            </button>
          )}

          <div className="text-center text-sm">
            {mode === 'verify' ? (
              <button
                type="button"
                onClick={() => { setMode('login'); setVerificationCode(''); setError(''); setSuccess(''); setPendingSignupData(null); }}
                className="text-primary hover:underline"
              >
                Back to sign in
              </button>
            ) : mode === 'forgot' ? (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className="text-primary hover:underline"
              >
                Back to sign in
              </button>
            ) : (
              <>
                <span className="text-muted-foreground">
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                </span>
                <button
                  type="button"
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
                  className="text-primary hover:underline"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Sign-up integration choice dialog */}
      <Dialog open={showSignupDialog} onOpenChange={(open) => { if (!open && !isLoading) setShowSignupDialog(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>How would you like to get started?</DialogTitle>
            <DialogDescription>
              You can connect your Google account now, or set it up later in Settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {/* Option 1: Connect Google */}
            <button
              onClick={() => completeSignup(true)}
              className="w-full text-left p-4 rounded-lg border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="flex gap-1 mt-0.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  <CheckSquare className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Connect Google Account</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sync Google Calendar events and Google Tasks automatically on app load.
                  </p>
                </div>
              </div>
            </button>

            {/* Option 2: Independent */}
            <button
              onClick={() => completeSignup(false)}
              className="w-full text-left p-4 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-secondary/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Use Independently</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage tasks, schedules, and goals without connecting a Google account.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-1">
            You can always connect Google later in <span className="font-medium">Settings → Integrations</span>.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}