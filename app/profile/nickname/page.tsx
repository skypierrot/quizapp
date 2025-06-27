"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NicknamePage() {
  const [nickname, setNickname] = useState("");
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/profile/nickname")
      .then(res => res.json())
      .then(data => {
        setNickname(data.nickname || "");
        setInput(data.nickname || "");
      });
  }, []);

  const handleSave = async () => {
    setMessage("");
    const res = await fetch("/api/profile/nickname", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: input }),
    });
    const data = await res.json();
    if (res.ok) {
      setNickname(input);
      setMessage("닉네임이 저장되었습니다.");
      setTimeout(() => router.push("/"), 1000);
    } else {
      setMessage(data.message || "오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <h2 className="text-2xl font-bold mb-4">닉네임 설정</h2>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        className="border p-2 rounded w-full mb-2"
        placeholder="닉네임을 입력하세요"
        maxLength={16}
      />
      <button
        onClick={handleSave}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        저장
      </button>
      <div className="text-sm text-gray-500 mt-2">{message}</div>
      <div className="mt-4 text-gray-700">현재 닉네임: <b>{nickname}</b></div>
    </div>
  );
} 