// Short, human-friendly group code. Avoids ambiguous chars (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateGroupCode(len = 6): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}
