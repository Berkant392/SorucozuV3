import React from 'react';

// Bu bileşen, onLogout fonksiyonunu bir prop olarak alır.
// Bu fonksiyon, kullanıcının oturumunu güvenli bir şekilde kapatmak için kullanılır.
const AwaitingApproval = ({ onLogout }) => {
  return (
    <div className="w-full max-w-md mx-auto bg-slate-900/40 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
      <h1 className="text-3xl font-extrabold text-slate-100">Onay Bekleniyor</h1>
      <p className="text-slate-300 mt-4">
        Hesabınız başarıyla oluşturuldu. Uygulamayı kullanabilmek için yöneticinin hesabınızı onaylaması gerekmektedir.
      </p>
      <p className="text-slate-400 mt-2 text-sm">
        Lütfen daha sonra tekrar deneyin.
      </p>
      <button 
        onClick={onLogout}
        className="w-full mt-8 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-base font-medium text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-violet-500 transition-all duration-300 transform hover:scale-105"
      >
        Çıkış Yap
      </button>
    </div>
  );
};

export default AwaitingApproval;
