import { Printer, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

export default function WidgetCard({ title, children, className, id, onPrint, onEmail, headerRight, style }) {
  const handlePrint = () => {
    if (onPrint) return onPrint();
    const el = document.getElementById(id);
    if (!el) return;
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:Inter,sans-serif;padding:24px;}</style></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  };

  const handleEmail = async () => {
    if (onEmail) return onEmail();
    const el = document.getElementById(id);
    if (!el) return;
    const user = await base44.auth.me();
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: title,
      body: el.innerHTML,
    });
    alert("Sent to your email!");
  };

  return (
    <div
      className={cn("backdrop-blur-sm border border-border shadow-sm overflow-hidden", className)}
      style={{
        backgroundColor: `hsl(var(--card) / var(--widget-opacity, 0.9))`,
        borderRadius: `var(--widget-radius, 12px)`,
        ...style,
      }}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-border relative z-20 bg-[hsl(var(--card)/var(--widget-opacity,0.9))]">
        <h3 className="font-semibold text-sm tracking-wide uppercase text-muted-foreground">{title}</h3>
        {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
      </div>
      <div id={id} className="p-5">
        {children}
      </div>
    </div>
  );
}