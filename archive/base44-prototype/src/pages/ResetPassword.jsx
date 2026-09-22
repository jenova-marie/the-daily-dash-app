import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check query string first, then hash params (some email clients modify URLs)
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
    const token = params.get('token') || params.get('reset_token') || hashParams.get('token') || hashParams.get('reset_token');
    if (token) {
      setResetToken(token);
    } else {
      setError('Invalid or missing reset token. Please request a new password reset link from Settings or the login page.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword: password });
      setSuccess('Password reset successfully! Redirecting to sign in...');
      setTimeout(() => navigate('/auth'), 2500);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">The Daily Dash</h1>
          <p className="text-muted-foreground">Set your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-lg p-6">
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

          {!success && (
            <>
              <div>
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || !resetToken}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading || !resetToken}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !resetToken}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </>
          )}

          <div className="text-center text-sm space-y-1">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="text-primary hover:underline block w-full"
            >
              Back to sign in
            </button>
            {!resetToken && (
              <button
                type="button"
                onClick={() => navigate('/auth?mode=forgot')}
                className="text-xs text-muted-foreground hover:text-primary hover:underline"
              >
                Request a new reset link
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}