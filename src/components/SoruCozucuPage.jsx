import React, { useState, useRef, useMemo } from 'react';

// UI Bileşenlerini içe aktar
import { AlertDisplay } from './ui/AlertDisplay';
import { LoadingIndicator } from './ui/LoadingIndicator';
import { KatexRenderer } from './ui/KatexRenderer';

// ===================================================================================
// YARDIMCI BİLEŞENLER VE HOOK'LAR (Bu dosya için özel)
// ===================================================================================

const UniversalMathRenderer = ({ text, baseTextColor = 'text-slate-300' }) => {
    const parsedContent = useMemo(() => {
        if (!text) return null;
        // Chat için özel, daha basit render
        if (!text.includes('###')) {
             return text.split('\n').map((line, lineIndex) => (
                <p key={lineIndex} className={`flex items-baseline flex-wrap ${baseTextColor}`}>{renderLineWithMath(line)}</p>
            ));
        }
        // Çözüm için detaylı render
        const sections = text.split(/(###.*?###)/g);
        return sections.map((section, index) => {
            if (section.startsWith('###') && section.endsWith('###')) {
                const titleText = section.slice(3, -3).trim();
                return (<h4 key={index} className="text-md font-bold text-violet-400 mt-4 mb-2 pb-1 border-b-2 border-violet-800/50 flex items-center flex-wrap">{renderLineWithMath(titleText)}</h4>);
            }
            const sanitizedText = section.replace(/\\n/g, '\n').trim();
            if (!sanitizedText) return null;
            return sanitizedText.split('\n').map((line, lineIndex) => {
                const emojiRegex = /^(🎯|🔢|➡️|✅|💡|🔍|📝|📌|✔️|➕|➖|➗|✖️|🟰)\s*/;
                const match = line.match(emojiRegex);
                const emoji = match ? match[0] : null;
                const restOfLine = match ? line.substring(match[0].length) : line;
                return (
                    <div key={`${index}-${lineIndex}`} className="flex items-start mb-3">
                        {emoji && <span className="text-xl mr-3 mt-1">{emoji}</span>}
                        <div className={`flex-1 ${baseTextColor} leading-relaxed flex items-baseline flex-wrap`}>{renderLineWithMath(restOfLine)}</div>
                    </div>
                );
            });
        });
    }, [text, baseTextColor]);

    const renderLineWithMath = (line) => {
        const parts = line.split(/(\*\*.*?\*\*|\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g).filter(Boolean);
        return parts.map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) { return <strong key={partIndex}>{part.slice(2, -2)}</strong>; }
            if (part.startsWith('$$') && part.endsWith('$$')) { return <KatexRenderer key={partIndex} content={part.slice(2, -2)} isBlock={true} />; }
            if (part.startsWith('$') && part.endsWith('$')) { return <KatexRenderer key={partIndex} content={part.slice(1, -1)} isBlock={false} />; }
            return <span key={partIndex}>{part}</span>;
        });
    };

    return <div>{parsedContent}</div>;
};


