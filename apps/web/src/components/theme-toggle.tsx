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
  return <button type="button" onClick={toggle} className="dark-toggle" aria-label={dark ? "切换到浅色模式" : "切换到深色模式"} title={dark ? "切换到浅色模式" : "切换到深色模式"}>{dark ? "☀" : "☾"}</button>;
}
