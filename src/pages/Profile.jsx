import React, { useEffect, useRef, useState } from "react";
import dp from "../assets/dp.webp";
import { IoCameraOutline } from "react-icons/io5";
import { IoArrowBackSharp } from "react-icons/io5";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../main";
import { setUserData } from "../Redux/userSlice";

export default function Profile() {
  let userData = useSelector((state) => state.user.userData);
  let navigate = useNavigate();
  let dispatch = useDispatch();

  let [name, setname] = useState(userData?.name || "");
  let [forntend, setfrontend] = useState(userData?.image || dp);
  let [backend, setbackend] = useState(null);
  let [loading, setloading] = useState(false);

  let image = useRef();
  let previewUrl = useRef(null);
  let hasUnsavedChanges = useRef(false);

  useEffect(() => {
    if (!hasUnsavedChanges.current && userData) {
      setname(userData.name || "");
      setfrontend(userData.image || dp);
    }
  }, [userData]);

  useEffect(() => () => {
    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
    }
  }, []);

  const handleImage = (e) => {
    let file = e.target.files[0];

    if (file) {
      if (previewUrl.current) {
        URL.revokeObjectURL(previewUrl.current);
      }

      previewUrl.current = URL.createObjectURL(file);
      hasUnsavedChanges.current = true;
      setbackend(file);
      setfrontend(previewUrl.current);
    }
  };

  const handleProfile = async (e) => {
    e.preventDefault();
    setloading(true);

    const formData = new FormData();
    formData.append("name", name);
    if (backend) {
      formData.append("image", backend);
    }

    try {
      const result = await axios.put(`${serverUrl}/api/auth/profile`, formData, {
        withCredentials: true,
      });
      hasUnsavedChanges.current = false;
      setbackend(null);
      dispatch(setUserData(result.data));
      navigate("/");
    } finally {
      setloading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-[20px] bg-slate-200 px-4 py-24 sm:py-8">
      {/* Back button */}
      <div
        className="fixed left-5 top-5 cursor-pointer sm:left-10 sm:top-10"
        onClick={() => navigate("/")}
      >
        <IoArrowBackSharp className="size-7 text-gray-600" />
      </div>

      {/* Profile image */}
      <div
        className="relative rounded-full bg-white border-2 border-blue-400 shadow-lg shadow-gray-400"
        onClick={() => image.current.click()}
      >
        <div className="h-40 w-40 overflow-hidden rounded-full sm:h-[200px] sm:w-[200px]">
          <img
            src={forntend}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>

        <IoCameraOutline className="absolute bottom-4 right-7 text-3xl text-black-400" />
      </div>

      <form
        onSubmit={handleProfile}
        className="w-[95%] max-w-[500px] flex flex-col gap-[20px] items-center"
      >
        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={image}
          hidden
          onChange={handleImage}
        />

        {/* Name */}
        <input
          type="text"
          onChange={(e) => {
            hasUnsavedChanges.current = true;
            setname(e.target.value);
          }}
          value={name}
          placeholder="enter your name"
          className="w-[90%] outline-none border-2 border-sky-400 rounded-lg h-[50px] shadow-lg shadow-gray-400 px-[20px] py-[10px]"
        />

        {/* Username */}
        <input
          type="text"
          readOnly
          className="w-[90%] outline-none border-2 border-sky-400 rounded-lg h-[50px] shadow-lg shadow-gray-400 px-[20px] py-[10px] text-gray-500"
          value={userData?.username || ""}
        />

        {/* Email */}
        <input
          type="email"
          readOnly
          className="w-[90%] outline-none border-2 border-sky-400 rounded-lg h-[50px] shadow-lg shadow-gray-400 text-gray-500 px-[20px] py-[10px]"
          value={userData?.email || ""}
        />

        {/* Save */}
        <button
          type="submit"
          disabled={loading}
          className="w-[180px] h-[50px] shadow-lg shadow-gray-400 font-bold px-[10px] rounded-lg bg-cyan-500 hover:shadow-inner"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
