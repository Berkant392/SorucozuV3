import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';

// UI Bileşenlerini içe aktar
import { AlertDisplay } from './ui/AlertDisplay';
import { Modal } from './ui/Modal';
import { AuthInput } from './ui/AuthInput';
import { FullScreenLoader } from './ui/FullScreenLoader';

// Hata mesajlarını kullanıcı dostu bir formata çeviren yardımcı fonksiyon
const getFriendlyErrorMessage = (error) => {
    if (!error || !error.code) { return "Beklenmedik bir hata oluştu. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin."; }
    switch (error.code) {
        case "auth/invalid-email": return "Lütfen geçerli bir e-posta adresi girin.";
        case "auth/user-not-found": 
        case "auth/wrong-password": 
        case "auth/invalid-login-credentials": return "E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.";
        case "auth/email-already-in-use": return "Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.";
        case "auth/weak-password": return "Şifreniz en az 6 karakter uzunluğunda olmalıdır.";
        case "auth/network-request-failed": return "Ağ hatası. Lütfen internet bağlantınızı kontrol edin.";
        default: 
            console.error("İşlenmemiş Firebase Auth Hatası:", error);
            return `Bir hata oluştu. Lütfen tekrar deneyin. (Kod: ${error.code})`;
    }
};

// Giriş Formu Bileşeni
const LoginForm = ({ onSubmit, onForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => { 
        e.preventDefault(); 
        if (!email || !password) return; 
        onSubmit(email, password); 
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <AuthInput id="email" type="email" placeholder="E-posta Adresi" value={email} onChange={e => setEmail(e.target.value)} />
            <AuthInput id="password" type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} />
            <div className="text-right">
                <button type="button" onClick={onForgotPassword} className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors">Şifrenizi mi unuttunuz?</button>
            </div>
            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-base font-medium text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-violet-500 transition-all duration-300 transform hover:scale-105">Giriş Yap</button>
        </form>
    );
};

// Kayıt Formu Bileşeni
const SignupForm = ({ onSubmit }) => {
    const [email, setEmail] = useState(''); 
    const [password, setPassword] = useState(''); 
    const [confirmPassword, setConfirmPassword] = useState(''); 
    const [fullName, setFullName] = useState(''); 
    const [grade, setGrade] = useState('');
    const [passwordError, setPasswordError] = useState({ message: "", type: "error" });

    const handleSubmit = (e) => {
        e.preventDefault();
        setPasswordError({ message: "", type: "error" });
        if (password !== confirmPassword) { 
            setPasswordError({ message: 'Girilen şifreler uyuşmuyor.', type: 'error' }); 
            return; 
        }
        if (!email || !password || !fullName || !grade) return;
        onSubmit(email, password, fullName, grade);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput id="fullName" type="text" placeholder="Ad Soyad" value={fullName} onChange={e => setFullName(e.target.value)} />
            <AuthInput id="grade" type="text" placeholder="Sınıf (Örn: 11-A)" value={grade} onChange={e => setGrade(e.target.value)} />
            <AuthInput id="email" type="email" placeholder="E-posta Adresi" value={email} onChange={e => setEmail(e.target.value)} />
            <AuthInput id="password" type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} />
            <AuthInput id="confirmPassword" type="password" placeholder="Şifre Tekrar" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            <AlertDisplay message={passwordError.message} type={passwordError.type} />
            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-base font-medium text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-violet-500 transition-all duration-300 transform hover:scale-105">Hesap Oluştur</button>
        </form>
    );
};

// Ana AuthPage Bileşeni
const AuthPage = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [notification, setNotification] = useState({ message: "", type: "error" });
    const [loading, setLoading] = useState(false);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

    // Giriş yapma fonksiyonu
    const handleLogin = async (email, password) => {
        setLoading(true);
        setNotification({ message: "", type: "error" });
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Başarılı olursa, App.jsx'teki onAuthStateChanged yönlendirmeyi halleder.
        } catch (error) {
             const friendlyMessage = getFriendlyErrorMessage(error);
             setNotification({ message: friendlyMessage, type: 'error' });
             setLoading(false);
        }
    };

    // Kayıt olma fonksiyonu
    const handleSignup = async (email, password, fullName, grade) => {
        setLoading(true);
        setNotification({ message: "", type: "error" });
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Kullanıcıyı Firestore'a isApproved: false olarak kaydet
            await setDoc(doc(db, "users", user.uid), {
                fullName: fullName,
                grade: grade,
                email: user.email,
                createdAt: new Date(),
                isApproved: false
            });
            // Başarılı kayıt sonrası, App.jsx'teki onAuthStateChanged
            // kullanıcıyı otomatik olarak 'unapproved' durumuna alacak ve
            // AwaitingApproval ekranını gösterecektir.
        } catch (error) {
            setNotification({ message: getFriendlyErrorMessage(error), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-slate-900/40 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8">
            {loading && <FullScreenLoader />}
            {showForgotPasswordModal && (
                <Modal title="Şifre Yardımı" onClose={() => setShowForgotPasswordModal(false)}>
                   <p>Yeni bir şifre almak veya mevcut şifrenizle ilgili destek için lütfen Berkant Hoca ile doğrudan iletişime geçiniz.</p>
                </Modal>
            )}
            <div className="text-center mb-8">
                 <div className="flex justify-center mb-4"><div className="w-32 p-1 bg-white/10 rounded-lg shadow-lg"><img src="https://i.imgur.com/GtXn6lU.jpeg" alt="Soru Çözücü Logosu" className="rounded-md" onError={(e) => e.target.src='https://placehold.co/128x72/ccc/ffffff?text=Logo'} /></div></div>
                <h1 className="text-3xl font-extrabold text-slate-100">{isLoginView ? 'Giriş Yap' : 'Hesap Oluştur'}</h1>
                <p className="text-slate-400 mt-2">Soru Çözücü evrenine hoş geldiniz!</p>
            </div>
            <AlertDisplay message={notification.message} type={notification.type} />
            {isLoginView ? (
                <LoginForm onSubmit={handleLogin} onForgotPassword={() => setShowForgotPasswordModal(true)} />
            ) : (
                <SignupForm onSubmit={handleSignup} />
            )}
             <div className="mt-6 text-center">
                <button onClick={() => { setIsLoginView(!isLoginView); setNotification({ message: "", type: "error" }); }} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                    {isLoginView ? 'Hesabınız yok mu? Kayıt Olun' : 'Zaten bir hesabınız var mı? Giriş Yapın'}
                </button>
            </div>
        </div>
    );
};

export default AuthPage;
