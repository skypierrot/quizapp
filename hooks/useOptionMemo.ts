"use client";

import { useState } from 'react';

export function useOptionMemo(questionId: string) {
  const [optionsMemoText, setOptionsMemoText] = useState<Record<number, string | null>>({});
  const [editingOptionMemo, setEditingOptionMemo] = useState<Record<number, { localEditText: string }> | null>(null);
  const [showOptionMemoUI, setShowOptionMemoUI] = useState<Record<number, boolean>>({});
  const [loadingOptionMemo, setLoadingOptionMemo] = useState<Record<number, boolean>>({});

  const fetchOptionMemo = async (optionIndex: number) => {
    if (loadingOptionMemo[optionIndex] || optionsMemoText[optionIndex] !== undefined) return;
    setLoadingOptionMemo(prev => ({ ...prev, [optionIndex]: true }));
    try {
      const response = await fetch(`/api/wrong-note/option-memo?questionId=${questionId}&optionIndex=${optionIndex}`);
      if (!response.ok) {
        if (response.status === 404) {
          setOptionsMemoText(prev => ({ ...prev, [optionIndex]: '' }));
          return;
        }
        throw new Error('Failed to fetch option memo');
      }
      const data = await response.json();
      setOptionsMemoText(prev => ({ ...prev, [optionIndex]: data.memo || '' }));
    } catch {
      setOptionsMemoText(prev => ({ ...prev, [optionIndex]: '' }));
    } finally {
      setLoadingOptionMemo(prev => ({ ...prev, [optionIndex]: false }));
    }
  };

  const handleToggleOptionMemoUI = (optionIndex: number) => {
    const newShowState = !showOptionMemoUI[optionIndex];
    setShowOptionMemoUI(prev => ({ ...prev, [optionIndex]: newShowState }));
    if (newShowState && optionsMemoText[optionIndex] === undefined) {
      fetchOptionMemo(optionIndex);
    }
  };

  const handleEditOptionMemo = (optionIndex: number, value: string) => {
    setEditingOptionMemo(prev => ({
      ...prev,
      [optionIndex]: { localEditText: value }
    }));
  };

  const handleCancelEditOptionMemo = (optionIndex: number) => {
    setEditingOptionMemo(null);
  };

  const handleSaveOptionMemo = async (optionIndex: number) => {
    if (!editingOptionMemo || editingOptionMemo[optionIndex] === undefined) return;
    const memoToSave = editingOptionMemo[optionIndex].localEditText;
    setOptionsMemoText(prev => ({ ...prev, [optionIndex]: memoToSave }));
    setEditingOptionMemo(null);
    await fetch('/api/wrong-note/option-memo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, optionIndex, memo: memoToSave }),
    });
  };

  return {
    optionsMemoText,
    editingOptionMemo,
    showOptionMemoUI,
    loadingOptionMemo,
    fetchOptionMemo,
    handleToggleOptionMemoUI,
    handleEditOptionMemo,
    handleCancelEditOptionMemo,
    handleSaveOptionMemo,
  };
} 