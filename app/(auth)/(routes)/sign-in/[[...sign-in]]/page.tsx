import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-128px)]"> 
      <SignIn path="/sign-in" />
    </div>
  );
} 