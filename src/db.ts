import { cert, initializeApp, ServiceAccount } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

import serviceAccountKey from "../serviceAccountKey.json";

// initialize Firebase
initializeApp({
  credential: cert(serviceAccountKey as ServiceAccount)
});
const db = getFirestore();


export async function registerGuildIfNotExists(guildId: string) {
  console.log(`Attempting to register Guild ${guildId} in database.`);

  const guildDoc = db.doc(`guilds/${guildId}`);
  return db.runTransaction(async (transaction) => {
    const guildDocData = await transaction.get(guildDoc);
    if (guildDocData.exists) {
      console.log(`ALREADY EXISTS: Guild ${guildId}`);
      return false;
    }
    transaction.create(guildDoc, { permissionRoleName: "Instructor" });
    console.log(`REGISTERED: Guild ${guildId}`);
    return true;
  });
}

export async function getLogChannel(
  guildId: string
): Promise<string | undefined> {
  const guild = await db.doc(`guilds/${guildId}/`).get();
  return guild.data()?.logChannelId;
}

export async function setLogChannel(
  guildId: string,
  logChannelId: string
): Promise<void> {
  await db.doc(`guilds/${guildId}/`).set({ logChannelId }, { merge: true });
}

export async function clearLogChannel(guildId: string): Promise<void> {
  await db
    .doc(`guilds/${guildId}/`)
    .update({ logChannelId: FieldValue.delete() });
}

export type ManifoldUser = {
  admin?: boolean,
  avatarUrl: string,
  balance: number,
  bio?: string,
  createdTime: number,
  creatorVolumeCached?: {
    allTime: number,
    daily: number,
    monthly: number,
    weekly: number
  },
  discordHandle: string
  id: string,
  name: string,
  username: string,
}

// returns manifold user id
export async function getManifoldUser(discordHandle: string): Promise<ManifoldUser | undefined> {
  const users = await db
    .collection(`/users`)
    .where("discordHandle", "==", discordHandle)
    .orderBy("createdTime", "desc")
    .limit(1)
    .get()

  const userPairs = users.docs.map((doc) => doc.data() as ManifoldUser);
  return userPairs[0];
}

export async function getRankings(): Promise<ManifoldUser[]> {
  const users = await db
    .collection("/users")
    .orderBy("balance", "desc")
    .get();

  return users.docs.map((doc) => doc.data() as ManifoldUser);
}

export async function incrementUserBalance(
  userId: string,
  delta: number
) {
  console.log("ADDING:", delta, "TO:", userId);

  const recipient = db.doc(`users/${userId}`);

  const pointsIncremented = await db.runTransaction(async (transaction) => {
    const recipientData = await transaction.get(recipient);

    const oldBalance: number = recipientData.get("balance");
    const newBalance = oldBalance + delta < 0 ? 0 : oldBalance + delta;

    transaction.update(recipient, { balance: newBalance });
    return newBalance - oldBalance;
  });

  return pointsIncremented;
}

export async function pay(
  donorUserId: string,
  recipientUserId: string,
  amount: number
) {
  const donor = db.doc(`users/${donorUserId}`);
  const recipient = db.doc(`users/${recipientUserId}`);

  const sentAmount = await db.runTransaction(async (transaction) => {
    const donorBalanceOld: number = (await transaction.get(donor)).get("balance");
    const recipientBalanceOld: number = (await transaction.get(recipient)).get("balance");

    const amountGiven = amount > donorBalanceOld ? donorBalanceOld : amount;

    transaction.update(donor, {
      balance: donorBalanceOld - amountGiven
    });
    transaction.update(recipient, {
      balance: recipientBalanceOld + amountGiven
    });
    return amountGiven;
  });

  return sentAmount;
}
