import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ImageType = string | { url: string; hash?: string };

interface IOption {
  number: number;
  text: string;
  images: ImageType[];
}

interface IQuestionDetailProps {
  content: string;
  images?: ImageType[];
  options: IOption[];
  answer: number;
  explanation?: string;
  explanationImages?: ImageType[];
  tags?: string[];
}

const getImageUrl = (img: ImageType) => {
  if (!img) return "";
  const url = typeof img === "string" ? img : img.url;
  if (!url) return "";
  return url.startsWith("/images/uploaded/") ? url : `/images/uploaded/${url}`;
};

export const QuestionDetail: React.FC<IQuestionDetailProps> = ({
  content,
  images = [],
  options,
  answer,
  explanation,
  explanationImages = [],
  tags = [],
}) => (
  <div className="max-w-2xl mx-auto p-4 space-y-6">
    {/* 태그 */}
    {tags.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, idx) => (
          <Badge key={idx}>{tag}</Badge>
        ))}
      </div>
    )}

    {/* 문제 내용 */}
    <div>
      <h2 className="font-bold text-lg mb-2">문제</h2>
      <p className="whitespace-pre-wrap">{content}</p>
      {/* 문제 이미지 */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={getImageUrl(img)}
              alt={`문제 이미지 ${idx + 1}`}
              className="w-48 h-auto object-contain border rounded"
            />
          ))}
        </div>
      )}
    </div>

    {/* 선택지 */}
    <div>
      <h3 className="font-semibold mb-2">선택지</h3>
      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-md ${answer === idx ? "bg-black text-white" : "bg-gray-100"}`}
          >
            {idx + 1}. {opt.text}
            {/* 선택지 이미지 */}
            {opt.images && opt.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {opt.images.map((img, imgIdx) => (
                  <img
                    key={imgIdx}
                    src={getImageUrl(img)}
                    alt={`선택지${idx + 1} 이미지${imgIdx + 1}`}
                    className="w-24 h-24 object-contain border rounded"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    {/* 해설 */}
    {explanation && (
      <div>
        <h3 className="font-semibold mb-2">해설</h3>
        <p className="whitespace-pre-wrap">{explanation}</p>
      </div>
    )}

    {/* 해설 이미지 */}
    {explanationImages.length > 0 && (
      <div>
        <h3 className="font-semibold mb-2">해설 이미지</h3>
        <div className="flex flex-wrap gap-2">
          {explanationImages.map((img, idx) => (
            <img
              key={idx}
              src={getImageUrl(img)}
              alt={`해설 이미지 ${idx + 1}`}
              className="w-48 h-auto object-contain border rounded"
            />
          ))}
        </div>
      </div>
    )}
  </div>
); 