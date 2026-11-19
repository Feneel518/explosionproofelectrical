import { siteFontVariables } from "@/components/site/fonts";

/** Wraps public pages in the site design system (see src/app/site-theme.css). */
export function SiteRoot({ children }: { children: React.ReactNode }) {
  return <div className={`${siteFontVariables} site-root`}>{children}</div>;
}
