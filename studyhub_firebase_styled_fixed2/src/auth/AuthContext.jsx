import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(true);
  useEffect(()=>onAuthStateChanged(auth, async u=>{
    if(u){
      const snap=await getDoc(doc(db,"users",u.uid));
      const role=snap.exists()? snap.data().role : "user";
      setUser({uid:u.uid,email:u.email,role});
    }else setUser(null);
    setLoading(false);
  }),[]);
  const register=async(e,p,c="")=>{
    const cred=await createUserWithEmailAndPassword(auth,e,p);
    await setDoc(doc(db,"users",cred.user.uid),{role:c==="ADMIN123"?"admin":"user"});
  };
  const login=(e,p)=>signInWithEmailAndPassword(auth,e,p);
  const logout=()=>signOut(auth);
  return <AuthContext.Provider value={{user,loading,register,login,logout}}>{!loading&&children}</AuthContext.Provider>
}
export const useAuth=()=>useContext(AuthContext);
