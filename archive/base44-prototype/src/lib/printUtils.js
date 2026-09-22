import { renderToStaticMarkup } from "react-dom/server";
import { base44 } from "@/api/base44Client";

export function printComponent(title, component) {
  const html = renderToStaticMarkup(component);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(
    `<!DOCTYPE html><html><head><title>${title}</title>` +
    `<style>body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact;}` +
    `*{box-sizing:border-box;}.no-print{display:none !important;}</style></head>` +
    `<body>${html}</body></html>`
  );
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 300);
}

export async function emailComponent(subject, component) {
  const html = renderToStaticMarkup(component);
  const user = await base44.auth.me();
  await base44.integrations.Core.SendEmail({ to: user.email, subject, body: html });
  alert("Sent to your email!");
}