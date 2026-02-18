import { useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_STORAGE_KEY = "kinewatch_pwa_prompt_dismissed_v1";

const isStandaloneMode = (): boolean =>
  window.matchMedia("(display-mode: standalone)").matches ||
  Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [hasWaited, setHasWaited] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const isIos = useMemo(
    () => /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()),
    []
  );

  const canInstall = Boolean(deferredPrompt) || isIos;

  useEffect(() => {
    setIsInstalled(isStandaloneMode());
    setDismissed(window.localStorage.getItem(DISMISS_STORAGE_KEY) === "1");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setHasWaited(true), 15000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      window.localStorage.removeItem(DISMISS_STORAGE_KEY);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (hasWaited && !dismissed && !isInstalled && canInstall) {
      setShowPrompt(true);
    }
  }, [canInstall, dismissed, hasWaited, isInstalled]);

  const closePrompt = () => {
    setShowPrompt(false);
    setDismissed(true);
    window.localStorage.setItem(DISMISS_STORAGE_KEY, "1");
  };

  const installFromPrompt = async () => {
    if (isIos) {
      setShowPrompt(false);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const installFromFloatingButton = async () => {
    if (isIos) {
      setShowPrompt(true);
      return;
    }

    await installFromPrompt();
  };

  if (isInstalled || !canInstall) {
    return null;
  }

  return (
    <>
      {showPrompt && (
        <div className="fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-sm rounded-2xl border border-border bg-card p-4 shadow-card animate-fade-in">
          <button
            onClick={closePrompt}
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-muted"
            aria-label="Fermer la fenêtre d'installation"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3 pr-8">
            <img
              src="/iconkinewatch.jpg"
              alt="KinéWatch"
              className="h-12 w-12 rounded-xl border border-border object-cover"
            />
            <div>
              <p className="font-display text-[16px] font-semibold text-foreground">
                Installer KinéWatch
              </p>
              <p className="mt-1 font-body text-[13px] leading-relaxed text-secondary">
                Installe l’app pour un meilleur confort mobile et un accès direct à ta veille.
              </p>
            </div>
          </div>

          {isIos && (
            <p className="mt-3 rounded-xl bg-muted px-3 py-2 font-body text-[12px] text-foreground">
              Sur iPhone/iPad: touche Partager puis Ajouter à l’écran d’accueil.
            </p>
          )}

          <button
            onClick={installFromPrompt}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-pill bg-primary px-4 py-2.5 font-body text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            {isIos ? "Voir comment installer" : "Installer l'app"}
          </button>
        </div>
      )}

      {!showPrompt && (
        <button
          onClick={installFromFloatingButton}
          className="fixed right-4 top-3 z-[65] inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-[#6B705C] text-white shadow-card transition-opacity hover:opacity-90"
          aria-label="Installer l'application KinéWatch"
        >
          <Download className="h-5 w-5" />
        </button>
      )}
    </>
  );
};

export default PwaInstallPrompt;
