import type { Locale } from "./session";
export type { Locale };

export const LOCALES: Locale[] = ["en", "tr"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
};

// All user-facing strings. Admin screens stay English (untranslated keys
// just return the English value).
const en = {
  // Brand / landing
  appName: "Group Therapy",
  appTagline: "Anonymous weekly task tracker for your circle. No emails, no tracking — just funny names and progress.",
  joinGroup: "Join a group",
  logIn: "Log in",
  createNewGroup: "Create a new group (admin)",
  joinAsCoadmin: "Join an existing group as co-admin",

  // Common
  cancel: "Cancel",
  back: "Back",
  save: "Save",
  continue: "Continue",
  delete: "Delete",
  done: "Done",
  notDone: "Not done",
  language: "Language",
  loading: "Loading...",
  checking: "Checking...",

  // Join
  joinTitle: "Join a group",
  joinSubtitle: "Enter the group code your admin gave you. The app will generate a username for you.",
  groupCode: "Group code",
  groupCodeExample: "e.g. KX72PW",
  yourUsername: "Your username",
  regenerate: "🎲 Regenerate",
  tryAnotherName: "🎲 Try another name",
  anonymousNote: "No one will know this is you unless you tell them.",
  pinLabel: "Choose a PIN (4+ digits)",
  pinHint: "You'll need your username + PIN to log in. Save them somewhere safe.",
  groupNotFound: "Group code not found.",
  usernameTaken: "Username just got taken — regenerate and try again.",
  joinButton: "Join group",

  // Login
  loginTitle: "Log in",
  asUser: "User",
  asAdmin: "Admin",
  username: "Username",
  pin: "PIN",
  password: "Password",

  // Bottom nav
  navToday: "Today",
  navHistory: "History",
  navGroup: "Group",
  navMe: "Me",

  // Today
  todayTitle: "Today",
  todaySubtitleLoggedInAs: "Logged in as {name}",
  noTasksYet: "No tasks yet. Add a personal one below, or hang tight for the admin.",
  doneToday: "Done today",
  notDoneToday: "Not done today",
  viewImage: "View image",
  hideImage: "Hide image",
  addPersonalTask: "+ Add a personal task",
  newPersonalTask: "New personal task",
  personalTaskNote: "Only visible to you. No one else sees it on the leaderboard task list.",
  title: "Title",
  description: "Description (optional)",
  frequency: "Frequency",
  daily: "Daily",
  weekly: "Weekly",
  minimumPerMilestone: "Minimum per milestone",
  addTask: "Add task",
  adding: "Adding...",
  sectionAssignedToYou: "Assigned to you",
  sectionGroupTasks: "Group tasks",
  sectionPersonal: "Your own tasks",
  sectionLongTerm: "Long-term goals",
  badgeForYou: "For you",
  badgeGroup: "Group",
  badgePersonal: "Personal",
  badgeLongTerm: "Long-term",
  allTime: "all-time",
  sectionReadingPlans: "Reading plans",
  toCatchUp: "to catch up",
  pickRangePrompt: "You haven't picked your {unit}s — claim some.",
  yourUnitsToday: "Your {unit}s:",

  // History
  historyTitle: "Your history",
  historySubtitle: "Only you can see this.",
  resetMyHistory: "Reset my history (hide everything before now)",
  noCompletions: "No completions yet.",

  // Leaderboard
  groupTitle: "Group",
  currentMilestoneSince: "Current milestone since {date}",
  byPerson: "By person",
  byTask: "By task",
  noOneInGroup: "No one in the group yet.",
  noTasksYetGroup: "No tasks yet.",
  noOneAssigned: "No one assigned.",

  // Profile
  meTitle: "Me",
  youAre: "You are",
  groupLine: "Group {code} · {name}",
  loggedInAs: "Logged in as: {kind}",
  loggedInAsUser: "user",
  loggedInAsAdmin: "admin",
  changeName: "🎲 Change name",
  changeNameHint: "Roll a new random username if you want to refresh your anonymous identity.",
  newName: "New name",
  rollAgain: "🎲 Roll again",
  keepHistory: "Keep history",
  freshStart: "Fresh start",
  renameExplain:
    "Keep: stats, history, and reading-plan allocations follow your new name. Fresh start: all completions and plan slots are released, you start over. Cannot be undone.",
  logOut: "Log out",
  languageSetting: "Language",
  languageHint: "Affects the app interface for you only. Other members keep their preference.",

  // Plans / cards
  planLabel: "Plan",
  dailyLabel: "Daily",
  dayOf: "Day {n}/{total}",

  // Plan page
  planClosed: "Closed",
  repeatingDaily: "Repeating daily",
  yourUnitsToday2: "Your {unit}s today",
  tapTilesHint: "Tap a free tile, then tap another to make a range. Tap your own tile to release it.",
  thisPlanIsClosed: "This plan is closed.",
  selection: "Selection",
  selectionTrailingHint: "(tap another tile to set end, or claim single)",
  assignTo: "Assign to",
  pickMember: "— pick member —",
  claim: "Claim",
  assign: "Assign",
};

