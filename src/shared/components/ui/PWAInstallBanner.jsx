import React, { useEffect, useState } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';

const isIos = () => {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
};

const isInStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
};

const DISMISSED_KEY = 'pwa_install_dismissed';
const DISMISSED_EXPIRY_DAYS = 7;

const wasDismissedRecently = () => {
  const raw = localStorage.getItem(DISMISSED_KEY);
  if (!raw) return false;
  const { timestamp } = JSON.parse(raw);
  const days = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  return days < DISMISSED_EXPIRY_DAYS;
};

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIos, setShowIos] = useState(false);
  const [iosStep, setIosStep] = useState(1);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (wasDismissedRecently()) return;

    if (isIos()) {
      setShowIos(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroid(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify({ timestamp: Date.now() }));
    setShowAndroid(false);
    setShowIos(false);
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowAndroid(false);
    }
    setDeferredPrompt(null);
  };

  if (showAndroid) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:right-6 md:w-96">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/web-app-manifest-192x192.png"
                alt="Fortunato"
                className="w-10 h-10 rounded-xl shadow-lg"
              />
              <div>
                <p className="text-white font-bold text-sm leading-none">Fortunato SCADA</p>
                <p className="text-blue-100 text-xs mt-0.5">Instalá la app</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white transition-colors p-1"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-5 py-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Instalá Fortunato en tu dispositivo para acceso rápido sin abrir el navegador.
            </p>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                Funciona offline
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                Sin navegador
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                Pantalla completa
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Ahora no
              </button>
              <button
                onClick={handleAndroidInstall}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
              >
                <Download size={16} />
                Instalar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showIos) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-[100]">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/web-app-manifest-192x192.png"
                alt="Fortunato"
                className="w-10 h-10 rounded-xl shadow-lg"
              />
              <div>
                <p className="text-white font-bold text-sm leading-none">Fortunato SCADA</p>
                <p className="text-blue-100 text-xs mt-0.5">Agregá al inicio</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white transition-colors p-1"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-5 py-4">

            <div className="flex items-center justify-center gap-1 mb-4">
              {[1, 2].map(s => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    iosStep === s ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              ))}
            </div>

            {iosStep === 1 && (
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Share size={22} className="text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                  Paso 1 — Tocá el botón compartir
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  En Safari, tocá el ícono{' '}
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300 font-mono">
                    <Share size={10} /> compartir
                  </span>{' '}
                  en la barra inferior del navegador.
                </p>
              </div>
            )}

            {iosStep === 2 && (
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Plus size={22} className="text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                  Paso 2 — "Agregar a inicio"
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  En el menú que se abre, buscá{' '}
                  <strong className="text-slate-700 dark:text-slate-300">"Agregar a pantalla de inicio"</strong>{' '}
                  y confirmá. ¡Listo!
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-5">
              {iosStep === 1 ? (
                <>
                  <button
                    onClick={handleDismiss}
                    className="flex-1 py-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Ahora no
                  </button>
                  <button
                    onClick={() => setIosStep(2)}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/30"
                  >
                    Siguiente
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIosStep(1)}
                    className="flex-1 py-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/30"
                  >
                    ¡Listo!
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PWAInstallBanner;