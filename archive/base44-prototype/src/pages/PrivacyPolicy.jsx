import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="font-display text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: April 9, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/80 leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">1. Introduction</h2>
            <p>Welcome to The Daily Dash ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our application.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">2. Information We Collect</h2>
            <p>We collect information you provide directly to us when you register for an account, including your name and email address. When you connect third-party services such as Google Calendar or Google Tasks, we access only the data necessary to provide our scheduling and task management features.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">3. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services, including syncing your tasks and calendar events, sending daily reflections, and personalizing your experience.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">4. Google API Data</h2>
            <p>Our use of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google API Services User Data Policy</a>, including the Limited Use requirements. We do not sell your Google data to third parties.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">5. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">6. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us. [Add your contact email here]</p>
          </section>
        </div>
      </div>
    </div>
  );
}