import React from "react";
import Header from "../common/header";


const PublicLayout = ({ children }) => {
  return (
    <>
      <Header isPrivate={false} />
      <main className="container mx-auto  ">{children}</main>
      
    </>
  );
};

export default PublicLayout;
