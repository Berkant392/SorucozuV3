import React from 'react';

/**
 * Kimlik doğrulama formları için standart, yeniden kullanılabilir input bileşeni.
 * @param {{
 * id: string,
 * type: string,
 * placeholder: string,
 * value: string,
 * onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
 * required?: boolean
 * }} props
 */
const AuthInput = ({ id, type, placeholder, value, onChange, required = true }) => {
  return (
    <div>
      <label htmlFor={id} className="sr-only">{placeholder}</label>
      <input 
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="mt-1 block w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-md shadow-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
      />
    </div>
  );
};

export default AuthInput;
