import { useState, useEffect } from 'react';
import { auth, db } from './firebase'; // Firebase yapılandırmasını içe aktar
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Bileşenleri içe aktar
import AuthPage from './components/AuthPage';
import SoruCozucuPage from './components/SoruCozucuPage';
import AwaitingApproval from './components/AwaitingApproval';
import { FullScreenLoader } from './components/ui/FullScreenLoader';
import { AnimatedBubbles } from './components/ui/AnimatedBubbles';
import { AlertDisplay } from './components/ui/AlertDisplay';


function App() {
  // 'loading', 'approved', 'unapproved', 'loggedOut' durumlarını yönetecek state
  const [authState, setAuthState] = useState({ status: 'loading', user: null });
  const [firebaseError, setFirebaseError] = useState(false);

  useEffect(() => {
    if (!auth || !onAuthStateChanged) {
      console.error("Firebase Auth servisleri yüklenemedi.");
      setFirebaseError(true);
      setAuthState({ status: 'loggedOut', user: null });
      return;
    }
    
    // onAuthStateChanged, kullanıcı oturum açtığında, kapattığında veya token değiştiğinde tetiklenir.
    // Bu listener, uygulama açık kaldığı sürece aktiftir.
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Kullanıcı oturum açmış, şimdi veritabanından onay durumunu kontrol et
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().isApproved === true) {
          // Kullanıcı onaylanmışsa, durumu 'approved' olarak ayarla
          setAuthState({ status: 'approved', user: currentUser });
        } else {
          // Kullanıcı onaylanmamışsa veya veritabanında kaydı yoksa,
          // durumu 'unapproved' olarak ayarla. Bu, hem yeni kaydolanları
          // hem de girişte onaylanmamış olanları yakalar.
          setAuthState({ status: 'unapproved', user: currentUser });
        }
      } else {
        // Kullanıcı oturum açmamış veya çıkış yapmış
        setAuthState({ status: 'loggedOut', user: null });
      }
    });
    
    // Component kaldırıldığında (unmount) listener'ı temizle
    return () => unsubscribe();
  }, []);

  // Çıkış yapma fonksiyonu
  const handleLogout = async () => {
    try {
      if(auth && signOut) await signOut(auth);
    } catch (error) {
      console.error("Çıkış yaparken hata oluştu:", error);
    }
  };
  
  // Auth durumuna göre doğru bileşeni render et
  const renderContent = () => {
    switch (authState.status) {
      case 'loading':
        return <FullScreenLoader />;
      case 'approved':
        return <SoruCozucuPage user={authState.user} onLogout={handleLogout} />;
      case 'unapproved':
        return <AwaitingApproval onLogout={handleLogout} />;
      case 'loggedOut':
      default:
        return <AuthPage />;
    }
  };

  // Firebase yapılandırma hatası varsa göster
  if (firebaseError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <AlertDisplay message="Uygulama başlatılamadı. Firebase yapılandırmasını kontrol edin." type="error" />
      </div>
    );
  }

  // Ana uygulama düzeni
  const backgroundClass = authState.status === 'approved' ? 'bg-slate-900' : 'animated-gradient';

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-2 sm:p-4 transition-all duration-500 ${backgroundClass}`}>
      {authState.status !== 'approved' && <AnimatedBubbles />}
      <div className="relative z-10 w-full">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
