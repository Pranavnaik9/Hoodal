import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Shield, Store, Calendar, Save, Edit3, X, Download, QrCode, MapPin } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useI18n } from '../lib/i18n';

export function AdminProfilePage() {
    const { user, setUser } = useAuthStore();
    const { t } = useI18n();
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [updatingLocation, setUpdatingLocation] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const qrRef = useRef<HTMLDivElement>(null);

    // Editable fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const fetchProfile = async () => {
        try {
            const res = await apiClient.get('/auth/me');
            const data = res.data.data;
            setProfile(data);
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            setPhone(data.phone || '');
            setEmail(data.email || '');
        } catch {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await apiClient.put('/auth/profile', { firstName, lastName, phone, email });
            const updated = res.data.data;
            setProfile(updated);
            setUser({
                ...user!,
                firstName: updated.firstName,
                lastName: updated.lastName,
                phone: updated.phone,
                email: updated.email,
                shopName: updated.shop?.name || user?.shopName,
            });
            setEditing(false);
            toast.success(t('profile.updated'));
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFirstName(profile?.firstName || '');
        setLastName(profile?.lastName || '');
        setPhone(profile?.phone || '');
        setEmail(profile?.email || '');
        setEditing(false);
    };

    const handleDownloadQr = () => {
        if (!qrRef.current) return;
        const svg = qrRef.current.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width * 2;
            canvas.height = img.height * 2;
            ctx!.fillStyle = '#ffffff';
            ctx!.fillRect(0, 0, canvas.width, canvas.height);
            ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
            const link = document.createElement('a');
            link.download = `${profile?.shop?.name || 'shop'}-qr-code.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    const handleUpdateLocation = () => {
        if (!profile?.shopId) return toast.error('No shop linked to your account');
        if (!navigator.geolocation) return toast.error('Geolocation is not supported by your browser');

        setUpdatingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    await apiClient.put(`/shops/${profile.shopId}`, {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                    });
                    toast.success('Shop location updated successfully on Map!');
                    fetchProfile(); // refresh data
                } catch (err) {
                    toast.error('Failed to update shop location');
                } finally {
                    setUpdatingLocation(false);
                }
            },
            () => {
                toast.error('Location access denied. Please enable location services.');
                setUpdatingLocation(false);
            }
        );
    };

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            HOODAL_ADMIN: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            SHOP_ADMIN: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
            CUSTOMER: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        };
        return (
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${styles[role] || styles.CUSTOMER}`}>
                {t(`role.${role}`)}
            </span>
        );
    };

    const shopUrl = profile?.shopId
        ? `${window.location.origin}/shop/${profile.shopId}`
        : '';

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{t('profile.title')}</h2>
                {!editing ? (
                    <button
                        onClick={() => setEditing(true)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:from-indigo-500 hover:to-purple-500 transition-all text-sm"
                    >
                        <Edit3 className="h-4 w-4" /> {t('profile.edit')}
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleCancel}
                            className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-sm border border-white/10"
                        >
                            <X className="h-4 w-4" /> {t('profile.cancel')}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:from-emerald-500 hover:to-teal-500 transition-all text-sm disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" /> {saving ? t('profile.saving') : t('profile.save')}
                        </button>
                    </div>
                )}
            </div>

            {/* Avatar + Identity Header */}
            <div className="bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-slate-800 border border-white/10 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-500/20">
                        {(profile?.firstName?.[0] || profile?.email?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white">
                            {profile?.firstName || profile?.lastName
                                ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
                                : profile?.email}
                        </h3>
                        <p className="text-gray-400 text-sm mt-0.5">{profile?.email}</p>
                        <div className="mt-2 flex items-center gap-3">
                            {getRoleBadge(profile?.role)}
                            {profile?.shop && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Store className="h-3 w-3" /> {profile.shop.name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Fields */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-6">
                <div className="divide-y divide-white/5">
                    {[
                        { icon: User, label: t('profile.firstName'), value: profile?.firstName, state: firstName, setter: setFirstName },
                        { icon: User, label: t('profile.lastName'), value: profile?.lastName, state: lastName, setter: setLastName },
                        { icon: Mail, label: t('profile.email'), value: profile?.email, state: email, setter: setEmail, type: 'email' },
                        { icon: Phone, label: t('profile.phone'), value: profile?.phone, state: phone, setter: setPhone },
                    ].map((field, i) => (
                        <div key={i} className="flex items-center px-6 py-4">
                            <div className="flex items-center gap-3 w-40">
                                <field.icon className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-400">{field.label}</span>
                            </div>
                            <div className="flex-1">
                                {editing ? (
                                    <input
                                        type={field.type || 'text'}
                                        value={field.state}
                                        onChange={e => field.setter(e.target.value)}
                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder={`Enter ${field.label.toLowerCase()}`}
                                    />
                                ) : (
                                    <span className="text-white text-sm font-medium">{field.value || '—'}</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Read-only fields */}
                    <div className="flex items-center px-6 py-4">
                        <div className="flex items-center gap-3 w-40">
                            <Shield className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-400">{t('profile.role')}</span>
                        </div>
                        <div className="flex-1">{getRoleBadge(profile?.role)}</div>
                    </div>

                    <div className="flex items-center px-6 py-4">
                        <div className="flex items-center gap-3 w-40">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-400">{t('profile.memberSince')}</span>
                        </div>
                        <div className="flex-1">
                            <span className="text-white text-sm font-medium">
                                {profile?.createdAt
                                    ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                                    : '—'}
                            </span>
                        </div>
                    </div>

                    {profile?.shop && (
                        <div className="flex items-center px-6 py-4">
                            <div className="flex items-center gap-3 w-40">
                                <Store className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-400">{t('profile.shop')}</span>
                            </div>
                            <div className="flex-1">
                                <span className="text-white text-sm font-medium">{profile.shop.name}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Shop Location Section */}
            {profile?.shopId && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="h-5 w-5 text-emerald-400" />
                        <h3 className="text-lg font-semibold text-white">Shop Map Location</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-5">
                        Update your shop's coordinates so customers can find you on the Explore map.
                    </p>

                    <div className="flex items-center justify-between bg-slate-900/50 border border-white/5 rounded-xl px-4 py-4">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Current Coordinates</p>
                            {profile.shop?.latitude && profile.shop?.longitude ? (
                                <p className="text-white text-sm font-mono">
                                    {profile.shop.latitude.toFixed(6)}, {profile.shop.longitude.toFixed(6)}
                                </p>
                            ) : (
                                <p className="text-gray-500 text-sm italic">Not set</p>
                            )}
                        </div>
                        <button
                            onClick={handleUpdateLocation}
                            disabled={updatingLocation}
                            className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-sm font-medium border border-emerald-500/20 disabled:opacity-50"
                        >
                            {updatingLocation ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent"></div>
                            ) : (
                                <MapPin className="h-4 w-4" />
                            )}
                            {updatingLocation ? 'Locating...' : 'Set to Current Location'}
                        </button>
                    </div>
                </div>
            )}

            {/* QR Code Section */}
            {profile?.shopId && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <QrCode className="h-5 w-5 text-indigo-400" />
                        <h3 className="text-lg font-semibold text-white">{t('profile.qrCode')}</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-5">{t('profile.qrDesc')}</p>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div ref={qrRef} className="bg-white p-4 rounded-2xl shadow-lg shadow-indigo-500/10">
                            <QRCodeSVG
                                value={shopUrl}
                                size={180}
                                level="H"
                                includeMargin={false}
                                fgColor="#1e1b4b"
                                bgColor="#ffffff"
                            />
                        </div>
                        <div className="flex-1 space-y-3">
                            <div className="bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Shop URL</p>
                                <p className="text-indigo-400 text-sm font-mono break-all">{shopUrl}</p>
                            </div>
                            <button
                                onClick={handleDownloadQr}
                                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:from-indigo-500 hover:to-purple-500 transition-all text-sm font-medium"
                            >
                                <Download className="h-4 w-4" /> {t('profile.downloadQr')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
