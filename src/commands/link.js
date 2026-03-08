import { SlashCommandBuilder } from "discord.js";

import { upsertConfig } from "../database.js";
import { buildPanelEmbed } from "../utils/embeds.js";
import { buildPanelSelectMenu } from "../utils/ticket.js";


export default {

  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link this channel as the ticket panel and post the support embed"),

  async execute(interaction) {

    // ── Admin check ──────────────────────────────────────
    const isAdmin =
      interaction.member.roles.cache.has(process.env.ADMIN_ROLE_ID) ||
      interaction.member.permissions.has("Administrator");

    if (!isAdmin) {
      return interaction.reply({
        content: "❌ You need the **Admin** role to use this command.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    // ── Build and post panel ─────────────────────────────
    const embed     = buildPanelEmbed();
    const selectRow = buildPanelSelectMenu();

    const msg = await interaction.channel.send({
      embeds: [embed],
      components: [selectRow],
      files: ["banner.png"]
    });

    // ── Save config to DB ────────────────────────────────
    await upsertConfig(interaction.guildId, {
      panelChannelId: interaction.channelId,
      panelMessageId: msg.id,
    });

    await interaction.editReply({
      content: "✅ Ticket panel posted and this channel has been linked!",
    });

  },

};
