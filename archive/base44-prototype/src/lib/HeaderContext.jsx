import { createContext, useContext, useState } from "react";

const HeaderContext = createContext({ title: "", setTitle: () => {}, headerRight: null, setHeaderRight: () => {} });

export function HeaderProvider({ children }) {
  const [title, setTitle] = useState("");
  const [headerRight, setHeaderRight] = useState(null);
  return (
    <HeaderContext.Provider value={{ title, setTitle, headerRight, setHeaderRight }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  return useContext(HeaderContext);
}