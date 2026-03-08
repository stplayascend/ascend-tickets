import { selectMenuHandler } from "./selectMenuHandler.js";
import { buttonHandler }     from "./buttonHandler.js";


export async function interactionHandler(client, interaction) {

  try {

    // ── Slash commands ───────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (cmd) await cmd.execute(interaction);
      return;
    }

    // ── Select menus ─────────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      await selectMenuHandler(client, interaction);
      return;
    }

    // ── Buttons ──────────────────────────────────────────
    if (interaction.isButton()) {
      await buttonHandler(client, interaction);
      return;
    }

  } catch (err) {
    console.error("❌ Interaction error:", err);

    const reply = {
      content: "❌ Something went wrong. Please try again.",
      ephemeral: true,
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }

}
