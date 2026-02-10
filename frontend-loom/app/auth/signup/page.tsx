'use client'
import { useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { BACKEND_URL } from "../../../config"

export default function SignUp() {
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleRegister = async () => {
    try {
      const username = nameRef.current?.value;
      const email = emailRef.current?.value;
      const password = passwordRef.current?.value;

      if (!username || !email || !password) return 

      const res = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
        username,
        email,
        password,
      });

      console.log(res);

      console.log("Success:", res.data);
      router.push("/auth/signin");
    } catch (err: any) {
      console.error("Error:", err.response?.data?.message || err.message);
      
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
      <div className="flex flex-col gap-4 bg-gray-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Sign Up</h2>

        <input
          type="text"
          placeholder="username"
          ref={nameRef}
          className="p-2 rounded bg-gray-700 text-white placeholder-gray-400"
        />
        <input
          type="email"
          placeholder="Email"
          ref={emailRef}
          className="p-2 rounded bg-gray-700 text-white placeholder-gray-400"
        />
        <input
          type="password"
          placeholder="Password"
          ref={passwordRef}
          className="p-2 rounded bg-gray-700 text-white placeholder-gray-400"
        />

        <button
          onClick={handleRegister}
          className="bg-orange-600 p-2 rounded hover:bg-orange-500 transition-colors"
        >
          Register
        </button>
      </div>
    </div>
  );
}
