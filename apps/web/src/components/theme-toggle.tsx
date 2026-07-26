"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.dataset.dark === "true");
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.dataset.dark = "true";
    else delete document.documentElement.dataset.dark;
    localStorage.setItem("nami-dark", String(next));
  }
  return <button type="button" onClick={toggle} className="dark-toggle" aria-label="切换明暗模式" title="切换明暗模式">{dark ? "☀️" : "🌙"}</button>;
}
