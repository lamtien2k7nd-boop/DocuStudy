const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const DiscordStrategy = require('passport-discord-auth').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { get, run } = require('./database');

// Serialize/Deserialize user
// Serialize user (lưu vào session)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user (lấy từ session)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [id]);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || `${profile.id}@google.user`;
      let user = await get('SELECT * FROM users WHERE email = ?', [email]);
      
      if (!user) {
        const result = await run(
          'INSERT INTO users (username, email, full_name, avatar_url, role) VALUES (?, ?, ?, ?, ?)',
          [profile.id, email, profile.displayName || 'Google User', profile.photos?.[0]?.value || '/images/default-avatar.png', 'user']
        );
        user = await get('SELECT * FROM users WHERE id = ?', [result.lastID]);
      }
      
      // ✅ QUAN TRỌNG: Lưu user vào session thông qua passport
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));
//Facebook
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'email', 'photos']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || `${profile.id}@facebook.user`;
      let user = await get('SELECT * FROM users WHERE email = ?', [email]);
      
      if (!user) {
        const result = await run(
          'INSERT INTO users (username, email, full_name, avatar_url, role) VALUES (?, ?, ?, ?, ?)',
          [
            profile.id,
            email,
            profile.displayName || 'Facebook User',
            profile.photos?.[0]?.value || '/images/default-avatar.png',
            'user'
          ]
        );
        user = await get('SELECT * FROM users WHERE id = ?', [result.lastID]);
      }
      
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Discord Strategy
passport.use(new DiscordStrategy({
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackUrl: '/auth/discord/callback',
    scope: ['identify', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.email || `${profile.id}@discord.user`;
      let user = await get('SELECT * FROM users WHERE email = ?', [email]);
      
      if (!user) {
        const result = await run(
          'INSERT INTO users (username, email, full_name, avatar_url, role) VALUES (?, ?, ?, ?, ?)',
          [
            profile.id,
            email,
            profile.username || 'Discord User',
            profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : '/images/default-avatar.png',
            'user'
          ]
        );
        user = await get('SELECT * FROM users WHERE id = ?', [result.lastID]);
      }
      
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: '/auth/github/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || `${profile.id}@github.user`;
      let user = await get('SELECT * FROM users WHERE email = ?', [email]);
      
      if (!user) {
        const result = await run(
          'INSERT INTO users (username, email, full_name, avatar_url, role) VALUES (?, ?, ?, ?, ?)',
          [
            profile.id,
            email,
            profile.displayName || profile.username || 'GitHub User',
            profile.photos?.[0]?.value || '/images/default-avatar.png',
            'user'
          ]
        );
        user = await get('SELECT * FROM users WHERE id = ?', [result.lastID]);
      }
      
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));