const tr: Partial<typeof en> = {
  appName: "Grup Terapisi",
  appTagline:
    "Arkadaş grubunuz için anonim haftalık görev takipçisi. E-posta yok, takip yok — sadece komik isimler ve ilerleme.",
  joinGroup: "Gruba katıl",
  logIn: "Giriş yap",
  createNewGroup: "Yeni grup oluştur (yönetici)",
  joinAsCoadmin: "Mevcut bir gruba yardımcı yönetici olarak katıl",

  cancel: "İptal",
  back: "Geri",
  save: "Kaydet",
  continue: "Devam",
  delete: "Sil",
  done: "Bitti",
  notDone: "Bitmedi",
  language: "Dil",
  loading: "Yükleniyor...",
  checking: "Kontrol ediliyor...",

  joinTitle: "Gruba katıl",
  joinSubtitle: "Yöneticinin verdiği grup kodunu gir. Uygulama sana bir kullanıcı adı oluşturacak.",
  groupCode: "Grup kodu",
  groupCodeExample: "ör. KX72PW",
  yourUsername: "Kullanıcı adın",
  regenerate: "🎲 Yenile",
  tryAnotherName: "🎲 Başka bir isim dene",
  anonymousNote: "Sen söylemediğin sürece kimse senin olduğunu bilmeyecek.",
  pinLabel: "Bir PIN seç (4+ basamak)",
  pinHint: "Giriş için kullanıcı adın + PIN gerekecek. Güvenli bir yere not et.",
  groupNotFound: "Grup kodu bulunamadı.",
  usernameTaken: "Bu kullanıcı adı az önce başkası tarafından alındı — yenile ve tekrar dene.",
  joinButton: "Gruba katıl",

  loginTitle: "Giriş yap",
  asUser: "Üye",
  asAdmin: "Yönetici",
  username: "Kullanıcı adı",
  pin: "PIN",
  password: "Şifre",

  navToday: "Bugün",
  navHistory: "Geçmiş",
  navGroup: "Grup",
  navMe: "Ben",

  todayTitle: "Bugün",
  todaySubtitleLoggedInAs: "{name} olarak giriş yaptın",
  noTasksYet: "Henüz görev yok. Aşağıdan kişisel bir görev ekle veya yöneticinin atamasını bekle.",
  doneToday: "Bugün yapıldı",
  notDoneToday: "Bugün yapılmadı",
  viewImage: "Resmi göster",
  hideImage: "Resmi gizle",
  addPersonalTask: "+ Kişisel görev ekle",
  newPersonalTask: "Yeni kişisel görev",
  personalTaskNote: "Sadece sen görürsün. Grup listesinde başkasına görünmez.",
  title: "Başlık",
  description: "Açıklama (isteğe bağlı)",
  frequency: "Sıklık",
  daily: "Günlük",
  weekly: "Haftalık",
  minimumPerMilestone: "Dönem başına minimum",
  addTask: "Görev ekle",
  adding: "Ekleniyor...",
  sectionAssignedToYou: "Sana atananlar",
  sectionGroupTasks: "Grup görevleri",
  sectionPersonal: "Kendi görevlerin",
  sectionLongTerm: "Uzun vadeli hedefler",
  badgeForYou: "Sana",
  badgeGroup: "Grup",
  badgePersonal: "Kişisel",
  badgeLongTerm: "Uzun vadeli",
  allTime: "tüm zamanlar",
  sectionReadingPlans: "Okuma planları",
  toCatchUp: "tamamlanacak",
  pickRangePrompt: "Henüz {unit} seçmedin — buradan seç.",
  yourUnitsToday: "Bugünkü {unit}lerin:",

  historyTitle: "Geçmişin",
  historySubtitle: "Bunu sadece sen görürsün.",
  resetMyHistory: "Geçmişimi sıfırla (şimdiye kadar olanları gizle)",
  noCompletions: "Henüz tamamlanmış bir şey yok.",

  groupTitle: "Grup",
  currentMilestoneSince: "Bu dönem {date}'den beri sürüyor",
  byPerson: "Kişiye göre",
  byTask: "Göreve göre",
  noOneInGroup: "Henüz grupta kimse yok.",
  noTasksYetGroup: "Henüz görev yok.",
  noOneAssigned: "Atanmış kimse yok.",

  meTitle: "Ben",
  youAre: "Sen",
  groupLine: "Grup {code} · {name}",
  loggedInAs: "Giriş türü: {kind}",
  loggedInAsUser: "üye",
  loggedInAsAdmin: "yönetici",
  changeName: "🎲 İsmi değiştir",
  changeNameHint: "Anonim kimliğini yenilemek istersen yeni bir kullanıcı adı seç.",
  newName: "Yeni isim",
  rollAgain: "🎲 Tekrar dene",
  keepHistory: "Geçmişi koru",
  freshStart: "Sıfırdan başla",
  renameExplain:
    "Geçmişi koru: istatistikler, geçmiş ve okuma planı atamaları yeni ismine taşınır. Sıfırdan başla: tüm tamamlamalar ve plan atamaların serbest bırakılır, sıfırdan başlarsın. Geri alınamaz.",
  logOut: "Çıkış yap",
  languageSetting: "Dil",
  languageHint: "Sadece senin için arayüz dilini değiştirir. Diğer üyeler kendi seçimlerini korur.",

  planLabel: "Plan",
  dailyLabel: "Günlük",
  dayOf: "Gün {n}/{total}",

  planClosed: "Kapalı",
  repeatingDaily: "Her gün tekrarlanan",
  yourUnitsToday2: "Bugünkü {unit}lerin",
  tapTilesHint: "Boş bir kutuya dokun, sonra başka birine dokunarak aralık seç. Kendi kutuna dokunarak bırakabilirsin.",
  thisPlanIsClosed: "Bu plan kapalı.",
  selection: "Seçim",
  selectionTrailingHint: "(bitişi seçmek için başka bir kutuya dokun, ya da tek seç)",
  assignTo: "Şuna ata",
  pickMember: "— üye seç —",
  claim: "Al",
  assign: "Ata",
};

type Key = keyof typeof en;

export function t(key: Key, locale: Locale = "en", params?: Record<string, string | number>): string {
  const table = locale === "tr" ? { ...en, ...tr } : en;
  let s = (table as Record<string, string>)[key] ?? en[key] ?? String(key);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}
