"use client";

import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import styles from "./blog.module.css";

export type ArticleSection = {
  id: string;
  title: string;
};

export function ArticleTableOfContents({ sections }: { sections: ArticleSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const targets = sections
      .map((section) => document.getElementById(section.id))
      .filter((target): target is HTMLElement => Boolean(target));

    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: 0 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav className={styles.toc} aria-label="Article sections">
      <div className={styles.tocHeader}>
        <span>On this page</span>
        <ArrowDown size={14} aria-hidden="true" />
      </div>
      <ol>
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={activeId === section.id ? styles.tocActive : undefined}
              aria-current={activeId === section.id ? "location" : undefined}
              onClick={() => setActiveId(section.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
