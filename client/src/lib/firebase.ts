import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, onSnapshot, query, where, serverTimestamp, Timestamp, deleteDoc, updateDoc } from "firebase/firestore";
import { Group, PlayerCard, Match, CreateMatch } from "@shared/schema";

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
      isAdmin: true, // Group creator is admin
      joinedAt: now as any,
    }],
  };

  const docRef = await addDoc(collection(db, 'groups'), groupData);
  const group = { ...groupData, id: docRef.id };
  
  // Automatically create player card for group creator
  await createAutoPlayerCard(docRef.id, user);
  
  return group;
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
    const newMember = {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous',
      isAdmin: false, // New members are not admin by default
      joinedAt: new Date() as any,
    };
    
    const updatedMembers = [...group.members, newMember];
    await setDoc(doc(db, 'groups', group.id), { 
      ...group, 
      members: updatedMembers 
    });
    
    // Automatically create player card for new member
    await createAutoPlayerCard(group.id, user);
    
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

// Automatically create a player card when user joins group
export async function createAutoPlayerCard(groupId: string, user: User): Promise<PlayerCard> {
  const cardData: Omit<PlayerCard, 'id'> = {
    uid: user.uid,
    name: user.displayName || 'Player',
    club: 'Street FC', // Default club
    profilePic: '⚽',
    pace: 75,
    shooting: 75,
    passing: 75,
    dribbling: 75,
    defense: 75,
    physical: 75,
    overall: 75, // Default rating
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  // Use user's UID as the document ID
  await setDoc(doc(db, 'groups', groupId, 'players', user.uid), cardData);
  return { ...cardData, id: user.uid };
}

// Get all player cards for a group
export async function getGroupPlayerCards(groupId: string): Promise<PlayerCard[]> {
  const playersQuery = collection(db, 'groups', groupId, 'players');
  const querySnapshot = await getDocs(playersQuery);
  
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
  const playersQuery = collection(db, 'groups', groupId, 'players');
  return onSnapshot(playersQuery, (snapshot) => {
    const cards: PlayerCard[] = [];
    snapshot.forEach(doc => {
      cards.push({ id: doc.id, ...doc.data() } as PlayerCard);
    });
    callback(cards);
  });
}

// Update a player card (admin can update any card, user can only update their own)
export async function updatePlayerCard(groupId: string, playerId: string, updates: Partial<Omit<PlayerCard, 'id' | 'uid' | 'createdAt'>>, currentUser: User): Promise<void> {
  const updateData = {
    ...updates,
    updatedAt: serverTimestamp() as Timestamp,
  };
  await updateDoc(doc(db, 'groups', groupId, 'players', playerId), updateData);
}

// Delete a player card (admin only)
export async function deletePlayerCard(groupId: string, playerId: string): Promise<void> {
  await deleteDoc(doc(db, 'groups', groupId, 'players', playerId));
}

// Generate balanced teams based on player stats
function generateBalancedTeams(players: PlayerCard[], numberOfTeams: number): { name: string; players: string[]; totalStats: any }[] {
  // Sort players by overall rating in descending order
  const sortedPlayers = [...players].sort((a, b) => b.overall - a.overall);
  
  // Initialize teams
  const teams: { name: string; players: string[]; totalStats: any }[] = [];
  for (let i = 0; i < numberOfTeams; i++) {
    teams.push({
      name: `Team ${String.fromCharCode(65 + i)}`, // Team A, Team B, etc.
      players: [],
      totalStats: {
        pace: 0,
        shooting: 0,
        passing: 0,
        dribbling: 0,
        defense: 0,
        physical: 0,
        overall: 0,
      }
    });
  }
  
  // Distribute players using snake draft (1-2-3-3-2-1 pattern for 3 teams)
  sortedPlayers.forEach((player, index) => {
    const teamIndex = index % numberOfTeams;
    teams[teamIndex].players.push(player.uid);
    
    // Add to team stats
    teams[teamIndex].totalStats.pace += player.pace;
    teams[teamIndex].totalStats.shooting += player.shooting;
    teams[teamIndex].totalStats.passing += player.passing;
    teams[teamIndex].totalStats.dribbling += player.dribbling;
    teams[teamIndex].totalStats.defense += player.defense;
    teams[teamIndex].totalStats.physical += player.physical;
    teams[teamIndex].totalStats.overall += player.overall;
  });
  
  // Calculate average stats for each team
  teams.forEach(team => {
    const playerCount = team.players.length;
    if (playerCount > 0) {
      team.totalStats.pace = Math.round(team.totalStats.pace / playerCount);
      team.totalStats.shooting = Math.round(team.totalStats.shooting / playerCount);
      team.totalStats.passing = Math.round(team.totalStats.passing / playerCount);
      team.totalStats.dribbling = Math.round(team.totalStats.dribbling / playerCount);
      team.totalStats.defense = Math.round(team.totalStats.defense / playerCount);
      team.totalStats.physical = Math.round(team.totalStats.physical / playerCount);
      team.totalStats.overall = Math.round(team.totalStats.overall / playerCount);
    }
  });
  
  return teams;
}

// Create a new match with team generation
export async function createMatch(groupId: string, matchData: CreateMatch, allPlayers: PlayerCard[], user: User): Promise<Match> {
  // Get selected players
  const selectedPlayers = allPlayers.filter(player => matchData.selectedPlayerIds.includes(player.uid));
  
  // Generate balanced teams
  const teams = generateBalancedTeams(selectedPlayers, matchData.numberOfTeams);
  
  const fullMatchData: Omit<Match, 'id'> = {
    ...matchData,
    createdBy: user.uid,
    teams,
    status: "draft",
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  const docRef = await addDoc(collection(db, 'groups', groupId, 'matches'), fullMatchData);
  return { ...fullMatchData, id: docRef.id };
}

// Get all matches for a group
export async function getGroupMatches(groupId: string): Promise<Match[]> {
  const matchesQuery = collection(db, 'groups', groupId, 'matches');
  const querySnapshot = await getDocs(matchesQuery);
  
  const matches: Match[] = [];
  querySnapshot.forEach(doc => {
    matches.push({ id: doc.id, ...doc.data() } as Match);
  });
  
  return matches;
}

// Subscribe to real-time match updates
export function subscribeToGroupMatches(groupId: string, callback: (matches: Match[]) => void) {
  const matchesQuery = collection(db, 'groups', groupId, 'matches');
  return onSnapshot(matchesQuery, (snapshot) => {
    const matches: Match[] = [];
    snapshot.forEach(doc => {
      matches.push({ id: doc.id, ...doc.data() } as Match);
    });
    callback(matches);
  });
}

// Update a match (admin only)
export async function updateMatch(groupId: string, matchId: string, updates: Partial<Omit<Match, 'id' | 'createdBy' | 'createdAt'>>): Promise<void> {
  const updateData = {
    ...updates,
    updatedAt: serverTimestamp() as Timestamp,
  };
  await updateDoc(doc(db, 'groups', groupId, 'matches', matchId), updateData);
}

// Delete a match (admin only)
export async function deleteMatch(groupId: string, matchId: string): Promise<void> {
  await deleteDoc(doc(db, 'groups', groupId, 'matches', matchId));
}

// Promote user to admin (admin only)
export async function promoteToAdmin(groupId: string, userId: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);
  
  if (!groupSnap.exists()) {
    throw new Error('Group not found');
  }
  
  const group = { id: groupSnap.id, ...groupSnap.data() } as Group;
  const updatedMembers = group.members.map(member => 
    member.uid === userId ? { ...member, isAdmin: true } : member
  );
  
  await updateDoc(groupRef, { members: updatedMembers });
}

// Check if user is admin in group
export function isUserAdmin(group: Group, userId: string): boolean {
  const member = group.members.find(m => m.uid === userId);
  return member?.isAdmin === true;
}

// Shuffle teams in a match (admin only)
export async function shuffleMatchTeams(groupId: string, matchId: string, allPlayers: PlayerCard[]): Promise<void> {
  const matchRef = doc(db, 'groups', groupId, 'matches', matchId);
  const matchSnap = await getDoc(matchRef);
  
  if (!matchSnap.exists()) {
    throw new Error('Match not found');
  }
  
  const match = { id: matchSnap.id, ...matchSnap.data() } as Match;
  const selectedPlayers = allPlayers.filter(player => match.selectedPlayerIds.includes(player.uid));
  const newTeams = generateBalancedTeams(selectedPlayers, match.numberOfTeams);
  
  await updateDoc(matchRef, {
    teams: newTeams,
    updatedAt: serverTimestamp() as Timestamp,
  });
}

// Auth state listener
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}