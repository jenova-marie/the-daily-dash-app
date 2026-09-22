import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CalendarDays, CheckSquare, MessageSquare, Shield, Zap, Eye, UtensilsCrossed, Home } from "lucide-react";

const features = [
  { icon: CalendarDays, title: "Smart Scheduling", desc: "Sync with Google Calendar, manage daily schedules, and organize time-blocked activities in one place." },
  { icon: CheckSquare, title: "Task Management", desc: "Create, organize, and track recurring or one-time tasks with priorities, due dates, and category labels." },
  { icon: Home, title: "Chore Manager", desc: "Assign household chores to family members, set frequencies, and track completion — with AI-generated chore ideas tailored to age and room." },
  { icon: UtensilsCrossed, title: "AI Meal Planning", desc: "Generate age-appropriate meal ideas for Breakfast, Lunch, Dinner, or Snacks — perfect for kids ages 3 and up through adults." },
  { icon: Eye, title: "Vision Board", desc: "Build your wellness vision with health pillar tracking, daily evaluations, slideshows, and progress reviews." },
  { icon: Zap, title: "Google Integration", desc: "Seamlessly sync Google Calendar, Google Tasks, and Google Drive for unified productivity." },
  { icon: MessageSquare, title: "Daily Reflection", desc: "Start each day with an inspiring AI-generated quote, personal affirmations, and vision-focused slideshows." },
  { icon: Shield, title: "Private & Secure", desc: "Your data is yours. We take privacy seriously and keep your information safe with encrypted storage." },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-border">
        <span className="font-display text-2xl font-bold text-primary">The Daily Dash</span>
        <Button onClick={() => navigate('/auth')} size="sm">Sign In</Button>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 md:py-36 max-w-3xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Your personal command center</span>
        <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6">
          Organize your day.<br />Master your life.
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-xl">
          The Daily Dash brings your schedule, tasks, goals, and reflections into one beautiful, distraction-free space.
        </p>
        <Button size="lg" onClick={handleGetStarted} className="px-10 py-6 text-base">
          Get Started — It's Free
        </Button>
      </section>

      {/* Features */}
      <section className="bg-muted/30 border-y border-border py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-12">Everything you need in one place</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-xl p-6 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <h2 className="font-display text-3xl font-bold mb-4">Ready to take control of your day?</h2>
        <p className="text-muted-foreground mb-8">Join The Daily Dash and start building better daily habits.</p>
        <Button size="lg" onClick={handleGetStarted} className="px-10">Start Now</Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-xs text-muted-foreground mt-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <span>© {new Date().getFullYear()} The Daily Dash. All rights reserved.</span>
          <span className="hidden sm:inline">·</span>
          <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link to="/terms-of-use" className="hover:text-foreground transition-colors">Terms of Use</Link>
        </div>
      </footer>
    </div>
  );
}