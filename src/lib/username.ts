import { createAdminClient } from "./supabase/server";

const ADJECTIVES = [
  "Grumpy", "Sneaky", "Wobbly", "Sleepy", "Cheeky", "Fluffy", "Spicy",
  "Snazzy", "Cranky", "Bouncy", "Mighty", "Silly", "Brave", "Cosmic",
  "Mellow", "Jazzy", "Nifty", "Plucky", "Quirky", "Snappy", "Zesty",
  "Dizzy", "Funky", "Goofy", "Happy", "Jolly", "Kooky", "Lively",
  "Moody", "Noble", "Peppy", "Quiet", "Rowdy", "Sassy", "Tipsy",
  "Wacky", "Zany", "Bubbly", "Clever", "Daring", "Eager", "Fierce",
  "Gentle", "Honest", "Loyal", "Witty", "Sunny", "Royal", "Tiny",
  "Mystic",
];

const ANIMALS = [
  "Penguin", "Otter", "Walrus", "Hedgehog", "Llama", "Sloth", "Capybara",
  "Narwhal", "Axolotl", "Quokka", "Pangolin", "Ferret", "Badger", "Mongoose",
  "Flamingo", "Toucan", "Platypus", "Wombat", "Tapir", "Lemur", "Okapi",
  "Meerkat", "Manatee", "Possum", "Raccoon", "Hamster", "Beaver", "Bison",
  "Camel", "Cheetah", "Dolphin", "Eagle", "Falcon", "Gerbil", "Hyena",
  "Iguana", "Jaguar", "Koala", "Lobster", "Moose", "Newt", "Ostrich",
  "Panda", "Quail", "Rabbit", "Salamander", "Tortoise", "Vulture", "Walleye",
  "Yak",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateUsername(): string {
  const num = Math.floor(Math.random() * 100); // 0-99
  return `${pick(ADJECTIVES)}${pick(ANIMALS)}${num}`;
}

/**
 * Generate a username that doesn't collide with any active user in the
 * group. Retries up to a reasonable cap; if all attempts collide (very
 * unlikely with ~50*50*100 combinations) falls back to a timestamp suffix.
 */
export async function generateUniqueUsername(groupId: string): Promise<string> {
  const sb = createAdminClient();
  for (let i = 0; i < 20; i++) {
    const candidate = generateUsername();
    const { data } = await sb
      .from("users")
      .select("id")
      .eq("group_id", groupId)
      .eq("username", candidate)
      .is("archived_at", null)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${generateUsername()}${Date.now().toString(36).slice(-4)}`;
}
