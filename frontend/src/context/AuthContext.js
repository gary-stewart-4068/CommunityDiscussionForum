import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Restore user state from localStorage if available
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {return null; // Return null to avoid parsing errors if the saved user is not valid JSON
    }
    try {
      return JSON.parse(savedUser);
    } catch (error) {
      localStorage.removeItem('user'); // Remove invalid JSON from localStorage
      return null;
    }
  });

  // Save user details and JWT after successful login
  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // Clear user details and JWT on logout
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);