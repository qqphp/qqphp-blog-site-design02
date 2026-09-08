'use client';
import { useId, useState } from 'react';
export function AdminTags({
  value,
  onChange,
  label = '标签',
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  label?: string;
}) {
  const [input, setInput] = useState('');
  const id = useId();
  function add() {
    const tag = input.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setInput('');
  }
  return (
    <div className="admin-field admin-wide admin-tags">
      <label htmlFor={id}>{label}</label>
      <div className="admin-tag-input">
        <input
          id={id}
          value={input}
          placeholder={`输入${label}，按 Enter 添加`}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" disabled={!input.trim()} onClick={add}>
          添加{label}
        </button>
      </div>
      <ul>
        {value.map((tag, index) => (
          <li key={`${tag}-${index}`}>
            <span>{tag}</span>
            <button
              type="button"
              aria-label={`移除${label} ${tag}`}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
