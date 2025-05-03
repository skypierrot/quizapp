"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Option {
  value: string;
  label: string;
}

interface CascadingComboboxProps {
  options: Option[];
  value: string;
  onSelect: (value: string) => void;
  onCreate?: (value: string) => void; // Optional: Only if creation is allowed
  placeholder?: string;
  searchPlaceholder?: string;
  emptyStateMessage?: string;
  createLabel?: string;
  disabled?: boolean;
  isLoading?: boolean; // Optional: Loading state
}

export function CascadingCombobox({
  options,
  value,
  onSelect,
  onCreate,
  placeholder = "Select option...",
  searchPlaceholder = "Search option...",
  emptyStateMessage = "No option found.",
  createLabel = "Create",
  disabled = false,
  isLoading = false,
}: CascadingComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const selectedOption = options.find((option) => option.value.toLowerCase() === value.toLowerCase());

  const handleSelectOption = (currentValue: string) => {
    const selected = options.find(option => option.value.toLowerCase() === currentValue.toLowerCase());
    onSelect(selected ? selected.value : currentValue);
    setOpen(false);
    setInputValue("");
  };

  const handleCreateOption = () => {
    if (onCreate && inputValue.trim()) {
      onCreate(inputValue.trim());
      setOpen(false);
      setInputValue("");
    }
  };

  // Filter options based on input value
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Check if the current input value exactly matches an existing option's label or value
  const exactMatchExists = options.some(option => 
    option.label.toLowerCase() === inputValue.toLowerCase() || 
    option.value.toLowerCase() === inputValue.toLowerCase()
  );

  const showCreateOption = onCreate && inputValue.trim() && !exactMatchExists;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-8 text-sm font-normal"
          disabled={disabled || isLoading}
        >
          {isLoading ? "Loading..." : (selectedOption ? selectedOption.label : placeholder)}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
        <Command shouldFilter={false} > {/* Disable default filtering */} 
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {showCreateOption ? `No results for "${inputValue}".` : emptyStateMessage}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value} // Use value for CommandItem value
                  onSelect={handleSelectOption}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.toLowerCase() === option.value.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {showCreateOption && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreateOption}
                    value={`create-${inputValue}`}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {createLabel} "{inputValue}"
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 