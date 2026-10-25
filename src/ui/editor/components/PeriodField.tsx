import React, { useId, useState } from 'react';
import { formatPeriod, isEmptyPeriod, MONTHS, parsePeriod, PeriodDraft, periodError } from '../../../domain/resume/period';

interface PeriodFieldProps {
  value: string;
  onChange: (value: string) => void;
  currentLabel: string;
}

const inputClass =
  'w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none disabled:bg-slate-100 disabled:text-slate-400';

const PeriodField: React.FC<PeriodFieldProps> = ({ value, onChange, currentLabel }) => {
  const id = useId();
  const [draft, setDraft] = useState<PeriodDraft>(() => parsePeriod(value));
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(parsePeriod(value));
  }
  const error = isEmptyPeriod(draft) ? null : periodError(draft);

  const emit = (next: string) => {
    setSyncedValue(next);
    onChange(next);
  };

  const update = (patch: Partial<PeriodDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (isEmptyPeriod(next)) emit('');
    else if (!periodError(next)) emit(formatPeriod(next));
  };

  const monthYear = (label: string, month: string, year: string, monthKey: keyof PeriodDraft, yearKey: keyof PeriodDraft, disabled = false) => (
    <fieldset className="space-y-1" disabled={disabled}>
      <legend className="text-sm font-medium text-slate-700">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        <select aria-label={`${label} month`} className={inputClass} value={month} onChange={(e) => update({ [monthKey]: e.target.value })}>
          <option value="">Month</option>
          {MONTHS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          aria-label={`${label} year`}
          className={inputClass}
          inputMode="numeric"
          maxLength={4}
          placeholder="Year"
          value={year}
          onChange={(e) => update({ [yearKey]: e.target.value.replace(/\D/g, '') })}
        />
      </div>
    </fieldset>
  );

  return (
    <div className="col-span-2 space-y-2">
      <div className="grid grid-cols-2 gap-4">
        {monthYear('Start', draft.startMonth, draft.startYear, 'startMonth', 'startYear')}
        {monthYear('End', draft.current ? '' : draft.endMonth, draft.current ? '' : draft.endYear, 'endMonth', 'endYear', draft.current)}
      </div>
      <label htmlFor={id} className="flex items-center gap-2 text-sm text-slate-700">
        <input id={id} type="checkbox" checked={draft.current} onChange={(e) => update({ current: e.target.checked })} />
        {currentLabel}
      </label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default PeriodField;
