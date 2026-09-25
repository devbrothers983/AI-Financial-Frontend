import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import ReduxProvider from "../providers/ReduxProvider";
import ThemeProvider from "../providers/ThemeProvider";
import PwaRegister from "../components/PwaRegister";
import InstallPrompt from "../components/InstallPrompt";


export const metadata = {
  title: "AI Financial Coach",
  description: "Get Financial Advice From AI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinCoach",
  },
};

export const viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className=" h-full"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-slate-950 transition-colors">
        <PwaRegister />
        <ThemeProvider>
          <ReduxProvider>

            {children}
            <InstallPrompt />
          </ReduxProvider>

          <ToastContainer
            position="top-right"
            autoClose={4000}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="colored"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
