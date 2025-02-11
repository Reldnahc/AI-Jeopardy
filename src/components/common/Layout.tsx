import React from "react";
import ScrollToTop from "./ScrollToTop.tsx";
import Header from "./Header.tsx";
import Footer from "./Footer.tsx";

const Layout = ({ children }: { children: React.ReactNode }) => (
    <>
        <ScrollToTop />
        <Header />
        {children}
        <Footer />
    </>
);

export default Layout;
