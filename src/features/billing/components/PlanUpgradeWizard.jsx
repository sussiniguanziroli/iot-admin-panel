// src/features/billing/components/PlanUpgradeWizard.jsx

import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { PLANS, getPlanById } from '../../../config/plans';
import Swal from 'sweetalert2';
import {
    X, ArrowRight, ArrowLeft, CheckCircle, Crown, Zap,
    TrendingUp, Users, MapPin, Layout, Database, CreditCard, Sparkles
} from 'lucide-react';

const PlanUpgradeWizard = ({ isOpen, onClose, tenantId, currentPlan, onSuccess }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const [paymentData, setPaymentData] = useState({
        cardNumber: '',
        cardHolder: '',
        expiryDate: '',
        cvv: ''
    });

    const handleSelectPlan = (planId) => {
        setSelectedPlan(planId);
    };

    const handleUpgrade = async () => {
        setIsProcessing(true);

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const newPlan = getPlanById(selectedPlan);
            const now = new Date().toISOString();

            await updateDoc(doc(db, 'tenants', tenantId), {
                plan: selectedPlan,
                limits: newPlan.limits,
                subscription: {
                    plan: selectedPlan,
                    status: 'active',
                    currentPeriodStart: now,
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    lastPaymentDate: now,
                    paymentMethod: paymentData.cardNumber ? {
                        type: 'card',
                        last4: paymentData.cardNumber.slice(-4),
                        brand: 'visa'
                    } : null
                },
                updatedAt: now
            });

            setCurrentStep(4);
            if (onSuccess) onSuccess();
        } catch (e) {
            console.error(e);
            Swal.fire({
                icon: 'error',
                title: 'Upgrade Failed',
                text: 'Failed to upgrade plan. Please try again.',
                confirmButtonColor: '#3b82f6'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        setCurrentStep(1);
        setSelectedPlan(null);
        setPaymentData({
            cardNumber: '',
            cardHolder: '',
            expiryDate: '',
            cvv: ''
        });
        onClose();
    };

    if (!isOpen) return null;

    const currentPlanData = getPlanById(currentPlan);
    const selectedPlanData = selectedPlan ? getPlanById(selectedPlan) : null;

    const steps = [
        { num: 1, title: 'Select Plan' },
        { num: 2, title: 'Review' },
        { num: 3, title: 'Payment' },
        { num: 4, title: 'Complete' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                
                <div className="flex-shrink-0 px-6 py-5 border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-800 shadow-sm">
                                <Sparkles size={24} className="text-purple-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-xl text-slate-800 dark:text-white">
                                    Upgrade Subscription
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Choose a plan that fits your needs
                                </p>
                            </div>
                        </div>
                        {currentStep !== 4 && (
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        )}
                    </div>

                    <div className="flex justify-between items-center">
                        {steps.map((step, idx) => (
                            <React.Fragment key={step.num}>
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                        currentStep === step.num
                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg scale-110'
                                            : currentStep > step.num
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                    }`}>
                                        {currentStep > step.num ? <CheckCircle size={18} /> : step.num}
                                    </div>
                                    <span className={`text-xs font-bold hidden md:block ${
                                        currentStep === step.num ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500'
                                    }`}>
                                        {step.title}
                                    </span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className={`flex-1 h-1 mx-2 rounded transition-all ${
                                        currentStep > step.num ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                                    }`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <TrendingUp size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                                            Current Plan: {currentPlanData.displayName}
                                        </p>
                                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                            ${currentPlanData.price}/month - {currentPlanData.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {Object.values(PLANS).filter(plan => plan.id !== currentPlan).map(plan => {
                                    const isSelected = selectedPlan === plan.id;
                                    const isUpgrade = plan.price > currentPlanData.price;

                                    return (
                                        <div
                                            key={plan.id}
                                            onClick={() => handleSelectPlan(plan.id)}
                                            className={`relative cursor-pointer rounded-2xl border-3 p-6 transition-all hover:shadow-xl ${
                                                isSelected
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg scale-105'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                            }`}
                                        >
                                            {isSelected && (
                                                <div className="absolute -top-3 -right-3 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                                    <CheckCircle size={18} className="text-white" />
                                                </div>
                                            )}

                                            {isUpgrade && (
                                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-full">
                                                    UPGRADE
                                                </div>
                                            )}

                                            <div className="text-center mb-4">
                                                {plan.id === 'enterprise' && (
                                                    <Crown size={32} className="mx-auto text-amber-500 mb-2" />
                                                )}
                                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                                                    {plan.displayName}
                                                </h3>
                                                <div className="flex items-baseline justify-center gap-1 mb-2">
                                                    <span className="text-3xl font-bold text-purple-600">${plan.price}</span>
                                                    <span className="text-slate-500 text-sm">/month</span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{plan.description}</p>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-600 dark:text-slate-400">Locations</span>
                                                    <span className="font-bold text-slate-800 dark:text-white">
                                                        {plan.limits.maxLocations === 999 ? 'Unlimited' : plan.limits.maxLocations}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-600 dark:text-slate-400">Users</span>
                                                    <span className="font-bold text-slate-800 dark:text-white">
                                                        {plan.limits.maxUsers === 999 ? 'Unlimited' : plan.limits.maxUsers}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-600 dark:text-slate-400">Data Retention</span>
                                                    <span className="font-bold text-slate-800 dark:text-white">
                                                        {plan.limits.dataRetentionDays} days
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                                <div className="space-y-1">
                                                    {plan.limits.features.mqttAuditor && (
                                                        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                                                            <CheckCircle size={14} />
                                                            <span>MQTT Auditor</span>
                                                        </div>
                                                    )}
                                                    {plan.limits.features.advancedAnalytics && (
                                                        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                                                            <CheckCircle size={14} />
                                                            <span>Advanced Analytics</span>
                                                        </div>
                                                    )}
                                                    {plan.limits.features.apiAccess && (
                                                        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                                                            <CheckCircle size={14} />
                                                            <span>API Access</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && selectedPlanData && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="text-center mb-6">
                                <TrendingUp size={48} className="mx-auto text-purple-600 mb-3" />
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                                    Review Your Upgrade
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Confirm the changes to your subscription
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-6">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">
                                        Current Plan
                                    </p>
                                    <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                                        {currentPlanData.displayName}
                                    </h4>
                                    <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                                        ${currentPlanData.price}/mo
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-purple-300 dark:border-purple-700 p-6">
                                    <p className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase mb-3">
                                        New Plan
                                    </p>
                                    <h4 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-1 flex items-center gap-2">
                                        {selectedPlanData.displayName}
                                        {selectedPlanData.id === 'enterprise' && <Crown size={20} className="text-amber-500" />}
                                    </h4>
                                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        ${selectedPlanData.price}/mo
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-6">
                                <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-4">
                                    What's Changing
                                </h4>

                                <div className="space-y-3">
                                    {[
                                        {
                                            icon: MapPin,
                                            label: 'Locations',
                                            from: currentPlanData.limits.maxLocations,
                                            to: selectedPlanData.limits.maxLocations
                                        },
                                        {
                                            icon: Users,
                                            label: 'Users',
                                            from: currentPlanData.limits.maxUsers,
                                            to: selectedPlanData.limits.maxUsers
                                        },
                                        {
                                            icon: Layout,
                                            label: 'Widgets',
                                            from: currentPlanData.limits.maxWidgetsTotal,
                                            to: selectedPlanData.limits.maxWidgetsTotal
                                        },
                                        {
                                            icon: Database,
                                            label: 'Data Retention',
                                            from: `${currentPlanData.limits.dataRetentionDays} days`,
                                            to: `${selectedPlanData.limits.dataRetentionDays} days`
                                        }
                                    ].map((item, idx) => {
                                        const Icon = item.icon;
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Icon size={18} className="text-slate-500" />
                                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
                                                        {item.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-slate-500">
                                                        {item.from === 999 ? '∞' : item.from}
                                                    </span>
                                                    <ArrowRight size={16} className="text-purple-600" />
                                                    <span className="text-sm font-bold text-purple-600">
                                                        {item.to === 999 ? '∞' : item.to}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <Zap size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                                            Immediate Upgrade
                                        </p>
                                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                            Your new limits will take effect immediately after payment confirmation.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-6 animate-in fade-in max-w-md mx-auto">
                            <div className="text-center mb-6">
                                <CreditCard size={48} className="mx-auto text-purple-600 mb-3" />
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                                    Payment Information
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Secure payment processing (Demo Mode)
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white mb-6 shadow-xl">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-12 h-8 bg-white/20 rounded backdrop-blur-sm"></div>
                                    <div className="text-xs font-bold">DEMO CARD</div>
                                </div>
                                <div className="font-mono text-xl tracking-wider mb-4">
                                    {paymentData.cardNumber || '•••• •••• •••• ••••'}
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-xs opacity-70 mb-1">Card Holder</div>
                                        <div className="font-bold">{paymentData.cardHolder || 'YOUR NAME'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs opacity-70 mb-1">Expires</div>
                                        <div className="font-bold">{paymentData.expiryDate || 'MM/YY'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                                        Card Number
                                    </label>
                                    <input
                                        type="text"
                                        maxLength="19"
                                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                                        value={paymentData.cardNumber}
                                        onChange={e => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                                        placeholder="1234 5678 9012 3456"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                                        Card Holder Name
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                                        value={paymentData.cardHolder}
                                        onChange={e => setPaymentData({ ...paymentData, cardHolder: e.target.value })}
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                                            Expiry Date
                                        </label>
                                        <input
                                            type="text"
                                            maxLength="5"
                                            className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                                            value={paymentData.expiryDate}
                                            onChange={e => setPaymentData({ ...paymentData, expiryDate: e.target.value })}
                                            placeholder="MM/YY"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                                            CVV
                                        </label>
                                        <input
                                            type="text"
                                            maxLength="3"
                                            className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                                            value={paymentData.cvv}
                                            onChange={e => setPaymentData({ ...paymentData, cvv: e.target.value })}
                                            placeholder="123"
                                        />
                                    </div>
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4">
                                    <p className="text-sm text-amber-800 dark:text-amber-200 font-bold flex items-center gap-2">
                                        <CheckCircle size={16} />
                                        Demo Mode Active
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                        No actual payment will be processed. This is for demonstration purposes only.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="text-center py-12 animate-in fade-in zoom-in">
                            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce">
                                <CheckCircle size={40} className="text-white" />
                            </div>
                            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">
                                Upgrade Successful!
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                Your subscription has been upgraded to <span className="font-bold text-purple-600">{selectedPlanData?.displayName}</span>
                            </p>

                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 p-6 max-w-md mx-auto mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">New Plan</span>
                                    <span className="font-bold text-purple-600">{selectedPlanData?.displayName}</span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Monthly Cost</span>
                                    <span className="font-bold text-slate-800 dark:text-white">${selectedPlanData?.price}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Next Billing</span>
                                    <span className="font-bold text-slate-800 dark:text-white">
                                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleClose}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-purple-500/30 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>

                {currentStep < 4 && (
                    <div className="flex-shrink-0 px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <button
                            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : handleClose()}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-6 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowLeft size={18} />
                            {currentStep === 1 ? 'Cancel' : 'Back'}
                        </button>

                        {currentStep < 3 && (
                            <button
                                onClick={() => setCurrentStep(currentStep + 1)}
                                disabled={!selectedPlan}
                                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue
                                <ArrowRight size={18} />
                            </button>
                        )}

                        {currentStep === 3 && (
                            <button
                                onClick={handleUpgrade}
                                disabled={isProcessing}
                                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={20} />
                                        Confirm Upgrade
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlanUpgradeWizard;