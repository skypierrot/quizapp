import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-128px)]">
      <SignUp path="/sign-up" />
    </div>
  );
} 