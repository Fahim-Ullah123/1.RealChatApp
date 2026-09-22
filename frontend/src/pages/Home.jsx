import React from "react";
import SideBar from "../components/SideBar";
import MessagesArea from "../components/MessagesArea";


export default function Home() {
  return (
    <div className="flex h-screen w-full flex-row overflow-hidden">
     <SideBar/>
     <MessagesArea/>
    </div>
  );
}
