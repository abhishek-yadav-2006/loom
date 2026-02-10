'use client'
import React, { useState } from "react";
import HomeIcon from "@mui/icons-material/Home";
import { IconButton } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { BACKEND_URL } from "@/config";

export default function LandingPage() {

  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");


  const handleNewMeeting = async () => {
    console.log('hi there welceme')
    try {

      const token = localStorage.getItem("token");
      const res = await axios.post(
      `${BACKEND_URL}/api/v1/meeting/create`,
      {}, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.data
    console.log("data , ", data)
    const roomId = data.meetingId;
    console.log(roomId)
    router.push(`/room/${roomId}`);
  } catch (err) {
    console.error("Failed to create meeting", err);
  }
};


const handleJoinMeeting = () => {
  if (!joinCode) return alert("Please enter a valid meeting code");
  router.push(`/room/${joinCode}`);
};

return (
  <div className="h-screen w-screen bg-cover bg-[url('/bg.png')] bg-center text-white font-sans">

    <nav className="flex justify-between items-center p-6 bg-black/50">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold">VMeet</h2>
        <IconButton>
          <HomeIcon style={{ color: "white" }} />
        </IconButton>
      </div>
      <div className="flex gap-6">
        <p className="cursor-pointer hover:text-orange-400 transition-colors duration-200">Join as Guest</p>
        <Link href="/auth/signup">
          <p className="cursor-pointer hover:text-orange-400 transition-colors duration-200">Register</p>
        </Link>
        <Link href="/auth/signin">
          <p className="cursor-pointer hover:text-orange-400 transition-colors duration-200">Login</p>
        </Link>
      </div>
    </nav>

    <div className="flex justify-between items-center h-[80vh] px-11">
      <div className="text-4xl max-w-lg flex flex-col gap-6">
        <h1>
          <span className="text-orange-400">Connect</span> with your loved Ones
        </h1>
        <p className="text-lg">Cover a distance by VMeet</p>

        {/* Get Started Button */}
        <div role="button" className="bg-orange-600 px-4 py-2 pt-1 rounded-2xl w-max hover:bg-orange-500 transition-colors duration-200">
          <Link href="/auth" className="text-white text-xl no-underline">
            Get Started
          </Link>
        </div>


        <div className="flex flex-col gap-4 mt-4">

          <button
            onClick={handleNewMeeting}
            className="bg-gray-700 px-4 py-2 rounded-2xl w-max text-white font-serif text-2xl hover:bg-gray-600 transition-colors duration-200"
          >
            New Meeting
          </button>

          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Enter join Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="px-2 py-1 rounded-lg bg-gray-700 placeholder-gray-300 text-white font-serif text-xl w-48"
            />
            <button
              onClick={handleJoinMeeting}
              className="bg-blue-500 px-4 py-1 text-xl rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              Join
            </button>
          </div>
        </div>

      </div>

      <div>
        <Image
          src="/mobile.png"
          alt="mobile preview"
          width={600}
          height={800}
          className="rounded-xl shadow-lg"
        />
      </div>
    </div>
  </div>
);
}
