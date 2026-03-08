import {
  Client,
  GatewayIntentBits,
  Collection,
  ActivityType,
} from "discord.js";

import { config } from "dotenv";
import { readdirSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";

import { interactionHandler } from "./handlers/interactionHandler.js";

config();


// ─────────────────────────────────────────────
// Validate required env vars
// ─────────────────────────────────────────────

const REQUIRED_ENV = [
  "DISCORD_BOT_TOKEN",
  "DISCORD_GUILD_ID",
  "ADMIN_ROLE_ID",
  "TRANSCRIPT_CHANNEL_ID",
  "DATABASE_URL",
];

const missing = REQUIRED_ENV.filter(k => !process.env[k]);

if (missing.length > 0) {
  console.error("❌ Missing required environment variables:\n  " + missing.join("\n  "));
  process.exit(1);
}


// ─────────────────────────────────────────────
// Discord Client
// ─────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();


// ─────────────────────────────────────────────
// Load slash commands
// ─────────────────────────────────────────────

const commandsPath  = join(__dirname, "commands");
const commandFiles  = readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const mod = await import(pathToFileURL(join(commandsPath, file)));
  client.commands.set(mod.default.data.name, mod.default);
  console.log(`↳ Command loaded: ${mod.default.data.name}`);
}


// ─────────────────────────────────────────────
// Ready
// ─────────────────────────────────────────────

client.once("clientReady", () => {
  console.log(`\n✅ Ascend Ticket Bot is online as ${client.user.tag}`);
  console.log(`Guild: ${process.env.DISCORD_GUILD_ID}`);

  client.user.setActivity("Support Tickets", {
    type: ActivityType.Watching,
  });
});


// ─────────────────────────────────────────────
// Interactions
// ─────────────────────────────────────────────

client.on("interactionCreate", interaction =>
  interactionHandler(client, interaction)
);


// ─────────────────────────────────────────────
// Error handling
// ─────────────────────────────────────────────

client.on("error", err =>
  console.error("[discord] Client error:", err)
);

process.on("unhandledRejection", err =>
  console.error("[process] Unhandled rejection:", err)
);


// ─────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────

client.login(process.env.DISCORD_BOT_TOKEN);
