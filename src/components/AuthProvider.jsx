import { useEffect, useState } from "react";
import { AuthContext } from "../context";
import { auth } from "../firebase";

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    })
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser }}>
      {children}
    </AuthContext.Provider>
  )
}
