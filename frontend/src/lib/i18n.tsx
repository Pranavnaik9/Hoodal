import { createContext, useContext, useState, ReactNode } from 'react';

// All major Indian languages
export const LANGUAGES = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
    { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
    { code: 'as', label: 'Assamese', native: 'অসমীয়া' },
    { code: 'ur', label: 'Urdu', native: 'اردو' },
];

// Translation keys — English is always the fallback
type TranslationKeys = Record<string, string>;
type Translations = Record<string, TranslationKeys>;

const translations: Translations = {
    en: {
        // Profile Page
        'profile.title': 'My Profile',
        'profile.edit': 'Edit Profile',
        'profile.save': 'Save Changes',
        'profile.saving': 'Saving...',
        'profile.cancel': 'Cancel',
        'profile.firstName': 'First Name',
        'profile.lastName': 'Last Name',
        'profile.email': 'Email',
        'profile.phone': 'Phone',
        'profile.role': 'Role',
        'profile.memberSince': 'Member Since',
        'profile.shop': 'Shop',
        'profile.qrCode': 'Shop QR Code',
        'profile.qrDesc': 'Customers can scan this QR code to open your shop storefront',
        'profile.downloadQr': 'Download QR Code',
        'profile.updated': 'Profile updated successfully',

        // Settings Page
        'settings.title': 'Settings',
        'settings.changePassword': 'Change Password',
        'settings.currentPassword': 'Current Password',
        'settings.newPassword': 'New Password',
        'settings.confirmPassword': 'Confirm New Password',
        'settings.updatePassword': 'Update Password',
        'settings.updating': 'Updating...',
        'settings.passwordMismatch': 'Passwords do not match',
        'settings.passwordChanged': 'Password changed successfully',
        'settings.shopInfo': 'Shop Information',
        'settings.shopName': 'Shop Name',
        'settings.shopAddress': 'Address',
        'settings.shopPhone': 'Phone',
        'settings.language': 'Language',
        'settings.languageDesc': 'Choose your preferred language for the interface',
        'settings.help': 'Help & Support',
        'settings.faq': 'Frequently Asked Questions',
        'settings.contact': 'Contact Support',
        'settings.version': 'App Version',

        // FAQ
        'faq.q1': 'How do I add a new product?',
        'faq.a1': 'Go to Products → click "Add Product" → fill in the details and save.',
        'faq.q2': 'How do I record a purchase from a supplier?',
        'faq.a2': 'Go to Purchases → click "Record Purchase" → select supplier, add items, and submit.',
        'faq.q3': 'How does POS billing work?',
        'faq.a3': 'Go to POS Terminal → search and add products → select payment mode → click "Complete Sale".',
        'faq.q4': 'How do I track supplier payments?',
        'faq.a4': 'Go to Purchases → find the purchase → click "Pay Balance" to record payments.',
        'faq.q5': 'How do I update product prices in bulk?',
        'faq.a5': 'Go to Rate Update → filter products → edit cost price and selling price → save changes.',
        'faq.q6': 'Where can I see GST reports?',
        'faq.a6': 'Go to the GST tab to view tax summaries, input vs output GST, and net payable.',

        // Roles
        'role.HOODAL_ADMIN': 'Hoodal Admin',
        'role.SHOP_ADMIN': 'Shop Admin',
        'role.CUSTOMER': 'Customer',

        // Sidebar
        'nav.dashboard': 'Dashboard',
        'nav.pos': 'POS Terminal',
        'nav.posSales': 'POS Sales',
        'nav.products': 'Products',
        'nav.orders': 'Online Orders',
        'nav.suppliers': 'Suppliers',
        'nav.purchases': 'Purchases',
        'nav.expenses': 'Expenses',
        'nav.gst': 'GST',
        'nav.rateUpdate': 'Rate Update',
        'nav.profile': 'Profile',
        'nav.settings': 'Settings',
    },

    hi: {
        'profile.title': 'मेरी प्रोफ़ाइल',
        'profile.edit': 'प्रोफ़ाइल संपादित करें',
        'profile.save': 'बदलाव सहेजें',
        'profile.saving': 'सहेज रहे हैं...',
        'profile.cancel': 'रद्द करें',
        'profile.firstName': 'पहला नाम',
        'profile.lastName': 'उपनाम',
        'profile.email': 'ईमेल',
        'profile.phone': 'फ़ोन',
        'profile.role': 'भूमिका',
        'profile.memberSince': 'सदस्य तिथि',
        'profile.shop': 'दुकान',
        'profile.qrCode': 'दुकान QR कोड',
        'profile.qrDesc': 'ग्राहक इस QR कोड को स्कैन करके आपकी दुकान खोल सकते हैं',
        'profile.downloadQr': 'QR कोड डाउनलोड करें',
        'profile.updated': 'प्रोफ़ाइल सफलतापूर्वक अपडेट हुई',

        'settings.title': 'सेटिंग्स',
        'settings.changePassword': 'पासवर्ड बदलें',
        'settings.currentPassword': 'वर्तमान पासवर्ड',
        'settings.newPassword': 'नया पासवर्ड',
        'settings.confirmPassword': 'नया पासवर्ड पुनः दर्ज करें',
        'settings.updatePassword': 'पासवर्ड अपडेट करें',
        'settings.updating': 'अपडेट हो रहा है...',
        'settings.passwordMismatch': 'पासवर्ड मेल नहीं खाते',
        'settings.passwordChanged': 'पासवर्ड सफलतापूर्वक बदल गया',
        'settings.shopInfo': 'दुकान की जानकारी',
        'settings.shopName': 'दुकान का नाम',
        'settings.shopAddress': 'पता',
        'settings.shopPhone': 'फ़ोन',
        'settings.language': 'भाषा',
        'settings.languageDesc': 'इंटरफ़ेस के लिए अपनी पसंदीदा भाषा चुनें',
        'settings.help': 'सहायता एवं समर्थन',
        'settings.faq': 'अक्सर पूछे जाने वाले प्रश्न',
        'settings.contact': 'सहायता से संपर्क करें',
        'settings.version': 'ऐप संस्करण',

        'faq.q1': 'नया उत्पाद कैसे जोड़ें?',
        'faq.a1': 'उत्पाद पर जाएं → "उत्पाद जोड़ें" पर क्लिक करें → विवरण भरें और सहेजें।',
        'faq.q2': 'आपूर्तिकर्ता से खरीदारी कैसे रिकॉर्ड करें?',
        'faq.a2': 'खरीदारी पर जाएं → "खरीदारी रिकॉर्ड करें" पर क्लिक करें → आपूर्तिकर्ता चुनें, आइटम जोड़ें, और सबमिट करें।',
        'faq.q3': 'POS बिलिंग कैसे काम करती है?',
        'faq.a3': 'POS टर्मिनल पर जाएं → उत्पाद खोजें और जोड़ें → भुगतान मोड चुनें → "बिक्री पूरी करें" पर क्लिक करें।',
        'faq.q4': 'आपूर्तिकर्ता भुगतान कैसे ट्रैक करें?',
        'faq.a4': 'खरीदारी पर जाएं → खरीदारी खोजें → भुगतान रिकॉर्ड करने के लिए "शेष भुगतान करें" पर क्लिक करें।',
        'faq.q5': 'उत्पादों की कीमतें एक साथ कैसे अपडेट करें?',
        'faq.a5': 'दर अपडेट पर जाएं → उत्पाद फ़िल्टर करें → लागत मूल्य और बिक्री मूल्य संपादित करें → बदलाव सहेजें।',
        'faq.q6': 'GST रिपोर्ट कहाँ देखें?',
        'faq.a6': 'कर सारांश, इनपुट बनाम आउटपुट GST, और शुद्ध देय राशि देखने के लिए GST टैब पर जाएं।',

        'role.HOODAL_ADMIN': 'हूडल एडमिन',
        'role.SHOP_ADMIN': 'दुकान एडमिन',
        'role.CUSTOMER': 'ग्राहक',

        'nav.dashboard': 'डैशबोर्ड',
        'nav.pos': 'POS टर्मिनल',
        'nav.posSales': 'POS बिक्री',
        'nav.products': 'उत्पाद',
        'nav.orders': 'ऑनलाइन ऑर्डर',
        'nav.suppliers': 'आपूर्तिकर्ता',
        'nav.purchases': 'खरीदारी',
        'nav.expenses': 'खर्चे',
        'nav.gst': 'GST',
        'nav.rateUpdate': 'दर अपडेट',
        'nav.profile': 'प्रोफ़ाइल',
        'nav.settings': 'सेटिंग्स',
    },

    mr: {
        'profile.title': 'माझी प्रोफाइल',
        'profile.edit': 'प्रोफाइल संपादित करा',
        'profile.save': 'बदल जतन करा',
        'profile.saving': 'जतन करत आहे...',
        'profile.cancel': 'रद्द करा',
        'profile.firstName': 'पहिले नाव',
        'profile.lastName': 'आडनाव',
        'profile.email': 'ईमेल',
        'profile.phone': 'फोन',
        'profile.role': 'भूमिका',
        'profile.memberSince': 'सदस्य तारीख',
        'profile.shop': 'दुकान',
        'profile.qrCode': 'दुकान QR कोड',
        'profile.qrDesc': 'ग्राहक हा QR कोड स्कॅन करून तुमची दुकान उघडू शकतात',
        'profile.downloadQr': 'QR कोड डाउनलोड करा',
        'profile.updated': 'प्रोफाइल यशस्वीरित्या अपडेट झाली',

        'settings.title': 'सेटिंग्ज',
        'settings.changePassword': 'पासवर्ड बदला',
        'settings.currentPassword': 'सध्याचा पासवर्ड',
        'settings.newPassword': 'नवीन पासवर्ड',
        'settings.confirmPassword': 'नवीन पासवर्ड पुन्हा टाका',
        'settings.updatePassword': 'पासवर्ड अपडेट करा',
        'settings.updating': 'अपडेट होत आहे...',
        'settings.passwordMismatch': 'पासवर्ड जुळत नाहीत',
        'settings.passwordChanged': 'पासवर्ड यशस्वीरित्या बदलला',
        'settings.shopInfo': 'दुकानाची माहिती',
        'settings.shopName': 'दुकानाचे नाव',
        'settings.shopAddress': 'पत्ता',
        'settings.shopPhone': 'फोन',
        'settings.language': 'भाषा',
        'settings.languageDesc': 'इंटरफेससाठी तुमची आवडती भाषा निवडा',
        'settings.help': 'मदत आणि सहाय्य',
        'settings.faq': 'वारंवार विचारले जाणारे प्रश्न',
        'settings.contact': 'सहाय्यासाठी संपर्क साधा',
        'settings.version': 'ॲप आवृत्ती',

        'faq.q1': 'नवीन उत्पादन कसे जोडायचे?',
        'faq.a1': 'उत्पादने → "उत्पादन जोडा" वर क्लिक करा → तपशील भरा आणि जतन करा.',
        'faq.q2': 'पुरवठादाराकडून खरेदी कशी नोंदवायची?',
        'faq.a2': 'खरेदी → "खरेदी नोंदवा" वर क्लिक करा → पुरवठादार निवडा, वस्तू जोडा आणि सबमिट करा.',
        'faq.q3': 'POS बिलिंग कशी काम करते?',
        'faq.a3': 'POS टर्मिनल → उत्पादने शोधा आणि जोडा → पेमेंट मोड निवडा → "विक्री पूर्ण करा" वर क्लिक करा.',
        'faq.q4': 'पुरवठादार पेमेंट कसे ट्रॅक करायचे?',
        'faq.a4': 'खरेदी → खरेदी शोधा → पेमेंट नोंदवण्यासाठी "शिल्लक भरा" वर क्लिक करा.',
        'faq.q5': 'उत्पादनांच्या किमती एकत्रितपणे कशा अपडेट करायच्या?',
        'faq.a5': 'दर अपडेट → उत्पादने फिल्टर करा → किंमत आणि विक्री किंमत संपादित करा → बदल जतन करा.',
        'faq.q6': 'GST अहवाल कुठे पहायचे?',
        'faq.a6': 'कर सारांश, इनपुट विरुद्ध आउटपुट GST, आणि निव्वळ देय रक्कम पाहण्यासाठी GST टॅबवर जा.',

        'role.HOODAL_ADMIN': 'हूडल ॲडमिन',
        'role.SHOP_ADMIN': 'दुकान ॲडमिन',
        'role.CUSTOMER': 'ग्राहक',

        'nav.dashboard': 'डॅशबोर्ड',
        'nav.pos': 'POS टर्मिनल',
        'nav.posSales': 'POS विक्री',
        'nav.products': 'उत्पादने',
        'nav.orders': 'ऑनलाइन ऑर्डर',
        'nav.suppliers': 'पुरवठादार',
        'nav.purchases': 'खरेदी',
        'nav.expenses': 'खर्च',
        'nav.gst': 'GST',
        'nav.rateUpdate': 'दर अपडेट',
        'nav.profile': 'प्रोफाइल',
        'nav.settings': 'सेटिंग्ज',
    },
};

interface I18nContextType {
    lang: string;
    setLang: (lang: string) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
    lang: 'en',
    setLang: () => {},
    t: (key: string) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState(() => {
        return localStorage.getItem('hoodal-lang') || 'en';
    });

    const setLang = (newLang: string) => {
        setLangState(newLang);
        localStorage.setItem('hoodal-lang', newLang);
    };

    const t = (key: string): string => {
        return translations[lang]?.[key] || translations['en']?.[key] || key;
    };

    return (
        <I18nContext.Provider value={{ lang, setLang, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    return useContext(I18nContext);
}
