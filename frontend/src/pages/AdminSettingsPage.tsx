import { useState, useEffect } from 'react';
import { Lock, Store, Globe, HelpCircle, ChevronDown, ChevronUp, Mail, Phone, MapPin, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useI18n, LANGUAGES } from '../lib/i18n';

export function AdminSettingsPage() {
    const { user } = useAuthStore();
    const { t, lang, setLang } = useI18n();

    // Change Password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    // Shop Info
    const [shopInfo, setShopInfo] = useState<any>(null);
    const [loadingShop, setLoadingShop] = useState(true);

    // Edit Shop Info state
    const [editingShop, setEditingShop] = useState(false);
    const [shopForm, setShopForm] = useState({ name: '', address: '', phone: '', deliverySlots: '' });
    const [savingShop, setSavingShop] = useState(false);

    // FAQ open state
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        const loadShopInfo = async () => {
            if (!user?.shopId) { setLoadingShop(false); return; }
            try {
                const res = await apiClient.get(`/shops/${user.shopId}`);
                const data = res.data.data;
                setShopInfo(data);
                setShopForm({
                    name: data.name || '',
                    address: data.address || '',
                    phone: data.phone || '',
                    deliverySlots: data.deliverySlots || ''
                });
            } catch {
                // silent fail
            } finally {
                setLoadingShop(false);
            }
        };
        loadShopInfo();
    }, [user?.shopId]);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error(t('settings.passwordMismatch'));
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setChangingPassword(true);
        try {
            await apiClient.put('/auth/change-password', { currentPassword, newPassword });
            toast.success(t('settings.passwordChanged'));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleSaveShop = async () => {
        setSavingShop(true);
        try {
            const res = await apiClient.put(`/shops/${user?.shopId}`, shopForm);
            setShopInfo(res.data.data);
            setEditingShop(false);
            toast.success('Shop information updated');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to update shop details');
        } finally {
            setSavingShop(false);
        }
    };

    const faqItems = [
        { q: t('faq.q1'), a: t('faq.a1') },
        { q: t('faq.q2'), a: t('faq.a2') },
        { q: t('faq.q3'), a: t('faq.a3') },
        { q: t('faq.q4'), a: t('faq.a4') },
        { q: t('faq.q5'), a: t('faq.a5') },
        { q: t('faq.q6'), a: t('faq.a6') },
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">{t('settings.title')}</h2>

            {/* ========== CHANGE PASSWORD ========== */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                    <div className="bg-red-500/15 p-2 rounded-xl">
                        <Lock className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">{t('settings.changePassword')}</h3>
                    </div>
                </div>
                <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('settings.currentPassword')}</label>
                        <input
                            type="password"
                            required
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('settings.newPassword')}</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('settings.confirmPassword')}</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-red-400 text-xs">{t('settings.passwordMismatch')}</p>
                    )}
                    <button
                        type="submit"
                        disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                        className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:from-red-500 hover:to-rose-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {changingPassword ? t('settings.updating') : t('settings.updatePassword')}
                    </button>
                </form>
            </div>

            {/* ========== SHOP INFORMATION ========== */}
            {user?.shopId && (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-500/15 p-2 rounded-xl">
                                <Store className="h-5 w-5 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">{t('settings.shopInfo')}</h3>
                            </div>
                        </div>
                        {!loadingShop && shopInfo && !editingShop && (
                            <button
                                onClick={() => setEditingShop(true)}
                                className="text-indigo-400 text-sm hover:text-indigo-300 font-medium px-3 py-1 bg-white/5 rounded-lg border border-white/10"
                            >
                                Edit Shop
                            </button>
                        )}
                    </div>
                    <div className="p-6">
                        {loadingShop ? (
                            <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
                            </div>
                        ) : shopInfo ? (
                            editingShop ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('settings.shopName')}</label>
                                        <input
                                            type="text"
                                            value={shopForm.name}
                                            onChange={e => setShopForm({ ...shopForm, name: e.target.value })}
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('settings.shopAddress')}</label>
                                        <input
                                            type="text"
                                            value={shopForm.address}
                                            onChange={e => setShopForm({ ...shopForm, address: e.target.value })}
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('settings.shopPhone')}</label>
                                        <input
                                            type="text"
                                            value={shopForm.phone}
                                            onChange={e => setShopForm({ ...shopForm, phone: e.target.value })}
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Delivery Slots (comma separated)</label>
                                        <input
                                            type="text"
                                            value={shopForm.deliverySlots}
                                            onChange={e => setShopForm({ ...shopForm, deliverySlots: e.target.value })}
                                            placeholder="e.g. 10 AM - 12 PM, 2 PM - 4 PM"
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Leave blank if you don't use predetermined delivery slots.</p>
                                    </div>
                                    <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-white/10">
                                        <button
                                            onClick={() => {
                                                setShopForm({
                                                    name: shopInfo.name || '',
                                                    address: shopInfo.address || '',
                                                    phone: shopInfo.phone || '',
                                                    deliverySlots: shopInfo.deliverySlots || ''
                                                });
                                                setEditingShop(false);
                                            }}
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveShop}
                                            disabled={savingShop || !shopForm.name}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium"
                                        >
                                            {savingShop ? 'Saving...' : 'Save Details'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Availability Toggle */}
                                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-2.5 w-2.5 rounded-full ${shopInfo.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                            <div>
                                                <p className="text-xs text-white font-medium">{shopInfo.isActive ? 'Shop is ONLINE' : 'Shop is OFFLINE'}</p>
                                                <p className="text-[10px] text-gray-500">{shopInfo.isActive ? 'Customers can see and order from your shop' : 'Customers cannot find or order from your shop'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await apiClient.patch(`/shops/${shopInfo.id}/toggle`);
                                                    setShopInfo(res.data.data);
                                                    toast.success(res.data.message);
                                                } catch (err) {
                                                    toast.error('Failed to toggle shop status');
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                                                shopInfo.isActive 
                                                ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20' 
                                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'
                                            }`}
                                        >
                                            {shopInfo.isActive ? 'Deactivate Shop' : 'Activate Shop'}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Store className="h-4 w-4 text-gray-500" />
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t('settings.shopName')}</p>
                                            <p className="text-white text-sm font-medium">{shopInfo.name || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <MapPin className="h-4 w-4 text-gray-500" />
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t('settings.shopAddress')}</p>
                                            <p className="text-white text-sm font-medium">{shopInfo.address || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-4 w-4 text-gray-500" />
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t('settings.shopPhone')}</p>
                                            <p className="text-white text-sm font-medium">{shopInfo.phone || '—'}</p>
                                        </div>
                                    </div>
                                    {shopInfo.deliverySlots && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Delivery Slots</p>
                                            <div className="flex flex-wrap gap-2">
                                                {shopInfo.deliverySlots.split(',').map((slot: string, i: number) => (
                                                    <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-indigo-300">
                                                        {slot.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        ) : (
                            <p className="text-gray-500 text-sm">Shop information not available</p>
                        )}
                    </div>
                </div>
            )}

            {/* ========== LANGUAGE ========== */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                    <div className="bg-emerald-500/15 p-2 rounded-xl">
                        <Globe className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">{t('settings.language')}</h3>
                        <p className="text-gray-500 text-xs mt-0.5">{t('settings.languageDesc')}</p>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {LANGUAGES.map(l => (
                            <button
                                key={l.code}
                                onClick={() => setLang(l.code)}
                                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                                    lang === l.code
                                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400 shadow-lg shadow-indigo-500/10'
                                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <p className="font-semibold">{l.native}</p>
                                <p className="text-[10px] opacity-60 mt-0.5">{l.label}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ========== HELP & SUPPORT ========== */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                    <div className="bg-amber-500/15 p-2 rounded-xl">
                        <HelpCircle className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">{t('settings.help')}</h3>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    {/* FAQ Accordion */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">{t('settings.faq')}</h4>
                        <div className="space-y-2">
                            {faqItems.map((faq, i) => (
                                <div key={i} className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
                                    >
                                        <span className="text-sm text-white font-medium pr-4">{faq.q}</span>
                                        {openFaq === i
                                            ? <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                            : <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                        }
                                    </button>
                                    {openFaq === i && (
                                        <div className="px-4 pb-3 pt-0">
                                            <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Support */}
                    <div className="border-t border-white/5 pt-4">
                        <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">{t('settings.contact')}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <a
                                href="mailto:support@hoodal.in"
                                className="flex items-center gap-3 bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 hover:bg-white/5 transition-colors group"
                            >
                                <Mail className="h-4 w-4 text-indigo-400 group-hover:text-indigo-300" />
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Email</p>
                                    <p className="text-sm text-white font-medium">support@hoodal.in</p>
                                </div>
                            </a>
                            <a
                                href="tel:+919876543210"
                                className="flex items-center gap-3 bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 hover:bg-white/5 transition-colors group"
                            >
                                <Phone className="h-4 w-4 text-emerald-400 group-hover:text-emerald-300" />
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Phone</p>
                                    <p className="text-sm text-white font-medium">+91 98765 43210</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* App Version */}
                    <div className="border-t border-white/5 pt-4 flex items-center gap-2 text-gray-500">
                        <Info className="h-3.5 w-3.5" />
                        <span className="text-xs">{t('settings.version')}: HOODAL v1.0.0</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
