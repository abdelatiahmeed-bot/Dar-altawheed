import React, { useEffect, useState } from 'react';

interface TimePickerProps {
  value: string; // "HH:mm" 24-hour format
  onChange: (time: string) => void;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('PM');

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        const p = h >= 12 ? 'PM' : 'AM';
        const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        setHour(displayH.toString());
        setMinute(m.toString().padStart(2, '0'));
        setPeriod(p);
      }
    }
  }, [value]);

  const handleChange = (newH: string, newM: string, newP: string) => {
    setHour(newH);
    setMinute(newM);
    setPeriod(newP);

    let h = parseInt(newH);
    if (newP === 'PM' && h !== 12) h += 12;
    if (newP === 'AM' && h === 12) h = 0;

    const timeStr = `${h.toString().padStart(2, '0')}:${newM}`;
    onChange(timeStr);
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  return (
    // Updated container styling
    <div className="flex gap-1 items-center bg-[#fdfcf8] border border-[#e6e2d3] rounded-xl p-1 shadow-sm w-full dir-ltr">
      {/* Hour Select */}
      <select
        className="flex-1 p-1 bg-transparent text-center font-bold text-[#3d2e18] focus:outline-none cursor-pointer"
        value={hour}
        onChange={(e) => handleChange(e.target.value, minute, period)}
      >
        {hours.map(h => <option key={h} value={h}>{h}</option>)}
      </select>

      <span className="text-[#a89060] font-bold pb-1">:</span>

      {/* Minute Select */}
      <select
        className="flex-1 p-1 bg-transparent text-center font-bold text-[#3d2e18] focus:outline-none cursor-pointer"
        value={minute}
        onChange={(e) => handleChange(hour, e.target.value, period)}
      >
        {minutes.map(m => <option key={m} value={m}>{m}</option>)}
      </select>

      {/* AM/PM Select */}
      <select
        className="flex-1 p-1 bg-[#f4f1ea] rounded-lg text-center font-bold text-xs text-[#5c6b48] focus:outline-none cursor-pointer border border-[#e6e2d3]"
        value={period}
        onChange={(e) => handleChange(hour, minute, e.target.value)}
      >
        <option value="AM">ص</option>
        <option value="PM">م</option>
      </select>
    </div>
  );
};