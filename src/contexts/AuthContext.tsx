import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, getDocFromServer } from 'firebase/firestore';
import { auth, db, handleFirestoreError } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'staff' | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'staff' | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'system', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRole(userData.role === 'admin' ? 'admin' : 'staff');
          } else {
            // New user check for bootstrapped admin
            if (currentUser.email === 'talhasafi04@gmail.com') {
              setRole('admin');
              try {
                // Attempt to create the user doc since they are a bootstrapped admin
                const { setDoc } = await import('firebase/firestore');
                await setDoc(userDocRef, {
                  role: 'admin',
                  email: currentUser.email
                });
              } catch(e) {
                console.error("Failed to bootstrap user record", e);
              }
            } else {
              setRole('staff');
            }
          }
          setUser(currentUser);
        } catch (error) {
          handleFirestoreError(error, 'get' as any, 'users/' + currentUser.uid);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = () => firebaseSignOut(auth);

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
