import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CoachLauncher from "@/components/coach/CoachLauncher";

export default function MarketingLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* shows only for signed-in users, e.g. on Help & Support from the sidebar */}
      <CoachLauncher />
    </>
  );
}
