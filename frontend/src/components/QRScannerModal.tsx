import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { useAuthStore } from '../store/authStore';

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QRScannerModal({ isOpen, onClose }: QRScannerModalProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    // Store callbacks in refs to avoid useEffect dependency triggers
    const onScanSuccessRef = useRef(async (decodedText: string) => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
        }
        
        try {
            const url = new URL(decodedText);
            const pathParts = url.pathname.split('/');
            const shopIndex = pathParts.indexOf('shop');
            
            if (shopIndex !== -1 && pathParts.length > shopIndex + 1) {
                const shopId = pathParts[shopIndex + 1];
                onClose();
                navigate(`/shop/${shopId}`);
            } else {
                toast.error('Invalid HOODAL Shop QR Code');
                onClose();
            }
        } catch (err) {
            toast.error('Unrecognized QR Format');
            onClose();
        }
    });

    // Keep refs up to date
    useEffect(() => {
        onScanSuccessRef.current = async (decodedText: string) => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
            try {
                const url = new URL(decodedText);
                const pathParts = url.pathname.split('/');
                const shopIndex = pathParts.indexOf('shop');
                if (shopIndex !== -1 && pathParts.length > shopIndex + 1) {
                    const shopId = pathParts[shopIndex + 1];
                    if (isAuthenticated) {
                        try {
                            await apiClient.post('/favorites', { shopId });
                            toast.success('Shop added to favorites!');
                        } catch (err) {}
                    }
                    onClose();
                    navigate(`/shop/${shopId}`);
                } else {
                    toast.error('Invalid HOODAL Shop QR Code');
                    onClose();
                }
            } catch (err) {
                toast.error('Unrecognized QR Format');
                onClose();
            }
        };
    }, [isAuthenticated, navigate, onClose]);

    useEffect(() => {
        if (!isOpen) {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
            return;
        }

        const scanner = new Html5QrcodeScanner(
            "reader", 
            { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }, 
            false
        );
        
        scannerRef.current = scanner;
        
        scanner.render(
            (text) => onScanSuccessRef.current(text), 
            () => {} // Ignored failure callback
        );

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/20 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-indigo-400" />
                        Scan Shop QR
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <div className="p-6">
                    <p className="text-gray-400 text-sm text-center mb-6">
                        Scan a HOODAL Shop QR code to instantly visit their catalogue and add them to your favorites.
                    </p>
                    
                    <div id="reader" className="overflow-hidden rounded-xl border-2 border-dashed border-indigo-500/50 qr-reader-container"></div>
                </div>
            </div>
        </div>
    );
}

// In CSS:
/*
.qr-reader-container { background: #0f172a; }
#reader button { background: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 8px; margin-top: 10px; cursor: pointer; }
#reader video { border-radius: 12px; }
*/
