import { storage } from "@/modules/shared/utils/storage";
const AUTH_KEY = "cenagem_auth_v1";
const USERS_KEY = "cenagem_users_v1";
const SEED_USERS = [
  { email: "admin@cenagem.ar", name: "Admin", role: "admin", password: "CENAGEM2025!" },
  { email: "residente@cenagem.ar", name: "Residente", role: "editor", password: "Demo123!" },
];
export function ensureSeed(){ if(!storage.get(USERS_KEY)){ storage.set(USERS_KEY, SEED_USERS);} }
export function getUser(){ return storage.get(AUTH_KEY, null); }
export function login(email, password){
  const users = storage.get(USERS_KEY, SEED_USERS);
  const u = users.find(u=>u.email.toLowerCase()===email.toLowerCase() && u.password===password);
  if (!u) return null; storage.set(AUTH_KEY, {email:u.email, name:u.name, role:u.role}); return getUser();
}
export function logout(){ storage.remove(AUTH_KEY); }
