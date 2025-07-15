import React from 'react';

/**
 * Uygulama genelinde hata veya başarı mesajlarını göstermek için kullanılan bileşen.
 * @param {{
 * message: string;
 * type: 'error' | 'success';
 * }} props
 */
const AlertDisplay = ({ message, type = 'error' }) => {
  // Gösterilecek bir mesaj yoksa, hiçbir şey render etme.
  if (!message) {
    return null;
  }

  // Mesaj tipine göre stil sınıflarını belirle.
  const baseClasses = "px-4 py-3 rounded-lg relative mb-4 text-center text-sm transition-opacity duration-300";
  const typeClasses = {
    error: "bg-pink-500/20 border border-pink-500/30 text-pink-300",
    success: "bg-green-500/20 border border-green-500/30 text-green-300"
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
      {message}
    </div>
  );
};

export default AlertDisplay;