const SolutionDisplay = ({ solution, subject }) => {
    if (!solution) return null;
    const { simplified_question, solution_steps, final_answer, recommendations } = solution;
    const cleanFinalAnswer = (answer) => answer ? answer.replace(/[\$\*]/g, '') : '';
    return (
        <div className="space-y-6 mt-6 pt-6 border-t border-slate-700">
            <div className="text-center"><h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">💡 {subject} Sorusu Çözümü</h2></div>
            {simplified_question && <div className="bg-slate-700/50 p-4 sm:p-5 rounded-lg border-l-4 border-amber-400"><h3 className="text-lg font-bold text-amber-300 mb-3">🤔 Soruyu Basitleştirelim!</h3><UniversalMathRenderer text={simplified_question} /></div>}
            {solution_steps && <div className="bg-slate-700/50 p-4 sm:p-5 rounded-lg border-l-4 border-sky-400"><h3 className="text-lg font-bold text-sky-300 mb-3">🚀 Çözüm Adımları:</h3><UniversalMathRenderer text={solution_steps} /></div>}
            {final_answer && <div className="flex justify-center items-center gap-3 p-4 bg-green-500/20 border border-green-500/30 rounded-lg"><h3 className="text-lg font-bold text-green-300">🎉 Nihai Cevap:</h3><div className="text-lg text-green-200"><KatexRenderer content={cleanFinalAnswer(final_answer)} isBlock={false} /></div></div>}
            {recommendations && <div className="bg-slate-700/50 p-4 sm:p-5 rounded-lg border-l-4 border-teal-400"><h3 className="text-lg font-bold text-teal-300 mb-3">📚 Berkant Hoca'dan Tavsiyeler!</h3><UniversalMathRenderer text={recommendations} /></div>}
        </div>
    );
};

const useSoruCozucu = () => {
    const [image, setImage] = useState(null); 
    const [imageBase64, setImageBase64] = useState(''); 
    const [selectedSubject, setSelectedSubject] = useState(null); 
    const [solution, setSolution] = useState(null); 
    const [status, setStatus] = useState('idle'); 
    const [loadingMessage, setLoadingMessage] = useState(''); 
    const [error, setError] = useState(''); 
    const fileInputRef = useRef(null);
    const [showAskTeacher, setShowAskTeacher] = useState(false); 
    const [teacherQuestion, setTeacherQuestion] = useState(''); 
    const [chatHistory, setChatHistory] = useState([]); 
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState(''); 
    const [showFeedbackButtons, setShowFeedbackButtons] = useState(true);

    const handleFileChange = (event) => { 
        const file = event.target.files[0]; 
        if (file) { 
            reset(); 
            setImage(URL.createObjectURL(file)); 
            const reader = new FileReader(); 
            reader.onloadend = () => setImageBase64(reader.result.split(',')[1]); 
            reader.onerror = () => setError('Dosya okunurken bir hata oluştu.'); 
            reader.readAsDataURL(file); 
        } 
    };

    const triggerFileSelect = () => fileInputRef.current?.click();

    const startSolutionProcess = async (userAnswer, correctionText = null) => { 
        if (!imageBase64 || !selectedSubject) { 
            setError('Lütfen önce bir resim yükleyip ders seçin.'); 
            return; 
        } 
        setStatus('loading'); 
        setLoadingMessage('Soru analiz ediliyor ve çözüm oluşturuluyor...'); 
        setError(''); 
        setSolution(null); 
        setShowFeedbackButtons(true);
        try { 
            const prompt = ` **PERSONA & ROL (ÇOK KATI):** Sen, ${selectedSubject} dersinde lise öğrencilerine pratik, sade ve adım adım çözümler sunan samimi bir öğretmensin. **GÖREV:** Verilen resmi ve ipuçlarını kullanarak, aşağıdaki 4 bölümü de eksiksiz ve istenen formatta doldurarak bir JSON nesnesi oluştur. **JSON ŞEMASI (ZORUNLU):** {"simplified_question": "...", "solution_steps": "...", "final_answer": "...", "recommendations": "..."} **İÇERİK KURALLARI:** 1.  **simplified_question**: Soruyu kendi kelimelerinle, samimi ve anlaşılır bir dille kısaca açıkla. 2.  **solution_steps**: Soruyu bir öğrencinin defterine yazacağı gibi, kısa ve öz adımlarla çöz. Her adımı yeni bir satıra yaz ('\\n' ile ayır). Her adımın başına dikkat çekici bir emoji (örn: 🎯, 🔢, ➡️, ✅) koy ve ardından adımın açıklamasını yaz. **Eğer çözüm birden fazla durumu (örn: Durum 1, Durum 2) içeriyorsa, her durumun başına ### Durum Başlığı ### formatında bir başlık ekle.** Çok uzun cümlelerden kaçın. 3.  **final_answer**: Bu alan, SADECE tek bir, tam ve geçerli bir matematiksel ifade içermelidir. Bu ifade, tek veya çift dolar işareti arasına alınmalıdır. ASLA açıklayıcı metin veya markdown formatı (**...**) içermemelidir. 4.  **recommendations**: Öğrencinin çözümünü ve (varsa) hatalarını analiz ederek, kişiselleştirilmiş, gerçekten faydalı ve eyleme dönük 2-3 tavsiye oluştur. Tavsiyeleri '\\n' ile ayır. **BAŞLIK KURALI (KATI):** Başlıkların (###...###) içine ASLA matematiksel ifade ($...$) veya markdown (**...**) koyma. Başlıklar sadece düz metin olmalıdır. **MATEMATİK FORMATLAMA (EN ÖNEMLİ VE KATI KURAL):** - **BÜTÜNLÜK (ATOMİKLİK):** Birbirine ait olan bir denklemi veya ifadeyi ASLA parçalara ayırma. Tüm ifade tek bir '$...$' veya '$$...$$' içinde olmalıdır. - **KAPSAM:** Sadece matematiksel ifadeler, değişkenler, sayılar ve semboller dolar işaretleri arasına alınmalıdır. Türkçe metinler DIŞARIDA kalmalıdır. - **BOŞLUK:** Türkçe kelime ile '$' arasında HER ZAMAN bir boşluk bırak. - **ALT İNDİS:** Değişkene alt indis eklerken \\text{} KULLANMA. Doğru: "$V_{Can}$". - **GEÇERLİ KOMUTLAR:** Sadece standart LaTeX komutlarını kullan (örn: \\neq, \\times, \\frac, \\Rightarrow, \\{, \\}). - **YASAKLI İFADELER (KURAL İHLALİ):** Cevaplarında ASLA 'eq', 'neq', 'ext{...}', 'coder 0', markdown formatı (**...**) veya bunlara benzer, standart LaTeX komutu olmayan anlamsız metinler üretme. BU BİR KURAL İHLALİDİR. - **JSON İÇİN ÇİFT TERS TAKSİM:** JSON çıktısı ürettiğin için, tüm LaTeX komutlarının (örn: '\\frac') önünde **MUTLAKA** çift ters taksim ('\\\\') olmalıdır. **İPUÇLARI:** - Ders: ${selectedSubject} - Kullanıcının Verdiği Cevap: ${userAnswer || "Belirtilmedi"} ${correctionText ? `- KULLANICI DÜZELTMESİ: "${correctionText}". Lütfen çözümünü bu yeni bilgiye göre düzelt.` : ''} `;
            const payload = { contents: [ { role: "user", parts: [ { text: prompt }, { inlineData: { mimeType: "image/jpeg", data: imageBase64 } } ] } ], generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { "simplified_question": { "type": "STRING" }, "solution_steps": { "type": "STRING" }, "final_answer": { "type": "STRING" }, "recommendations": { "type": "STRING" } }, required: ["simplified_question", "solution_steps", "final_answer", "recommendations"] } } };
            const apiKey = ""; const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`; 
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) { const errorBody = await response.text(); console.error("API Error Body:", errorBody); throw new Error(`API Hatası (${response.status})`); }
            const result = await response.json();
            if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) { const parsedJson = JSON.parse(result.candidates[0].content.parts[0].text); setSolution(parsedJson); setStatus('success'); } else { console.error("Unexpected API response structure:", result); throw new Error('API\'den beklenen formatta bir yanıt alınamadı.'); } 
        } catch (err) { console.error("Hata Detayı:", err); setError(`Bir hata oluştu: ${err.message}`); setStatus('error'); } finally { setLoadingMessage(''); } 
    };

    const reset = () => { setImage(null); setImageBase64(''); setSelectedSubject(null); setSolution(null); setStatus('idle'); setError(''); setShowAskTeacher(false); setChatHistory([]); setTeacherQuestion(''); setShowFeedbackButtons(true); setToastMessage(''); if (fileInputRef.current) fileInputRef.current.value = ""; };
    
    const handleAskTeacher = async () => {
        if (!teacherQuestion.trim()) return;
        const newChatHistory = [...chatHistory, { role: 'user', content: teacherQuestion }];
        setChatHistory(newChatHistory);
        const currentQuestion = teacherQuestion;
        setTeacherQuestion(''); 
        setIsChatLoading(true);
        try {
            const prompt = `Sen, bir önceki cevabı sen vermiş olan bir öğretmensin. Öğrencinin yazdığı yeni mesajı, SANA VERİLEN ORİJİNAL SORU RESMİNİ ve daha önce verdiğin çözümü dikkate alarak analiz et. **GÖREVLER:** 1.  **Analiz Et:** Öğrencinin mesajının bir soru mu yoksa bir teşekkür ifadesi mi ("teşekkür ederim", "sağ ol", "anladım" vb.) olduğunu anla. 2.  **Cevap Ver:** * **Eğer bir soru ise:** Soruyu, hem resimdeki hem de önceki çözümdeki bağlamı kullanarak, net ve basit bir dille, aşağıdaki matematik formatlama kurallarına uyarak cevapla. * **Eğer bir teşekkür ise:** "Rica ederim, ne demek! Anlamana sevindim. Unutma, sormaktan çekinme, her soru yeni bir öğrenme fırsatıdır. Başarılar dilerim! 😊" gibi samimi ve cesaretlendirici bir cevap ver. * **Eğer konu dışı ise:** "Sevgili öğrencim, benim amacım şu anki soruyu en iyi şekilde anlamana yardımcı olmak. Farklı bir konu hakkında yorum yapamam ama bu soruyla ilgili aklına takılan her şeyi memnuniyetle açıklarım!" şeklinde cevap ver. **MATEMATİK FORMATLAMA KURALI (ÇOK KATI):** - Cevaplarında ASLA kalın font (\`**...**\`) kullanma. - Sadece ve sadece matematiksel ifadeler, denklemler, değişkenler, sayılar ve semboller tek dolar '$...$' arasına alınmalıdır. - Açıklayıcı Türkçe metinler KESİNLİKLE dolar işaretlerinin DIŞINDA kalmalıdır. - Türkçe bir kelime ile matematiksel ifadenin başladığı '$' işareti arasında ve bittiği '$' işareti ile sonraki kelime arasında HER ZAMAN bir boşluk bırak. **ÖNCEKİ SORU VE ÇÖZÜMÜN (BAĞLAM İÇİN):** - Sorunun Basit Hali: ${solution.simplified_question} - Çözüm Adımları: ${solution.solution_steps} - Nihai Cevap: ${solution.final_answer} **ÖĞRENCİNİN YENİ MESAJI:** "${currentQuestion}"`;
            const payload = { contents: [ { role: "user", parts: [ { text: prompt }, { inlineData: { mimeType: "image/jpeg", data: imageBase64 } } ] } ] };
            const apiKey = ""; const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API Hatası (${response.status})`);
            const result = await response.json();
            const modelResponse = result.candidates[0].content.parts[0].text;
            setChatHistory(prev => [...prev, { role: 'model', content: modelResponse }]);
        } catch (err) { setChatHistory(prev => [...prev, { role: 'model', content: `Üzgünüm, bir hata oluştu: ${err.message}` }]); } finally { setIsChatLoading(false); }
    };
    const handleLike = () => { setToastMessage("Değerlendirmen için teşekkürler! Bu çözüm, gelecekteki sorular için referans olacaktır. ✨"); setShowFeedbackButtons(false); };
    
    return { image, selectedSubject, solution, status, loadingMessage, error, fileInputRef, handleFileChange, triggerFileSelect, setSelectedSubject, startSolutionProcess, reset, showAskTeacher, setShowAskTeacher, teacherQuestion, setTeacherQuestion, chatHistory, isChatLoading, handleAskTeacher, toastMessage, showFeedbackButtons, handleLike };
};


// Ana Soru Çözücü Sayfası Bileşeni
const SoruCozucuPage = ({ user, onLogout }) => {
    const { 
        image, selectedSubject, solution, status, loadingMessage, error, 
        fileInputRef, handleFileChange, triggerFileSelect, setSelectedSubject, 
        startSolutionProcess, reset, showAskTeacher, setShowAskTeacher, 
        teacherQuestion, setTeacherQuestion, chatHistory, isChatLoading, 
        handleAskTeacher, toastMessage, showFeedbackButtons, handleLike 
    } = useSoruCozucu();
    
    const subjects = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Edebiyat', 'Türkçe'];
    const [showCorrectionPrompt, setShowCorrectionPrompt] = useState(false);
    const [correctionText, setCorrectionText] = useState('');

    const handleReSolve = () => { 
        setShowCorrectionPrompt(false); 
        startSolutionProcess(null, correctionText); 
        setCorrectionText(''); 
    };

    return ( 
        <div className="w-full max-w-4xl mx-auto bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 text-slate-200"> 
            <header className="text-center mb-6 relative"> 
                <button onClick={onLogout} className="absolute top-0 right-0 -mt-2 -mr-2 px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full hover:bg-red-600 transition-colors shadow-lg">Çıkış Yap</button>
                <div className="flex justify-center mb-4"><div className="w-48 p-2 bg-white/10 rounded-lg shadow-lg"><img src="https://i.imgur.com/GtXn6lU.jpeg" alt="Soru Çözücü Logosu" className="rounded-md" onError={(e) => e.target.src='https://placehold.co/192x108/ccc/ffffff?text=Logo'} /></div></div> 
                <p className="halkali-title text-lg font-semibold mb-2">Her Soru, Yeni Bir Keşif</p> 
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">Soru Çözücü</h1> 
                <p className="text-base font-semibold bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent mt-2">Berkant Hoca</p> 
            </header> 
            <AlertDisplay message={error} type="error" />
            <div className="flex flex-col gap-6"> 
                <div className="w-full flex flex-col items-center justify-center bg-slate-900/50 p-4 sm:p-6 rounded-lg border-2 border-dashed border-slate-600"> 
                    {image ? ( 
                        <div className="w-full text-center">
                            <img src={image} alt="Yüklenen Soru" className="max-w-full max-h-60 mx-auto rounded-lg shadow-md" />
                            <button onClick={reset} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700">Yeni Soru Yükle</button>
                        </div> 
                    ) : ( 
                        <div className="text-center py-8 cursor-pointer w-full" onClick={triggerFileSelect}>
                            <svg className="mx-auto h-12 w-12 text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <p className="mt-2 text-sm font-medium text-slate-400">1. Adım: Fotoğraf Yükle</p>
                        </div> 
                    )} 
                    <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" /> 
                </div> 
                {image && !selectedSubject && status === 'idle' && ( <div className="w-full pt-4 border-t border-slate-700"><h2 className="text-lg font-semibold text-center text-slate-300 mb-3">2. Adım: Dersi Seç</h2><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">{subjects.map(subject => (<button key={subject} onClick={() => setSelectedSubject(subject)} className={`py-2 px-3 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base ${selectedSubject === subject ? 'rainbow-active' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{subject}</button>))}</div></div> )} 
                {selectedSubject && status === 'idle' && ( <div className="w-full pt-4 border-t border-slate-700 text-center"><h2 className="text-lg font-semibold text-slate-300 mb-4">3. Adım: Cevabı Seç ve Çözümü Başlat</h2><p className="text-sm text-slate-400 mb-4">Seçilen Ders: <span className="font-bold text-violet-400">{selectedSubject}</span></p><div className="flex justify-center items-center gap-3 flex-wrap">{['A', 'B', 'C', 'D', 'E'].map((option, index) => { const colors = ['bg-sky-500 hover:bg-sky-600', 'bg-emerald-500 hover:bg-emerald-600', 'bg-amber-500 hover:bg-amber-600', 'bg-rose-500 hover:bg-rose-600', 'bg-violet-500 hover:bg-violet-600']; return <button key={option} onClick={() => startSolutionProcess(option)} className={`answer-button w-12 h-12 flex items-center justify-center text-white font-bold text-lg rounded-full shadow-lg ${colors[index]}`}>{option}</button> })}</div><div className="mt-4"><button onClick={() => startSolutionProcess(null)} className="answer-button w-full sm:w-auto px-6 py-2 border-2 border-slate-500 text-slate-300 font-semibold rounded-full hover:bg-slate-700 hover:border-slate-400">Cevabı Bilmiyorum / Şık Yok</button></div></div> )} 
                {status === 'loading' && <LoadingIndicator message={loadingMessage} />} 
                {status === 'success' && solution && ( <>
                    <SolutionDisplay solution={solution} subject={selectedSubject} />
                    <div className="text-center pt-4"><button onClick={() => setShowAskTeacher(!showAskTeacher)} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-150">👩‍🏫 Öğretmene Sor</button></div>
                    {showAskTeacher && (
                       <div className="mt-6 bg-slate-900/50 p-5 rounded-xl border border-slate-700">
                            <h3 className="text-lg font-bold text-slate-200 mb-4 text-center">Aklına Takılan Bir Yer Mi Var?</h3>
                            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                                {chatHistory.map((chat, index) => (<div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${chat.role === 'user' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-200'}`}><UniversalMathRenderer text={chat.content} baseTextColor="text-slate-200" /></div></div>))}
                                {isChatLoading && <div className="flex justify-start"><div className="p-3 rounded-2xl bg-slate-700"><span className="animate-pulse text-slate-400">...</span></div></div>}
                            </div>
                            <div className="flex items-center gap-2">
                                <textarea value={teacherQuestion} onChange={(e) => setTeacherQuestion(e.target.value)} placeholder="Bu soruyla ilgili merak ettiklerini yaz..." className="w-full p-2 border border-slate-600 bg-slate-800 text-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none resize-none" rows="2" onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskTeacher(); } }} />
                                <button onClick={handleAskTeacher} disabled={isChatLoading || !teacherQuestion.trim()} className="bg-violet-600 text-white p-2 rounded-full hover:bg-violet-700 disabled:bg-slate-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                            </div>
                        </div>
                    )}
                    {showFeedbackButtons ? (<div className="mt-6 p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-center"><h3 className="font-semibold text-slate-200 mb-3">Çözüm Faydalı Oldu mu?</h3><div className="flex justify-center gap-4"><button onClick={handleLike} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">👍 Beğendim</button><button onClick={() => setShowCorrectionPrompt(true)} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">👎 Hatalı/Eksik</button></div></div>) : (toastMessage && (<AlertDisplay message={toastMessage} type="success" />))}
                </> )} 
                {showCorrectionPrompt && ( <div className="mt-6 p-5 text-center feedback-box"><h3 className="font-semibold text-indigo-100 mb-2 text-lg">Çözümü Geliştirmeme Yardım Et</h3><p className="text-sm text-indigo-200 mb-4">Lütfen gözden kaçırdığım veya yanlış yorumladığım noktayı yaz. Geri bildiriminle soruyu yeniden çözeceğim.</p><textarea className="w-full p-2 border bg-slate-200 text-gray-900 placeholder-gray-500 border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" rows="3" placeholder="Örn: Analizde üçgenin ikizkenar olduğunu belirtmemişsin..." value={correctionText} onChange={(e) => setCorrectionText(e.target.value)}></textarea><div className="flex justify-center gap-4 mt-4"><button onClick={handleReSolve} disabled={!correctionText || status === 'loading'} className="font-bold text-white px-4 py-2 rounded-lg transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-105 disabled:from-gray-400 disabled:to-gray-500 disabled:scale-100 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600">Gönder ve Yeniden Çöz</button><button onClick={() => setShowCorrectionPrompt(false)} className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all">Vazgeç</button></div></div> )} 
            </div> 
        </div> 
    );
};

export default SoruCozucuPage;
