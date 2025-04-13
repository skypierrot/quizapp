import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { IOption } from './PasteForm/types';

interface RadioOptionsProps {
  options: IOption[];
  selectedAnswer: number | null;
  onSelectAnswer: (answer: number) => void;
}

export function RadioOptions({ options, selectedAnswer, onSelectAnswer }: RadioOptionsProps) {
  const handleValueChange = (value: string) => {
    onSelectAnswer(parseInt(value));
  };
  
  return (
    <RadioGroup
      value={selectedAnswer?.toString() || ""}
      onValueChange={handleValueChange}
      className="space-y-2"
    >
      {options.map((option, index) => (
        <div key={index} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
          <RadioGroupItem value={index.toString()} id={`option-${index}`} />
          <Label 
            htmlFor={`option-${index}`}
            className="cursor-pointer flex-grow text-sm font-medium text-gray-700"
          >
            {option.content}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
} 