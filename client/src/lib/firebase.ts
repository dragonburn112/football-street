import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, signInWithPopup, GoogleAuthProvider, signInAnonymously, onAuthStateChanged, User, updateProfile } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, onSnapshot, query, where, serverTimestamp, Timestamp, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
import { Group, PlayerCard, Match, CreateMatch, CreatePlayerCard, UnassignedPlayerCard, CreateUnassignedPlayerCard, PlayerFormData } from "@shared/schema";

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
// Configure the provider to get email and profile
provider.setCustomParameters({
  prompt: 'select_account'
});
provider.addScope('email');
provider.addScope('profile');

export const signInWithGoogle = async () => {
  try {
    console.log("🚀 TRYING POPUP SIGN-IN...");
    
    // Sign out any existing user (including anonymous users)
    if (auth.currentUser) {
      console.log("🔄 Signing out existing user:", {
        uid: auth.currentUser.uid,
        isAnonymous: auth.currentUser.isAnonymous
      });
      await auth.signOut();
    }
    
    // Try popup first (better for mobile)
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("✅ POPUP SIGN-IN SUCCESS:", {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      });
      return result.user;
    } catch (popupError: any) {
      console.log("⚠️ Popup failed, trying redirect:", popupError.code);
      
      // Fallback to redirect if popup fails
      if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
        console.log("🔄 Using redirect fallback...");
        await signInWithRedirect(auth, provider);
        console.log("✅ signInWithRedirect initiated");
      } else {
        throw popupError;
      }
    }
  } catch (error: any) {
    console.error("❌ GOOGLE SIGN-IN ERROR:", {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
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

export const updateUserProfile = async (displayName: string): Promise<void> => {
  try {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
    } else {
      throw new Error("No user is currently signed in");
    }
  } catch (error: any) {
    console.error("Update profile error:", error);
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
  
  // Remove automatic player card creation
  
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
    
    // Remove automatic player card creation
    
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

// Create a player card for a specific member (admin function)
export async function createPlayerCardForMember(groupId: string, memberUid: string, playerData: PlayerFormData, createdBy: User): Promise<PlayerCard> {
  try {
    // Check if player card already exists
    const existingCard = await getDoc(doc(db, 'groups', groupId, 'players', memberUid));
    if (existingCard.exists()) {
      throw new Error('Player card already exists for this member');
    }

    const cardData: Omit<PlayerCard, 'id'> = {
      ...playerData,
      uid: memberUid,
      goals: 0,
      assists: 0,
      mvps: 0,
      matchesPlayed: 0,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    // Use member's UID as the document ID
    await setDoc(doc(db, 'groups', groupId, 'players', memberUid), cardData);
    return { ...cardData, id: memberUid };
  } catch (error) {
    console.error('Error creating player card for member:', error);
    throw error;
  }
}

// Automatically create a player card when user joins group (deprecated - kept for backward compatibility)
export async function createAutoPlayerCard(groupId: string, user: User): Promise<PlayerCard> {
  try {
    // Check if player card already exists
    const existingCard = await getDoc(doc(db, 'groups', groupId, 'players', user.uid));
    if (existingCard.exists()) {
      return { id: user.uid, ...existingCard.data() } as PlayerCard;
    }

    const cardData: Omit<PlayerCard, 'id'> = {
      uid: user.uid,
      name: user.displayName || 'Player',
      profilePic: '⚽',
      pace: 75,
      shooting: 75,
      passing: 75,
      dribbling: 75,
      defense: 75,
      physical: 75,
      overall: 75, // Default rating
      goals: 0,
      assists: 0,
      mvps: 0,
      matchesPlayed: 0,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    // Use user's UID as the document ID
    await setDoc(doc(db, 'groups', groupId, 'players', user.uid), cardData);
    return { ...cardData, id: user.uid };
  } catch (error) {
    console.error('Error creating auto player card:', error);
    throw error;
  }
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
  }, (error) => {
    console.error('Error in group subscription:', error);
    callback(null);
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
  }, (error) => {
    console.error('Error in player cards subscription:', error);
    callback([]); // Return empty array on error
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
    teams[teamIndex].players.push(player.id);
    
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
  const selectedPlayers = allPlayers.filter(player => matchData.selectedPlayerIds.includes(player.id));
  
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

// Update group name (admin only)
export async function updateGroupName(groupId: string, newName: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);
  
  if (!groupSnap.exists()) {
    throw new Error('Group not found');
  }
  
  await updateDoc(groupRef, { name: newName });
}

// Remove member from group (admin only)
export async function removeMemberFromGroup(groupId: string, userId: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);
  
  if (!groupSnap.exists()) {
    throw new Error('Group not found');
  }
  
  const group = { id: groupSnap.id, ...groupSnap.data() } as Group;
  const updatedMembers = group.members.filter(member => member.uid !== userId);
  
  // Delete the user's player card if it exists
  try {
    await deleteDoc(doc(db, 'groups', groupId, 'players', userId));
  } catch (error) {
    // Player card might not exist, continue anyway
    console.log('No player card to delete for removed user');
  }
  
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

// Delete entire group (admin only)
export async function deleteGroup(groupId: string): Promise<void> {
  try {
    // First delete all subcollections (players and matches)
    const playersQuery = collection(db, 'groups', groupId, 'players');
    const playersSnapshot = await getDocs(playersQuery);
    const playerDeletes = playersSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    const matchesQuery = collection(db, 'groups', groupId, 'matches');
    const matchesSnapshot = await getDocs(matchesQuery);
    const matchDeletes = matchesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Wait for all subcollection deletions
    await Promise.all([...playerDeletes, ...matchDeletes]);
    
    // Finally delete the main group document
    await deleteDoc(doc(db, 'groups', groupId));
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
}

// Leave group (member function)
export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    
    if (!groupSnap.exists()) {
      throw new Error('Group not found');
    }
    
    const group = { id: groupSnap.id, ...groupSnap.data() } as Group;
    const updatedMembers = group.members.filter(member => member.uid !== userId);
    
    // Delete the user's player card if it exists
    try {
      await deleteDoc(doc(db, 'groups', groupId, 'players', userId));
    } catch (error) {
      // Player card might not exist, continue anyway
      console.log('No player card to delete for leaving user');
    }
    
    await updateDoc(groupRef, { members: updatedMembers });
  } catch (error) {
    console.error('Error leaving group:', error);
    throw error;
  }
}

// UNASSIGNED PLAYER CARDS MANAGEMENT

// Create an unassigned player card (admin function)
export async function createUnassignedPlayerCard(groupId: string, playerData: PlayerFormData, createdBy: User): Promise<UnassignedPlayerCard> {
  try {
    const cardData: Omit<UnassignedPlayerCard, 'id'> = {
      ...playerData,
      goals: 0,
      assists: 0,
      mvps: 0,
      matchesPlayed: 0,
      createdBy: createdBy.uid,
      createdAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(collection(db, 'groups', groupId, 'unassignedCards'), cardData);
    return { ...cardData, id: docRef.id };
  } catch (error) {
    console.error('Error creating unassigned player card:', error);
    throw error;
  }
}

// Get all unassigned player cards for a group
export async function getUnassignedPlayerCards(groupId: string): Promise<UnassignedPlayerCard[]> {
  const cardsQuery = collection(db, 'groups', groupId, 'unassignedCards');
  const querySnapshot = await getDocs(cardsQuery);
  
  const cards: UnassignedPlayerCard[] = [];
  querySnapshot.forEach(doc => {
    cards.push({ id: doc.id, ...doc.data() } as UnassignedPlayerCard);
  });
  
  return cards;
}

// Subscribe to real-time unassigned player card updates
export function subscribeToUnassignedPlayerCards(groupId: string, callback: (cards: UnassignedPlayerCard[]) => void) {
  const cardsQuery = collection(db, 'groups', groupId, 'unassignedCards');
  return onSnapshot(cardsQuery, (snapshot) => {
    const cards: UnassignedPlayerCard[] = [];
    snapshot.forEach(doc => {
      cards.push({ id: doc.id, ...doc.data() } as UnassignedPlayerCard);
    });
    callback(cards);
  });
}

// Assign an unassigned card to a member (admin function)
export async function assignPlayerCardToMember(groupId: string, unassignedCardId: string, memberUid: string): Promise<PlayerCard> {
  try {
    // Get the unassigned card
    const unassignedCardRef = doc(db, 'groups', groupId, 'unassignedCards', unassignedCardId);
    const unassignedCardSnap = await getDoc(unassignedCardRef);
    
    if (!unassignedCardSnap.exists()) {
      throw new Error('Unassigned card not found');
    }
    
    const unassignedCard = { id: unassignedCardSnap.id, ...unassignedCardSnap.data() } as UnassignedPlayerCard;
    
    // Check if member already has a player card
    const existingCard = await getDoc(doc(db, 'groups', groupId, 'players', memberUid));
    if (existingCard.exists()) {
      throw new Error('Member already has a player card');
    }
    
    // Create assigned player card
    const assignedCardData: Omit<PlayerCard, 'id'> = {
      uid: memberUid,
      name: unassignedCard.name,
      profilePic: unassignedCard.profilePic,
      pace: unassignedCard.pace,
      shooting: unassignedCard.shooting,
      passing: unassignedCard.passing,
      dribbling: unassignedCard.dribbling,
      defense: unassignedCard.defense,
      physical: unassignedCard.physical,
      overall: unassignedCard.overall,
      goals: unassignedCard.goals || 0,
      assists: unassignedCard.assists || 0,
      mvps: unassignedCard.mvps || 0,
      matchesPlayed: unassignedCard.matchesPlayed || 0,
      createdAt: unassignedCard.createdAt,
      updatedAt: serverTimestamp() as Timestamp,
    };
    
    // Create the assigned card and delete the unassigned one
    await setDoc(doc(db, 'groups', groupId, 'players', memberUid), assignedCardData);
    await deleteDoc(unassignedCardRef);
    
    return { ...assignedCardData, id: memberUid };
  } catch (error) {
    console.error('Error assigning player card to member:', error);
    throw error;
  }
}

// Delete an unassigned player card (admin function)
export async function deleteUnassignedPlayerCard(groupId: string, cardId: string): Promise<void> {
  await deleteDoc(doc(db, 'groups', groupId, 'unassignedCards', cardId));
}

// ===== MVP VOTING FUNCTIONS =====

// Open MVP voting for a match (admin function)
export async function openMVPVoting(groupId: string, matchId: string, adminUid: string): Promise<void> {
  const matchRef = doc(db, 'groups', groupId, 'matches', matchId);
  await updateDoc(matchRef, {
    'mvpVoting.isOpen': true,
    'mvpVoting.votes': {},
    'mvpVoting.votingOpenedBy': adminUid,
    'mvpVoting.votingClosedBy': null,
    'mvpVoting.mvpWinner': null,
    'mvpVoting.mvpVoteCount': null,
    updatedAt: serverTimestamp(),
  });
}

// Close MVP voting and determine winner (admin function)
export async function closeMVPVoting(groupId: string, matchId: string, adminUid: string): Promise<void> {
  const matchRef = doc(db, 'groups', groupId, 'matches', matchId);
  const matchDoc = await getDoc(matchRef);
  
  if (!matchDoc.exists()) {
    throw new Error('Match not found');
  }
  
  const match = { id: matchDoc.id, ...matchDoc.data() } as Match;
  const votes = match.mvpVoting?.votes || {};
  
  // Count votes for each player
  const voteCounts: Record<string, number> = {};
  Object.values(votes).forEach(votedPlayerUid => {
    voteCounts[votedPlayerUid] = (voteCounts[votedPlayerUid] || 0) + 1;
  });
  
  // Find winner (player with most votes)
  let mvpWinner = '';
  let mvpVoteCount = 0;
  Object.entries(voteCounts).forEach(([playerUid, count]) => {
    if (count > mvpVoteCount) {
      mvpWinner = playerUid;
      mvpVoteCount = count;
    }
  });
  
  // Update match with results
  await updateDoc(matchRef, {
    'mvpVoting.isOpen': false,
    'mvpVoting.votingClosedBy': adminUid,
    'mvpVoting.mvpWinner': mvpWinner,
    'mvpVoting.mvpVoteCount': mvpVoteCount,
    updatedAt: serverTimestamp(),
  });
  
  // Update winner's MVP count if there is a winner
  if (mvpWinner && mvpVoteCount > 0) {
    const playerRef = doc(db, 'groups', groupId, 'players', mvpWinner);
    const playerDoc = await getDoc(playerRef);
    if (playerDoc.exists()) {
      const currentMvps = playerDoc.data().mvps || 0;
      await updateDoc(playerRef, {
        mvps: currentMvps + 1,
        updatedAt: serverTimestamp(),
      });
    }
  }
}

// Vote for MVP (player function)
export async function voteForMVP(groupId: string, matchId: string, voterUid: string, votedPlayerUid: string): Promise<void> {
  const matchRef = doc(db, 'groups', groupId, 'matches', matchId);
  await updateDoc(matchRef, {
    [`mvpVoting.votes.${voterUid}`]: votedPlayerUid,
    updatedAt: serverTimestamp(),
  });
}

// ===== PLAYER STATS MANAGEMENT =====

// Update player goals and assists (admin function)
export async function updatePlayerStats(
  groupId: string, 
  playerUid: string, 
  statsUpdate: { goals?: number; assists?: number; matchesPlayed?: number }
): Promise<void> {
  const playerRef = doc(db, 'groups', groupId, 'players', playerUid);
  const updateData: any = {
    updatedAt: serverTimestamp(),
  };
  
  if (statsUpdate.goals !== undefined) {
    updateData.goals = statsUpdate.goals;
  }
  if (statsUpdate.assists !== undefined) {
    updateData.assists = statsUpdate.assists;
  }
  if (statsUpdate.matchesPlayed !== undefined) {
    updateData.matchesPlayed = statsUpdate.matchesPlayed;
  }
  
  await updateDoc(playerRef, updateData);
}

// Increment matches played for all players in a match (called when match starts)
export async function incrementMatchesPlayed(groupId: string, playerUids: string[]): Promise<void> {
  const batch = writeBatch(db);
  
  for (const playerUid of playerUids) {
    const playerRef = doc(db, 'groups', groupId, 'players', playerUid);
    const playerDoc = await getDoc(playerRef);
    
    if (playerDoc.exists()) {
      const currentMatches = playerDoc.data().matchesPlayed || 0;
      batch.update(playerRef, {
        matchesPlayed: currentMatches + 1,
        updatedAt: serverTimestamp(),
      });
    }
  }
  
  await batch.commit();
}

// Auth state listener
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}