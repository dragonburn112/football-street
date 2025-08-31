import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, onSnapshot, query, where, serverTimestamp, Timestamp, deleteDoc, updateDoc } from "firebase/firestore";
import { Group, PlayerCard } from "@shared/schema";

const firebaseConfig = {
  apiKey: "AIzaSyDbLukHyz1FHkFvOK6Lyiq3IN7uP_fm9MM",
  authDomain: "footballstreet-2c7bb.firebaseapp.com",
  projectId: "footballstreet-2c7bb",
  storageBucket: "footballstreet-2c7bb.firebasestorage.app",
  messagingSenderId: "59591760301",
  appId: "1:59591760301:web:cce4aa07129481e997e924",
  measurementId: "G-9WY7BMG6T1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    await signInWithRedirect(auth, provider);
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const signInAsAnonymous = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result;
  } catch (error: any) {
    console.error("Anonymous sign-in error:", error);
    throw error;
  }
};

export interface GroupMember {
  uid: string;
  displayName: string;
  joinedAt: Timestamp;
}

// Generate a random 6-character group code
export function generateGroupCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a new group
export async function createGroup(groupName: string, user: User): Promise<Group> {
  const code = generateGroupCode();
  const now = new Date();
  const groupData: Omit<Group, 'id'> = {
    code,
    name: groupName,
    createdBy: user.uid,
    createdAt: serverTimestamp() as Timestamp,
    members: [{
      uid: user.uid,
      displayName: user.displayName || 'Anonymous',
      joinedAt: now as any, // Use regular Date instead of serverTimestamp inside array
    }],
  };

  const docRef = await addDoc(collection(db, 'groups'), groupData);
  return { ...groupData, id: docRef.id };
}

// Join an existing group
export async function joinGroup(code: string, user: User): Promise<Group | null> {
  const groupsQuery = query(collection(db, 'groups'), where('code', '==', code));
  const querySnapshot = await getDocs(groupsQuery);
  
  if (querySnapshot.empty) {
    return null;
  }

  const groupDoc = querySnapshot.docs[0];
  const group = { id: groupDoc.id, ...groupDoc.data() } as Group;
  
  // Check if user is already a member
  const isAlreadyMember = group.members.some(member => member.uid === user.uid);
  
  if (!isAlreadyMember) {
    const newMember: GroupMember = {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous',
      joinedAt: new Date() as any, // Use regular Date instead of serverTimestamp inside array
    };
    
    const updatedMembers = [...group.members, newMember];
    await setDoc(doc(db, 'groups', group.id), { 
      ...group, 
      members: updatedMembers 
    });
    
    return { ...group, members: updatedMembers };
  }
  
  return group;
}

// Get user's groups
export async function getUserGroups(userId: string): Promise<Group[]> {
  const groupsQuery = query(collection(db, 'groups'));
  const querySnapshot = await getDocs(groupsQuery);
  
  const userGroups: Group[] = [];
  querySnapshot.forEach(doc => {
    const group = { id: doc.id, ...doc.data() } as Group;
    const isMember = group.members.some(member => member.uid === userId);
    if (isMember) {
      userGroups.push(group);
    }
  });
  
  return userGroups;
}

// Create a player card in a group
export async function createPlayerCard(groupId: string, playerData: Omit<PlayerCard, 'id' | 'groupId' | 'createdBy' | 'createdAt'>, user: User): Promise<PlayerCard> {
  const cardData: Omit<PlayerCard, 'id'> = {
    ...playerData,
    groupId,
    createdBy: user.uid,
    createdAt: serverTimestamp() as Timestamp,
  };

  const docRef = await addDoc(collection(db, 'playerCards'), cardData);
  return { ...cardData, id: docRef.id };
}

// Get all player cards for a group
export async function getGroupPlayerCards(groupId: string): Promise<PlayerCard[]> {
  const cardsQuery = query(collection(db, 'playerCards'), where('groupId', '==', groupId));
  const querySnapshot = await getDocs(cardsQuery);
  
  const cards: PlayerCard[] = [];
  querySnapshot.forEach(doc => {
    cards.push({ id: doc.id, ...doc.data() } as PlayerCard);
  });
  
  return cards;
}

// Subscribe to real-time group updates
export function subscribeToGroup(groupId: string, callback: (group: Group | null) => void) {
  return onSnapshot(doc(db, 'groups', groupId), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Group);
    } else {
      callback(null);
    }
  });
}

// Subscribe to real-time player cards updates
export function subscribeToGroupPlayerCards(groupId: string, callback: (cards: PlayerCard[]) => void) {
  const cardsQuery = query(collection(db, 'playerCards'), where('groupId', '==', groupId));
  return onSnapshot(cardsQuery, (snapshot) => {
    const cards: PlayerCard[] = [];
    snapshot.forEach(doc => {
      cards.push({ id: doc.id, ...doc.data() } as PlayerCard);
    });
    callback(cards);
  });
}

// Update a player card
export async function updatePlayerCard(cardId: string, updates: Partial<Omit<PlayerCard, 'id' | 'groupId' | 'createdBy' | 'createdAt'>>): Promise<void> {
  await updateDoc(doc(db, 'playerCards', cardId), updates);
}

// Delete a player card
export async function deletePlayerCard(cardId: string): Promise<void> {
  await deleteDoc(doc(db, 'playerCards', cardId));
}

// Auth state listener
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}