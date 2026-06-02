import { createAdminClient } from "./supabase/server";
import type { Locale } from "./session";

const ADJECTIVES_EN = [
  "Grumpy", "Sneaky", "Wobbly", "Sleepy", "Cheeky", "Fluffy", "Spicy",
  "Snazzy", "Cranky", "Bouncy", "Mighty", "Silly", "Brave", "Cosmic",
  "Mellow", "Jazzy", "Nifty", "Plucky", "Quirky", "Snappy", "Zesty",
  "Dizzy", "Funky", "Goofy", "Happy", "Jolly", "Kooky", "Lively",
  "Moody", "Noble", "Peppy", "Quiet", "Rowdy", "Sassy", "Tipsy",
  "Wacky", "Zany", "Bubbly", "Clever", "Daring", "Eager", "Fierce",
  "Gentle", "Honest", "Loyal", "Witty", "Sunny", "Royal", "Tiny",
  "Mystic",
];

const ANIMALS_EN = [
  "Penguin", "Otter", "Walrus", "Hedgehog", "Llama", "Sloth", "Capybara",
  "Narwhal", "Axolotl", "Quokka", "Pangolin", "Ferret", "Badger", "Mongoose",
  "Flamingo", "Toucan", "Platypus", "Wombat", "Tapir", "Lemur", "Okapi",
  "Meerkat", "Manatee", "Possum", "Raccoon", "Hamster", "Beaver", "Bison",
  "Camel", "Cheetah", "Dolphin", "Eagle", "Falcon", "Gerbil", "Hyena",
  "Iguana", "Jaguar", "Koala", "Lobster", "Moose", "Newt", "Ostrich",
  "Panda", "Quail", "Rabbit", "Salamander", "Tortoise", "Vulture", "Walleye",
  "Yak",
];

const ADJECTIVES_TR = [
  "Sirin", "Komik", "Tatli", "Akilli", "Kivrak", "Hizli", "Yavas",
  "Cesur", "Sevimli", "Saskin", "Mutlu", "Uzgun", "Neseli", "Sakin",
  "Cilgin", "Hareketli", "Sessiz", "Konuskan", "Cömert", "Hirsli",
  "Gizemli", "Romantik", "Lezzetli", "Renkli", "Parlak", "Sicak",
  "Soguk", "Yumusak", "Sert", "Yepyeni", "Eski", "Modern", "Sik",
  "Seffaf", "Karanlik", "Aydinlik", "Bulanik", "Berrak", "Gevrek",
  "Sevecen", "Anlayisli", "Coskulu", "Vakur", "Gorkemli", "Mahcup",
  "Naif", "Mutevazi", "Aceleci", "Tembel", "Calikan",
];

const ANIMALS_TR = [
  "Kedi", "Kopek", "Aslan", "Kaplan", "Fil", "Zurafa", "Tavsan",
  "Sincap", "Kirpi", "Penguen", "Baykus", "Kartal", "Sahin", "Karga",
  "Serce", "Bulbul", "Papagan", "Kelebek", "Ari", "Karinca",
  "Yengec", "Yunus", "Balina", "Kopekbaligi", "Ahtapot", "Kaplumbaga",
  "Yilan", "Timsah", "Maymun", "Goril", "Panda", "Koala", "Kanguru",
  "Tilki", "Kurt", "Geyik", "Boga", "Inek", "At", "Esek",
  "Domuz", "Koyun", "Keci", "Tavuk", "Ordek", "Kugu", "Devekusu",
  "Flamingo", "Marti", "Sakal",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateUsername(locale: Locale = "en"): string {
  const num = Math.floor(Math.random() * 100);
  const [adjs, anims] = locale === "tr" ? [ADJECTIVES_TR, ANIMALS_TR] : [ADJECTIVES_EN, ANIMALS_EN];
  return `${pick(adjs)}${pick(anims)}${num}`;
}

export async function generateUniqueUsername(groupId: string, locale: Locale = "en"): Promise<string> {
  const sb = createAdminClient();
  for (let i = 0; i < 20; i++) {
    const candidate = generateUsername(locale);
    const { data } = await sb
      .from("users")
      .select("id")
      .eq("group_id", groupId)
      .eq("username", candidate)
      .is("archived_at", null)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${generateUsername(locale)}${Date.now().toString(36).slice(-4)}`;
}
