require("dotenv").config();
const express = require("express");
const axios = require("axios");
const session = require("express-session");

const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.get("/", (req,res)=>{
  if(req.session.user){
    res.send(`
      <h2>Benvenuto ${req.session.user.username}</h2>
      <img src="${req.session.user.avatar}" width="100">
      <br><br>
      <a href="/logout">Logout</a>
    `);
  } else {
    res.send(`<a href="/login">Login con Discord</a>`);
  }
});

app.get("/login", (req,res)=>{
  const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify`;
  res.redirect(url);
});

app.get("/callback", async (req,res)=>{
  const code = req.query.code;

  const tokenRes = await axios.post("https://discord.com/api/oauth2/token",
    new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: process.env.REDIRECT_URI,
      scope: "identify"
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const accessToken = tokenRes.data.access_token;

  const userRes = await axios.get("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const user = userRes.data;

  req.session.user = {
    id: user.id,
    username: user.username + "#" + user.discriminator,
    avatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
  };

  res.redirect("/");
});

app.get("/logout",(req,res)=>{
  req.session.destroy(()=>{
    res.redirect("/");
  });
});

app.listen(3000,()=>console.log("Server avviato su http://192.168.178.56:5500"));