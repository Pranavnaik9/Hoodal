import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { useAuthStore } from '../store/authStore';

export function CustomerProfilePage() {
    const { user, login } = useAuthStore();
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [email, setEmail] = useState(user?.email || '');
    const [updatingParams, setUpdatingParams] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdatingParams(true);
        try {
            const res = await apiClient.put('/auth/profile', { firstName, lastName, phone, email });
            toast.success('Profile updated successfully');
            // Refresh token with new user data
            login(res.data.token, res.data.user);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setUpdatingParams(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setChangingPassword(true);
        try {
            await apiClient.put('/auth/change-password', { currentPassword, newPassword });
            toast.success('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Personal Details Profile */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Personal Information</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                            <input
                                type="text"
                                required
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                            <input
                                type="text"
                                required
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={updatingParams}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
                    >
                        {updatingParams ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>

            <div className="border-t border-white/10"></div>

            {/* Change Password */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Change Password</h2>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
                        <input
                            type="password"
                            required
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={changingPassword}
                        className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
                    >
                        {changingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
