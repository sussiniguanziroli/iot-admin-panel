import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Activity, Zap, Server, Shield, Smartphone, Globe, 
  BarChart3, Moon, Sun 
} from 'lucide-react';
import { translations } from '../utils/translations';

// --- MINI WIDGETS FOR LANDING PAGE ---
const LandingWidget = ({ title, value, unit, color, icon: Icon }) => (
  <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-700 transition-colors">
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-lg ${color === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
        <Icon size={20} />
      </div>
      <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
    </div>
    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">{title}</div>
    <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
      {value} <span className="text-sm text-slate-400 font-normal">{unit}</span>
    </div>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');
  const [isDark, setIsDark] = useState(false);
  const t = translations[lang];

  // Simulation State
  const [demoValues, setDemoValues] = useState({ temp: 45, power: 120, rpm: 1500 });

  // Theme Init
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      setIsDark(true);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setDemoValues({
        temp: (40 + Math.random() * 15).toFixed(1),
        power: Math.floor(100 + Math.random() * 50),
        rpm: Math.floor(1450 + Math.random() * 100)
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden transition-colors duration-300">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Activity size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white hidden sm:block">
              {t.nav_title}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Language Toggle */}
            <button 
              onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Globe size={18} />
              <span>{lang.toUpperCase()}</span>
            </button>

            <button
              onClick={() => navigate('/login')}
              className="rounded-lg bg-slate-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-slate-900 transition-colors hover:bg-slate-800 dark:hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              {t.nav_btn}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="relative pt-16 pb-24 lg:pt-32 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-100 dark:bg-emerald-900/20 rounded-full blur-3xl opacity-50"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            
            {/* TEXT COLUMN */}
            <div className="sm:text-center md:mx-auto md:max-w-2xl lg:col-span-6 lg:text-left">
              <div className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-sm font-medium text-blue-800 dark:text-blue-300">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
                {t.hero_badge}
              </div>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
                {t.hero_title}
                <span className="block text-blue-600 dark:text-blue-400">{t.hero_subtitle}</span>
              </h1>
              <p className="mt-3 text-base text-slate-500 dark:text-slate-400 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                {t.hero_desc}
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <button
                  onClick={() => navigate('/demo')}
                  className="inline-flex items-center rounded-xl bg-blue-600 hover:bg-blue-700 px-8 py-4 text-base font-bold text-white transition-all shadow-lg hover:shadow-blue-500/30 md:text-lg transform hover:-translate-y-1"
                >
                  {t.btn_demo}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>

            {/* INTERACTIVE WIDGETS COLUMN */}
            <div className="relative mt-12 lg:mt-0 lg:col-span-6">
              <div className="relative mx-auto w-full max-w-md lg:max-w-full">
                 <div className="relative rounded-2xl bg-slate-900 dark:bg-slate-800 shadow-2xl border border-slate-700 dark:border-slate-600 p-2 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                    <div className="bg-slate-800 dark:bg-slate-900 rounded-xl p-6 h-[400px] relative overflow-hidden transition-colors">
                        <div className="grid grid-cols-2 gap-4">
                            <LandingWidget title="Motor Temp" value={demoValues.temp} unit="°C" color="blue" icon={Activity} />
                            <LandingWidget title="Total Power" value={demoValues.power} unit="kW" color="emerald" icon={Zap} />
                            <div className="col-span-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 mt-2 transition-colors">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase">
                                        <BarChart3 size={16} /> RPM History
                                    </div>
                                    <div className="text-xl font-bold text-slate-800 dark:text-white">{demoValues.rpm} RPM</div>
                                </div>
                                <div className="flex items-end gap-2 h-24 justify-between">
                                    {[40, 60, 45, 70, 85, 60, 75, 50, 90, 65].map((h, i) => (
                                        <div key={i} className="w-full bg-blue-500 dark:bg-blue-600 rounded-t-sm opacity-80 transition-all duration-500" style={{ height: `${h + Math.random() * 20}%` }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <div className="bg-white dark:bg-slate-900 py-24 sm:py-32 transition-colors">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">{t.nav_title}</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {t.hero_subtitle}
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {[
                { icon: Zap, title: t.feat_realtime, desc: t.feat_realtime_desc },
                { icon: Server, title: t.feat_device, desc: t.feat_device_desc },
                { icon: Shield, title: t.feat_secure, desc: t.feat_secure_desc }
              ].map((feat, i) => (
                <div key={i} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900 dark:text-white">
                    <feat.icon className="h-5 w-5 flex-none text-blue-600 dark:text-blue-400" />
                    {feat.title}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600 dark:text-slate-400">
                    <p className="flex-auto">{feat.desc}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <footer className="bg-slate-900 dark:bg-black py-12 border-t border-slate-800 transition-colors">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <p className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} Fortunato.ctech. {t.footer_rights}
            </p>
            <div className="flex gap-6">
              <Globe className="h-5 w-5 text-slate-400 hover:text-white cursor-pointer" />
              <Smartphone className="h-5 w-5 text-slate-400 hover:text-white cursor-pointer" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;