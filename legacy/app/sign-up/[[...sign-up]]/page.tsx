import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
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