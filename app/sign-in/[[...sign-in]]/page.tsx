import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
      <SignIn 
        path="/sign-in" 
        routing="path" 
        signUpUrl="/sign-up"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-md rounded-lg",
            headerTitle: "text-2xl font-bold text-center",
            headerSubtitle: "text-center"
          }
        }}
      />
    </div>
  );
} 