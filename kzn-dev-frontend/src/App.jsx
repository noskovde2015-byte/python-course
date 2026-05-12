import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Shop from "./pages/Shop";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import LessonDetail from "./pages/LessonDetail";
import Problems from "./pages/Problems";
import ProblemDetail from "./pages/ProblemDetail";
import Leaderboard from "./pages/Leaderboard";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"                              element={<Home />} />
          <Route path="/login"                         element={<Login />} />
          <Route path="/register"                      element={<Register />} />
          <Route path="/shop"                          element={<Shop />} />
          <Route path="/courses"                       element={<Courses />} />
          <Route path="/courses/:id"                   element={<CourseDetail />} />
          <Route path="/courses/:id/lessons/:lessonId" element={<LessonDetail />} />
          <Route path="/problems"                      element={<Problems />} />
          <Route path="/problems/:id"                  element={<ProblemDetail />} />
          <Route path="/leaderboard"                   element={<Leaderboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}