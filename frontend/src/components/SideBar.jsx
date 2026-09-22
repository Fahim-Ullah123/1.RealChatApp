import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dp from "../assets/dp.webp";
import { CiSearch } from "react-icons/ci";
import { IoLogOutOutline } from "react-icons/io5";
import {
  setotherusers,
  setselecteduser,
  setUserData,
} from "../Redux/userSlice";
import { serverUrl } from "../main";

export default function SideBar() {
  let { userData, otherUsers, selecteduser, onlineUsers } = useSelector((state) => state.user);
  const users = Array.isArray(otherUsers) ? otherUsers : [];
  const onlineUserIds = Array.isArray(onlineUsers) ? onlineUsers : [];
  let [search, setsearch] = useState(false);
  let [searchQuery, setSearchQuery] = useState("");
  let dispatch = useDispatch();
  let navigate = useNavigate();
  const visibleUsers = users.filter((user) =>
    (user?.name || "").toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  const handleLogout = async () => {
    try {
      await axios.post(
        `${serverUrl}/api/user/logout`,
        {},
        { withCredentials: true },
      );
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      dispatch(setUserData(null));
      dispatch(setotherusers(null));
      dispatch(setselecteduser(null));
      navigate("/Login", { replace: true });
    }
  };

  return (
    <aside className={`relative h-full w-full shrink-0 bg-slate-100 lg:w-[32%] ${selecteduser ? "hidden lg:block" : "block"}`}>
      <div className="flex h-52 w-full flex-col justify-center rounded-b-[30%] bg-cyan-500 shadow-lg shadow-gray-400 sm:h-[250px]">
        <div>
          <h1 className="px-5 text-xl text-white sm:px-8 sm:text-[25px]">Femo</h1>
        </div>

        <div className="flex w-full items-center justify-between">
          <h1 className="truncate px-5 text-xl font-bold text-gray-950 sm:px-8 sm:text-[25px]">
            Hy , {userData?.name}
          </h1>
          <button
            type="button"
            aria-label="Open profile"
            onClick={() => navigate("/Profile")}
            className="mr-4 h-12 w-12 shrink-0 overflow-hidden rounded-full sm:mr-0 sm:h-[60px] sm:w-[60px]"
          >
            <img
              src={userData?.image || dp}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
        <div className="px-5">
          {!search && (
            <button
              type="button"
              aria-label="Open search"
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-gray-100 sm:h-[60px] sm:w-[60px]"
              onClick={() => setsearch(true)}
            >
              <CiSearch className="w-[25px] h-[25px]" />
            </button>
          )}

          {search && (
            <div className="flex h-12 w-full items-center rounded-full bg-gray-100 px-5 shadow-lg shadow-gray-400 sm:h-[60px]">
              <CiSearch className="w-[25px] h-[25px] shrink-0" />
              <input
                autoFocus
                type="search"
                placeholder="Search users"
                className="w-full bg-transparent outline-none px-3 text-gray-900 placeholder:text-gray-500"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="h-[calc(100%-208px)] overflow-y-auto px-3 py-5 sm:h-[calc(100%-250px)] sm:px-4">
        {visibleUsers.map((user) => (
          <button
            type="button"
            key={user._id}
            onClick={() => dispatch(setselecteduser(user))}
            aria-pressed={selecteduser?._id === user._id}
            className={`mb-3 h-[60px] w-full flex items-center gap-3 rounded-full px-3 text-left shadow-[0_4px_6px_-1px_rgb(156_163_175_/_0.6)] transition ${
              selecteduser?._id === user._id
                ? "bg-cyan-500 text-white"
                : "bg-gray-100 hover:bg-gray-300"
            }`}
          >
            <div className="relative shrink-0">
              <img
                src={user.image || dp}
                alt={`${user.name}'s profile`}
                className="h-10 w-10 rounded-full object-cover"
              />
              {onlineUserIds.includes(String(user._id)) && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-gray-100 bg-green-500" />
              )}
            </div>
            <div className="min-w-0">
              <p
                className={`truncate font-semibold ${
                  selecteduser?._id === user._id ? "text-white" : "text-gray-900"
                }`}
              >
                {user.name}
              </p>
            </div>
          </button>
        ))}
        {searchQuery.trim() && !visibleUsers.length && (
          <p className="px-3 py-6 text-center text-sm text-gray-500">
            No users found for “{searchQuery.trim()}”.
          </p>
        )}
      </div>

      <button
        type="button"
        aria-label="Log out"
        onClick={handleLogout}
        className="absolute bottom-5 left-5 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg transition hover:bg-cyan-600"
      >
        <IoLogOutOutline className="h-6 w-6" />
      </button>
    </aside>
  );
}
