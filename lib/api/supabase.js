/**
 * Veri9 Supabase Authentication Module
 * Handles user registration, login, logout, and profile management
 * 
 * Setup: Create a free Supabase project at https://supabase.com
 * Add these environment variables:
 *   SUPABASE_URL=https://your-project.supabase.co
 *   SUPABASE_ANON_KEY=your-anon-key
 *   SUPABASE_SERVICE_KEY=your-service-key
 */

// Supabase configuration
// These will be replaced with actual values when you set up Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

/**
 * Client-side Supabase helper
 * This module provides functions for the frontend to interact with Supabase
 * The actual auth is handled client-side using the Supabase JS SDK
 */

// Auth state
let currentUser = null;

/**
 * Initialize Supabase client
 * Call this after the Supabase JS SDK is loaded
 */
function initSupabase() {
  if (typeof supabase === 'undefined') {
    console.warn('[Auth] Supabase SDK not loaded. Auth features disabled.');
    return null;
  }
  
  const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Listen for auth state changes
  client.auth.onAuthStateChange((event, session) => {
    if (session) {
      currentUser = session.user;
      updateUIForLoggedIn(session.user);
    } else {
      currentUser = null;
      updateUIForLoggedOut();
    }
  });
  
  return client;
}

/**
 * Sign up with email and password
 */
async function signUp(email, password, metadata = {}) {
  const client = getSupabaseClient();
  if (!client) return { error: 'Supabase not configured' };
  
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
  
  if (error) return { error: error.message };
  return { user: data.user };
}

/**
 * Sign in with email and password
 */
async function signIn(email, password) {
  const client = getSupabaseClient();
  if (!client) return { error: 'Supabase not configured' };
  
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) return { error: error.message };
  return { user: data.user, session: data.session };
}

/**
 * Sign in with Google
 */
async function signInWithGoogle() {
  const client = getSupabaseClient();
  if (!client) return { error: 'Supabase not configured' };
  
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/scanner.html'
    }
  });
  
  return { error: error?.message };
}

/**
 * Sign in with Apple
 */
async function signInWithApple() {
  const client = getSupabaseClient();
  if (!client) return { error: 'Supabase not configured' };
  
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: window.location.origin + '/scanner.html'
    }
  });
  
  return { error: error?.message };
}

/**
 * Sign out
 */
async function signOut() {
  const client = getSupabaseClient();
  if (!client) return;
  
  await client.auth.signOut();
  currentUser = null;
  window.location.href = '/login.html';
}

/**
 * Get current user
 */
function getCurrentUser() {
  return currentUser;
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
  return currentUser !== null;
}

/**
 * Update navigation UI based on auth state
 */
function updateUIForLoggedIn(user) {
  // Update nav actions
  const actions = document.querySelector('.nav-actions');
  if (actions) {
    const email = user.email || 'User';
    actions.innerHTML = `
      <span style="font-size:0.82rem;font-weight:600;color:var(--gray-600)">${email}</span>
      <button onclick="signOut()" class="btn-sm btn-outline">Sign Out</button>
    `;
  }
  
  // Save scan history to cloud
  syncScanHistory(user);
}

function updateUIForLoggedOut() {
  const actions = document.querySelector('.nav-actions');
  if (actions) {
    actions.innerHTML = `
      <a href="login.html" class="btn-sm btn-outline">Sign In</a>
      <a href="signup.html" class="btn-sm btn-primary">Get Started</a>
    `;
  }
}

/**
 * Sync local scan history to Supabase
 */
async function syncScanHistory(user) {
  const client = getSupabaseClient();
  if (!client || !user) return;
  
  const localHistory = JSON.parse(localStorage.getItem('veri9_history') || '[]');
  // In production, this would sync to a Supabase table
  // For now, we keep it in localStorage
}

/**
 * Get Supabase client instance
 */
function getSupabaseClient() {
  if (typeof supabase === 'undefined') return null;
  return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Export for module usage
if (typeof module !== 'undefined') {
  module.exports = { signUp, signIn, signOut, getCurrentUser, isLoggedIn };
}