import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole, UserProfile, ROLE_PERMISSIONS, RolePermission, DEMO_USERS, ROLE_EMPLOYEE_ID_MAP } from '../types/roles';

interface RoleContextType {
  currentRole: UserRole;
  currentUser: UserProfile;
  permissions: RolePermission;
  switchRole: (role: UserRole) => void;
  updateProfileOverride: (employeeId: string, updatedFields: Partial<UserProfile>) => void;
  allDemoUsers: UserProfile[];
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('CEO');
  const [profileOverrides, setProfileOverrides] = useState<Record<string, Partial<UserProfile>>>({});

  const defaultUser = DEMO_USERS.find((u) => u.role === currentRole) || DEMO_USERS[0];
  const activeEmpId = defaultUser.employeeId || ROLE_EMPLOYEE_ID_MAP[currentRole] || 'PS-001';

  const override = profileOverrides[activeEmpId] || {};

  const currentUser: UserProfile = {
    ...defaultUser,
    ...override,
  };

  const permissions = ROLE_PERMISSIONS[currentRole];

  const switchRole = (newRole: UserRole) => {
    setCurrentRole(newRole);
  };

  const updateProfileOverride = (employeeId: string, updatedFields: Partial<UserProfile>) => {
    setProfileOverrides((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        ...updatedFields,
      },
    }));
  };

  const allDemoUsers = DEMO_USERS.map((u) => {
    const empId = u.employeeId || ROLE_EMPLOYEE_ID_MAP[u.role] || '';
    const ovr = profileOverrides[empId];
    return ovr ? { ...u, ...ovr } : u;
  });

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        currentUser,
        permissions,
        switchRole,
        updateProfileOverride,
        allDemoUsers,
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
