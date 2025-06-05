import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, adminOnly=false }){
  const {user,loading}=useAuth();
  if(loading) return null;
  if(!user) return <Navigate to="/login" replace/>;
  if(adminOnly&&user.role!=="admin") return <Navigate to="/" replace/>;
  return children;
}
