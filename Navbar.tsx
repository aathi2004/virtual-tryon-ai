import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-black text-white p-4 flex gap-6">
      <Link to="/">Home</Link>
      <Link to="/tryon">Try On</Link>
      <Link to="/analytics">Analytics</Link>
    </nav>
  );
}