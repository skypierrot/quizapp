import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "white";
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "primary",
  className = ""
}) => {
  const sizeClass = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  }[size];
  
  const colorClass = {
    primary: "text-blue-600",
    secondary: "text-gray-600",
    white: "text-white"
  }[color];
  
  return (
    <div className={`flex justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-4 border-t-transparent ${sizeClass} ${colorClass}`}></div>
    </div>
  );
};

export default LoadingSpinner;
export { LoadingSpinner }; 