// _includes/limitCheck.js

import { doc, getDoc, updateDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { db, auth } from "./firebase-config.js";

// Di limitCheck.js

export async function checkStoryLimit(uid) {
  const limit = 1; // ← ganti sesuai kebutuhan user gratis
  const today = new Date().toISOString().slice(0, 10);

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return { allowed: true }; // mungkin login baru

  const userData = userSnap.data();
  const lastDate = userData.lastStoryDate;
  const isPremium = userData.isPremium;

  if (isPremium) return { allowed: true };

  if (lastDate !== today) {
    await updateDoc(userRef, {
      storyCountToday: 0,
      lastStoryDate: today
    });
    return { allowed: true };
  }

  if ((userData.storyCountToday || 0) >= limit) {
    return {
      allowed: false,
      message: `Batas cerita harian (${limit}) telah tercapai`
    };
  }

  return { allowed: true };
}

export async function incrementStoryCount(uid) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    storyCountToday: increment(1),
    lastStoryDate: new Date().toISOString().slice(0, 10),
    updatedAt: serverTimestamp()
  });
}
