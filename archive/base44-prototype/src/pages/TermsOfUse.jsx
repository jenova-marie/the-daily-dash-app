import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="font-display text-4xl font-bold mb-2">Terms of Use</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: April 9, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/80 leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using The Daily Dash, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our application.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">2. Use of the Service</h2>
            <p>The Daily Dash is a personal productivity application. You agree to use it only for lawful purposes and in a manner consistent with all applicable laws and regulations. You are responsible for maintaining the security of your account credentials.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">3. Third-Party Integrations</h2>
            <p>Our service integrates with third-party platforms including Google. Your use of such integrations is subject to the respective third-party terms of service. We are not responsible for the practices of third-party services.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">4. User Content</h2>
            <p>You retain ownership of any content you create within The Daily Dash, including tasks, notes, and reflections. You grant us a limited license to store and display this content solely to provide you with the service.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">5. Limitation of Liability</h2>
            <p>The Daily Dash is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">6. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. We will notify users of significant changes. Continued use of the service after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">7. Contact</h2>
            <p>For questions regarding these Terms of Use, please contact us. [Add your contact email here]</p>
          </section>
        </div>
      </div>
    </div>
  );
}