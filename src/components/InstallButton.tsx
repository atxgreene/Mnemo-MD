import { useEffect, useState } from "react";

/**
 * In-app install affordance for the PWA.
 *
 * On Chromium browsers we capture the `beforeinstallprompt` event and trigger
 * the native install flow on click. iOS Safari doesn't fire that event, so we
 * surface the manual "Add to Home Screen" instructions instead. When the app
 * is already installed (running standalone) the button renders nothing.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari exposes this non-standard flag when launched from the home screen.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallButton({ variant = "sidebar" }: { variant?: "sidebar" | "settings" }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // stash it so we can trigger the prompt on our own button
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return variant === "settings" ? (
      <p className="text-sm text-emerald-300">✓ Installed — you're running the standalone app.</p>
    ) : null;
  }

  const iosFallback = isIos() && !deferred;

  // No native prompt available and not iOS: only show guidance in Settings.
  if (!deferred && !iosFallback) {
    return variant === "settings" ? (
      <p className="text-sm text-slate-400">
        Use your browser's <b>Install</b> / <b>Add to Home Screen</b> option to install Mnemo Med as an app.
      </p>
    ) : null;
  }

  const triggerNative = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const btnClass = variant === "settings" ? "btn btn-primary btn-sm" : "btn btn-primary btn-sm w-full";

  if (iosFallback) {
    return (
      <div className={variant === "sidebar" ? "px-1" : ""}>
        <button className={btnClass} onClick={() => setShowIosHint((s) => !s)}>
          ⤓ Install app
        </button>
        {showIosHint && (
          <p className="mt-2 text-[11px] leading-snug text-slate-400">
            In Safari, tap the <b>Share</b> icon, then <b>Add to Home Screen</b>.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={variant === "sidebar" ? "px-1" : ""}>
      <button className={btnClass} onClick={triggerNative}>
        ⤓ Install app
      </button>
    </div>
  );
}
