'use client';
import { useState } from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

export function AdminModelSelect({
  id,
  label,
  value,
  models,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  models: string[];
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState('');
  const items = [...new Set([value, ...models].filter(Boolean))];
  const matches = items.filter((item) =>
    item.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const custom =
    query.trim() && !items.includes(query.trim()) ? query.trim() : '';
  const available = custom ? [...matches, custom] : matches;
  return (
    <Combobox.Root
      items={available}
      filteredItems={available}
      value={value}
      inputValue={query}
      onInputValueChange={setQuery}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
      onOpenChange={(open) => {
        if (open) setQuery('');
      }}
    >
      <Combobox.Trigger
        id={id}
        className="admin-model-trigger"
        aria-label={label}
      >
        <span>{value || '选择或输入模型'}</span>
        <ChevronsUpDown size={16} />
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner
          sideOffset={6}
          align="start"
          className="admin-floating-positioner"
        >
          <Combobox.Popup className="admin-floating admin-model-popup">
            <div className="admin-model-search">
              <Search size={16} />
              <Combobox.Input
                aria-label={`搜索${label}或输入自定义名称`}
                placeholder="搜索模型，或输入自定义名称…"
              />
            </div>
            <p className="admin-model-count">
              {models.length
                ? `已获取 ${models.length} 个模型`
                : '可先获取模型列表，也可输入模型名称'}
            </p>
            <Combobox.List className="admin-model-options">
              {(item: string) => (
                <Combobox.Item
                  key={item}
                  value={item}
                  className="admin-model-option"
                >
                  <span>
                    {item === custom ? `使用自定义模型：${item}` : item}
                  </span>
                  <Combobox.ItemIndicator>
                    <Check size={16} />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
            <Combobox.Empty className="admin-empty">
              没有匹配的模型
            </Combobox.Empty>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
