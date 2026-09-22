import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';

export default function AcceptTerms() {
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkTermsAccepted = async () => {
      try {
        const user = await base44.auth.me();
        if (user?.terms_accepted && user?.privacy_accepted) {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Failed to check terms acceptance:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkTermsAccepted();
  }, [navigate]);

  const handleContinue = async () => {
    if (!agreeTerms || !agreePrivacy) return;
    
    setIsLoading(true);
    try {
      // Disconnect Google connectors on first access
      const GOOGLE_CAL_ID = "69dd40c425113bd8c8dada08";
      const GOOGLE_TASKS_ID = "69dd389dc7cfad127e38e98d";
      
      try {
        await base44.connectors.disconnectAppUser(GOOGLE_CAL_ID);
      } catch (e) {
        // Ignore if not connected
      }
      
      try {
        await base44.connectors.disconnectAppUser(GOOGLE_TASKS_ID);
      } catch (e) {
        // Ignore if not connected
      }

      await base44.auth.updateMe({ terms_accepted: true, privacy_accepted: true });
      
      // Initialize default collage images for new user
      try {
        await base44.functions.invoke('initializeDefaultCollageImages', {});
      } catch (e) {
        console.error('Failed to initialize collage images:', e);
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to save acceptance:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="font-display text-3xl font-bold mb-8">Welcome to The Daily Dash</h1>
          <p className="text-muted-foreground mb-10">Please review and accept our Privacy Policy and Terms of Use to continue:</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Privacy Policy */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="font-display text-xl font-semibold mb-4">Privacy Policy</h2>
              <div className="prose prose-sm max-w-none space-y-4 text-foreground/80 text-sm max-h-64 overflow-y-auto mb-6">
                <section>
                  <h3 className="font-semibold text-foreground">Information We Collect</h3>
                  <p>We collect information you provide directly to us when you register for an account, including your name and email address. When you connect third-party services such as Google Calendar or Google Tasks, we access only the data necessary to provide our scheduling and task management features.</p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground">How We Use Your Information</h3>
                  <p>We use the information we collect to provide, maintain, and improve our services, including syncing your tasks and calendar events, sending daily reflections, and personalizing your experience.</p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground">Data Security</h3>
                  <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
                </section>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox checked={agreePrivacy} onCheckedChange={setAgreePrivacy} className="mt-1" />
                <span className="text-sm">I agree to the Privacy Policy</span>
              </label>
            </div>

            {/* Terms of Use */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="font-display text-xl font-semibold mb-4">Terms of Use</h2>
              <div className="prose prose-sm max-w-none space-y-4 text-foreground/80 text-sm max-h-64 overflow-y-auto mb-6">
                <section>
                  <h3 className="font-semibold text-foreground">Acceptance of Terms</h3>
                  <p>By accessing or using The Daily Dash, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our application.</p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground">Use of the Service</h3>
                  <p>The Daily Dash is a personal productivity application. You agree to use it only for lawful purposes and in a manner consistent with all applicable laws and regulations.</p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground">User Content</h3>
                  <p>You retain ownership of any content you create within The Daily Dash, including tasks, notes, and reflections. You grant us a limited license to store and display this content solely to provide you with the service.</p>
                </section>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox checked={agreeTerms} onCheckedChange={setAgreeTerms} className="mt-1" />
                <span className="text-sm">I agree to the Terms of Use</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="border-t border-border bg-card p-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {agreeTerms && agreePrivacy ? 'Ready to get started!' : 'Accept both policies to continue'}
          </p>
          <Button onClick={handleContinue} disabled={!agreeTerms || !agreePrivacy || isLoading}>
            {isLoading ? 'Loading...' : 'Continue to Dashboard'}
          </Button>
        </div>
      </div>
    </div>
  );
}