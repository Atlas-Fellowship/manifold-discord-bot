import { cert, initializeApp, ServiceAccount } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

import serviceAccountKey from "../../serviceAccountKey.json";

// initialize Firebase
initializeApp({
  credential: cert(serviceAccountKey as ServiceAccount)
});
const db = getFirestore();

type ManifoldUser = {
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
  discordHandle?: string
  id: string,
  name: string,
  username: string,
}

// returns manifold user id
export async function getManifoldUser(discordHandle: string): Promise<[string, ManifoldUser][]> {
  const users = await db
    .collection(`/users`)
    .where("discordHandle", "==", discordHandle)
    .orderBy("createdTime", "desc")
    .limit(1)
    .get()

  return users.docs.map((doc) => [doc.id, doc.data() as ManifoldUser]);
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

export async function getUserPoints(
  guildId: string,
  userId: string
): Promise<number | undefined> {
  const user = await db.doc(`guilds/${guildId}/users/${userId}`).get();
  return user.data()?.points;
}

export async function getRankings(guildId: string) {
  const users = await db
    .collection(`/users`)
    .orderBy("balance", "desc")
    .get()
    .then((snapshot) => snapshot.docs.map((doc) => [doc.id, doc.data()]));

  return users;
}

// get the ranking of a user
export async function getUserRank(
  guildId: string,
  userId: string
): Promise<number | null> {
  const users = await getRankings(guildId);

  const index = users.findIndex(([id]) => id === userId);

  return index === -1 ? null : index + 1;
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
  guildId: string,
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
      points: donorBalanceOld - amountGiven
    });
    transaction.update(recipient, {
      points: recipientBalanceOld + amountGiven
    });
    return amountGiven;
  });

  return sentAmount;
}
