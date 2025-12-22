import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Activity, Zap, Server, Shield, Smartphone, Globe } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleDemoClick = () => {
    console.log("Demo requested - Feature coming soon");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Activity size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Fortunato.ctech IOT dashboard
            </span>
          </div>
          <button
            onClick={handleLoginClick}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Access Platform
          </button>
        </div>
      </nav>

      <div className="relative overflow-hidden pt-16 pb-24 lg:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:mx-auto md:max-w-2xl lg:col-span-6 lg:text-left">
              <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2"></span>
                v2.0 System Online
              </div>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                Industrial IoT
                <span className="block text-blue-600">Monitoring & Control</span>
              </h1>
              <p className="mt-3 text-base text-slate-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Real-time telemetry, remote management, and advanced analytics for your industrial infrastructure. Powered by Fortunato.ctech.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <button
                  onClick={handleDemoClick}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 md:text-lg"
                >
                  Launch Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="relative mt-12 sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="relative block w-full overflow-hidden rounded-lg bg-slate-900 opacity-90">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-slate-100 font-semibold">System Status</div>
                      <div className="flex items-center text-green-400 text-sm">
                        <div className="h-2 w-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                        Operational
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
                        <div className="flex justify-between text-sm mb-2 text-slate-400">
                          <span>Server Load</span>
                          <span>42%</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-[42%]"></div>
                        </div>
                      </div>
                      <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
                        <div className="flex justify-between text-sm mb-2 text-slate-400">
                          <span>Active Nodes</span>
                          <span>128/128</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 w-full"></div>
                        </div>
                      </div>
                      <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
                        <div className="flex justify-between text-sm mb-2 text-slate-400">
                          <span>Network Latency</span>
                          <span>24ms</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 w-[15%]"></div>
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

      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Platform Capabilities</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to monitor your fleet
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Zap className="h-5 w-5 flex-none text-blue-600" />
                  Real-time Data
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Instant telemetry streaming via MQTT. Monitor voltage, current, temperature, and status indicators with sub-second latency.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Server className="h-5 w-5 flex-none text-blue-600" />
                  Device Management
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Centralized control for all your IoT nodes. Remote configuration, firmware updates, and connection status logging.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Shield className="h-5 w-5 flex-none text-blue-600" />
                  Secure Architecture
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Enterprise-grade security with encrypted communication, role-based access control, and comprehensive audit trails.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <footer className="bg-slate-900 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <p className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} Fortunato.ctech. All rights reserved.
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