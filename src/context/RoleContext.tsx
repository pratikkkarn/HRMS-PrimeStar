import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole, UserProfile, ROLE_PERMISSIONS, RolePermission, DEMO_USERS } from '../types/roles';

interface RoleContextType {
  currentRole: UserRole;
  currentUser: UserProfile;
  permissions: RolePermission;
  switchRole: (role: UserRole) => void;
  allDemoUsers: UserProfile[];
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('CEO');
  
  const currentUser = DEMO_USERS.find((u) => u.role === currentRole) || DEMO_USERS[0];
  const permissions = ROLE_PERMISSIONS[currentRole];

  const switchRole = (newRole: UserRole) => {
    setCurrentRole(newRole);
  };

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        currentUser,
        permissions,
        switchRole,
        allDemoUsers: DEMO_USERS,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
