import React from 'react';

/**
 * Arka planda hareket eden, estetik amaçlı baloncukları oluşturan bileşen.
 * Animasyonlar ve stiller, global olarak 'index.css' dosyasında tanımlanmıştır.
 */
const AnimatedBubbles = () => {
  return (
    <div className="bubbles" aria-hidden="true">
      {/* Array.from ile 12 adet div (baloncuk) oluşturuyoruz. 
        Her birinin stili, index.css dosyasındaki .bubble:nth-child() seçicileriyle
        ayrı ayrı kontrol edilir, bu da onlara rastgele bir görünüm kazandırır.
      */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="bubble"></div>
      ))}
    </div>
  );
};

export default AnimatedBubbles;
