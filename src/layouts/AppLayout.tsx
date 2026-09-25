import { Outlet } from "react-router-dom";
import Navbar from "@/layouts/Navbar";
import Footer from "@/layouts/Footer";
import { useCatalogBootstrap } from "@/features/catalog";

export default function AppLayout() {
  useCatalogBootstrap();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
