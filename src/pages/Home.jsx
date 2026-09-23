import React from "react";
import SideBar from "../components/SideBar";
import MessagesArea from "../components/MessagesArea";


export default function Home() {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-100">
     <SideBar/>
     <MessagesArea/>
    </div>
  );
}
