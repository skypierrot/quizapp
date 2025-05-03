import * as React from 'react';
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface SubjectComboboxProps {
  subjectList: string[];
  value: string;
  onSelect: (value: string) => void;
  onCreate: (value: string) => Promise<void>;
}

export function SubjectCombobox({ subjectList, value, onSelect, onCreate }: SubjectComboboxProps) {
  const [input, setInput] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const handleSelect = (val: string) => {
    onSelect(val);
    setInput('');
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!input.trim()) return;
    await onCreate(input.trim());
    onSelect(input.trim());
    setInput('');
    setOpen(false);
  };

  const filtered = subjectList.filter(s => s.toLowerCase().includes(input.toLowerCase()));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full h-8 text-sm justify-between">
          {value || '과목 선택/입력'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0">
        <Command>
          <CommandInput
            value={input}
            onValueChange={setInput}
            placeholder="과목명 입력 또는 선택"
            className="h-8"
          />
          <CommandList>
            {filtered.map((s) => (
              <CommandItem key={s} value={s} onSelect={() => handleSelect(s)}>
                {s}
              </CommandItem>
            ))}
            {input && !subjectList.includes(input) && (
              <CommandItem onSelect={handleCreate} className="text-primary">
                + "{input}" 추가
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 