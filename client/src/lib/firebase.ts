import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, onSnapshot, query, where, serverTimestamp, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithRedirect(auth, provider);
export const signInAsAnonymous = () => signInAnonymously(auth);

export interface Group {
  id: string;
  code: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp;
  members: GroupMember[];
}

export interface GroupMember {
  uid: string;
  displayName: string;
  joinedAt: Timestamp;
}

export interface PlayerCard {
  id: string;
  groupId: string;
  createdBy: string;
  name: string;
  position: string;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
  overall: number;
  isFusion: boolean;
  createdAt: Timestamp;
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
  const groupData: Omit<Group, 'id'> = {
    code,
    name: groupName,
    createdBy: user.uid,
    createdAt: serverTimestamp() as Timestamp,
    members: [{
      uid: user.uid,
      displayName: user.displayName || 'Anonymous',
      joinedAt: serverTimestamp() as Timestamp,
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
      joinedAt: serverTimestamp() as Timestamp,
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

// Auth state listener
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}