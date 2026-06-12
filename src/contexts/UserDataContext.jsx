import React, { createContext, useContext } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';

// One Supabase fetch per session, shared across all in-app routes.
// Previously useSupabaseData was called inside Dashboard; with the IA split
// we'd have called it once per page if each page hooked independently.
const UserDataContext = createContext(null);

export const UserDataProvider = ({ authUser, children }) => {
  const data = useSupabaseData(authUser);
  return <UserDataContext.Provider value={data}>{children}</UserDataContext.Provider>;
};

export const useUserData = () => {
  const ctx = useContext(UserDataContext);
  if (!ctx) {
    throw new Error('useUserData must be used inside <UserDataProvider>');
  }
  return ctx;
};
