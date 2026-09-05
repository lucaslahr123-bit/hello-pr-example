"use client";

import { useEffect } from "react";

/**
 * Registra o service worker do app shell. Silencioso em caso de falha
 * (ex.: navegador sem suporte) — a instalação como PWA é um bônus, não
 * um requisito para o app funcionar.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // sem suporte ou falha de registro — segue funcionando como site normal
      });
    }
  }, []);

  return null;
}
