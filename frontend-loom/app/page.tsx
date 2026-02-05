'use client'
import React from "react";
import HomeIcon from "@mui/icons-material/Home";
import { IconButton } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LandingPage() {

  const router = useRouter()

  const handleNewMeeting = () => {
    const roomId = Math.random().toString(36).substring(2, 8); // 6 char roomId
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="h-screen w-screen bg-cover bg-[url('/bg.png')] bg-center text-white font-sans">

      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 bg-black/50">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold">VMeet</h2>
          <IconButton>
            <HomeIcon style={{ color: "white" }} />
          </IconButton>
        </div>
        <div className="flex gap-6">
          <p className="cursor-pointer hover:text-orange-400 transition-colors duration-200">Join as Guest</p>
          <p className="cursor-pointer hover:text-orange-400 transition-colors duration-200">Register</p>
          <p className="cursor-pointer hover:text-orange-400 transition-colors duration-200">Login</p>
        </div>
      </nav>

      <div className="flex justify-between items-center h-[80vh] px-11">
        <div className="text-4xl max-w-lg flex flex-col gap-6">
          <h1>
            <span className="text-orange-400">Connect</span> with your loved Ones
          </h1>
          <p className="text-lg">Cover a distance by VMeet</p>

          <div role="button" className="bg-orange-600 px-4 py-2 pt-1 rounded-2xl w-max hover:bg-orange-500 transition-colors duration-200">
            <Link href="/auth" className="text-white text-xl no-underline">
              Get Started
            </Link>
          </div>

          <div className="flex justify-center items-center  w-max px-2">



            <div className= " p-3 ml-30  ">

              <button
                onClick={handleNewMeeting}
                className="bg-gray-700  px-3 py-0.5 rounded-2xl w-max  text-white font-serif text-2xl"
              >
                New Meeting

              </button>
            </div>

            <div className="flex gap-2 items-center mt-2">
              <input
                type="text"
                placeholder="Enter join Code"
                className="px-2 py-0.5 rounded-lg bg-gray-700 placeholder-gray-300 text-white font-serif text-2xl"
              />
              <button className=" bg-blue-500 pl-3 pr-3 text-3xl rounded-lg hover:bg-blue-600 transition-colors duration-200">
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
