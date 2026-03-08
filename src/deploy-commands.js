import { REST, Routes } from "discord.js";
import { config } from "dotenv";
import { readdirSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const commands    = [];
const commandsDir = join(__dirname, "commands");

for (const file of readdirSync(commandsDir).filter(f => f.endsWith(".js"))) {
  const mod = await import(pathToFileURL(join(commandsDir, file)));
  commands.push(mod.default.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);

console.log(`🔄 Registering ${commands.length} slash command(s)…`);

await rest.put(
  Routes.applicationGuildCommands(
    process.env.DISCORD_CLIENT_ID,
    process.env.DISCORD_GUILD_ID
  ),
  { body: commands }
);

console.log("✅ Slash commands registered!");
