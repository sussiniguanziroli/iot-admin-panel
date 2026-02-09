import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Copy, Check, Mail, Shield, UserPlus, Loader2, Building2, ChevronDown, Send } from 'lucide-react';
import { useAuth } from '../../../auth/context/AuthContext';
import { usePermissions } from '../../../../shared/hooks/usePermissions';
import { createInvitation } from '../../../../services/AdminService';
import { sendInvitationEmail } from '../../../../services/EmailService';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';

const InviteUserModal = ({ isOpen, onClose, onSuccess }) => {
  const { userProfile } = useAuth();
  const { isSuperAdmin } = usePermissions();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    role: 'operator',
    tenantId: userProfile?.tenantId || ''
  });
  const [inviteLink, setInviteLink] = useState('');
  const [hasCopied, setHasCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sendEmailAutomatically, setSendEmailAutomatically] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const [tenants, setTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  useEffect(() => {
    if (isOpen && isSuperAdmin) {
      fetchTenants();
    }
  }, [isOpen, isSuperAdmin]);

  useEffect(() => {
    if (isOpen && userProfile?.tenantId) {
      setFormData(prev => ({ ...prev, tenantId: userProfile.tenantId }));
    }
  }, [isOpen, userProfile]);

  const fetchTenants = async () => {
    setLoadingTenants(true);
    try {
      const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
      const tenantsList = tenantsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        status: doc.data().status
      }));
      
      const activeTenants = tenantsList.filter(t => t.status === 'active');
      setTenants(activeTenants);
      
      if (activeTenants.length > 0 && !formData.tenantId) {
        setFormData(prev => ({ ...prev, tenantId: activeTenants[0].id }));
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoadingTenants(false);
    }
  };

  if (!isOpen) return null;

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const link = await createInvitation(
        userProfile,
        formData.tenantId,
        formData.role,
        formData.email
      );
      setInviteLink(link);
      setStep(2);

      if (sendEmailAutomatically && formData.email) {
        await handleSendEmail(link);
      }
    } catch (error) {
      console.error('Error generating invite:', error);
      alert('Failed to generate invitation link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async (linkToSend = inviteLink) => {
    if (!formData.email) {
      alert('Por favor ingresá un email para enviar la invitación');
      return;
    }

    setIsSendingEmail(true);
    try {
      const tenantDoc = await getDoc(doc(db, 'tenants', formData.tenantId));
      const tenantName = tenantDoc.exists() ? tenantDoc.data().name : formData.tenantId;

      const result = await sendInvitationEmail(
        formData.email,
        userProfile.name,
        tenantName,
        formData.role,
        linkToSend
      );

      if (result.success) {
        setEmailSent(true);
        alert('✅ Invitación enviada por email exitosamente');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('❌ Error al enviar el email. Podés copiar el link manualmente.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      email: '',
      role: 'operator',
      tenantId: userProfile?.tenantId || ''
    });
    setInviteLink('');
    setHasCopied(false);
    setSendEmailAutomatically(false);
    setEmailSent(false);
    onClose();
    if (step === 2) onSuccess();
  };

  const getTenantDisplayName = (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.name : tenantId;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {step === 1 ? (
          <>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-white">
              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <UserPlus size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Invitar Usuario</h2>
                    <p className="text-blue-100 mt-1">Crear un enlace de registro seguro</p>
                  </div>
                </div>
                <button 
                  onClick={handleClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="p-6 space-y-5">
              
              {isSuperAdmin && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Seleccionar Organización
                  </label>
                  
                  {loadingTenants ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin text-blue-600" size={24} />
                      <span className="ml-2 text-slate-500 dark:text-slate-400">Cargando organizaciones...</span>
                    </div>
                  ) : tenants.length === 0 ? (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        No hay organizaciones activas. Creá un tenant primero.
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                      <select
                        value={formData.tenantId}
                        onChange={(e) => setFormData({...formData, tenantId: e.target.value})}
                        required
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white appearance-none cursor-pointer"
                      >
                        {tenants.map(tenant => (
                          <option key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {tenants.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Building2 size={12} />
                      <span>
                        Seleccionado: <span className="font-mono font-semibold">{formData.tenantId}</span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {!isSuperAdmin && (
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                    Organización
                  </label>
                  <div className="flex items-center gap-2">
                    <Building2 size={18} className="text-slate-400" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {userProfile?.tenantId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Solo podés invitar usuarios a tu organización
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Email (Recomendado)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    placeholder="usuario@empresa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  Dejalo vacío para permitir que cualquiera con el link se registre
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Rol y Permisos
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="viewer">Viewer - Solo lectura</option>
                    <option value="operator">Operator - Monitoreo y visualización</option>
                    <option value="admin">Admin - Control total</option>
                    {isSuperAdmin && <option value="super_admin">Super Admin - Control de plataforma</option>}
                  </select>
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {formData.role === 'viewer' && '👁️ Solo puede ver dashboards, sin edición ni control'}
                  {formData.role === 'operator' && '📊 Puede ver dashboards y monitorear equipos'}
                  {formData.role === 'admin' && '🔧 Acceso completo: gestionar usuarios, editar dashboards, controlar equipos'}
                  {formData.role === 'super_admin' && '⚡ Acceso total a toda la plataforma y organizaciones'}
                </div>
              </div>

              {formData.email && (
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmailAutomatically}
                      onChange={(e) => setSendEmailAutomatically(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Enviar invitación por email automáticamente
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        El usuario recibirá el link de registro por email
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !formData.tenantId || (isSuperAdmin && tenants.length === 0)}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Generando...
                    </>
                  ) : (
                    <>
                      <LinkIcon size={18} />
                      Generar Link
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-6 text-white">
              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Check size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">¡Invitación Lista!</h2>
                    <p className="text-emerald-100 mt-1">Compartí este link para dar acceso</p>
                  </div>
                </div>
                <button 
                  onClick={handleClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Detalles de Invitación</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                    formData.role === 'admin' 
                      ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300' 
                      : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300'
                  }`}>
                    {formData.role.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Building2 size={14} />
                    <span className="font-medium">
                      {isSuperAdmin ? getTenantDisplayName(formData.tenantId) : userProfile?.tenantId}
                    </span>
                  </div>
                  {formData.email && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Mail size={14} />
                      <span className="font-mono text-xs">{formData.email}</span>
                      {emailSent && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          ✓ Enviado
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Link de Invitación</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={inviteLink}
                    className="flex-1 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg text-sm font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 overflow-hidden text-ellipsis"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 font-medium text-sm px-4"
                  >
                    {hasCopied ? <Check size={16} /> : <Copy size={16} />}
                    {hasCopied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              {formData.email && !emailSent && (
                <button
                  onClick={() => handleSendEmail()}
                  disabled={isSendingEmail}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Enviar por Email
                    </>
                  )}
                </button>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <h3 className="font-bold text-blue-900 dark:text-blue-100 text-sm mb-2">🔧 Próximos Pasos</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Enviá este link por email o mensaje</li>
                  <li>• El usuario creará su cuenta con este link</li>
                  <li>• El link solo puede usarse una vez</li>
                  <li>• El acceso se otorgará inmediatamente después del registro</li>
                </ul>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                Listo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InviteUserModal;