import {
  getConfig,
  incrementTicketCounter,
  createTicket,
} from "../database.js";

import {
  buildTicketWelcomeEmbed,
  formatTicketLabel,
} from "../utils/embeds.js";

import {
  createPrivateThread,
  buildCloseButton,
} from "../utils/ticket.js";


export async function selectMenuHandler(client, interaction) {

  if (interaction.customId !== "ticket_type_select") return;

  const type = interaction.values[0]; // general | prize | report

  await interaction.deferReply({ ephemeral: true });

  // ── Load config ────────────────────────────────────────
  const config = await getConfig(interaction.guildId);

  if (!config) {
    return interaction.editReply({
      content: "❌ Bot is not configured for this server. Ask an admin to run `/link`.",
    });
  }

  // ── Sequential ticket number ───────────────────────────
  const ticketNumber = await incrementTicketCounter(interaction.guildId);
  const ticketLabel  = formatTicketLabel(ticketNumber);

  // ── Create private thread in the same channel ──────────
  const thread = await createPrivateThread(interaction.channel, ticketLabel);

  // ── Add the user who opened the ticket ─────────────────
  await thread.members.add(interaction.user.id);

  // ── Add all members with admin role ────────────────────
  const adminRoleId = process.env.ADMIN_ROLE_ID;

  const role = interaction.guild.roles.cache.get(adminRoleId);

if (role) {
  const admins = role.members.filter(m => !m.user.bot);

  for (const [, member] of admins) {
    await thread.members.add(member.id).catch(() => {});
  }
}

  // ── Build welcome message ──────────────────────────────
  const welcomeEmbed = buildTicketWelcomeEmbed(type, ticketLabel);
  const closeRow     = buildCloseButton(ticketNumber);

  const adminMention = adminRoleId ? `<@&${adminRoleId}>` : "";
  const userMention  = `<@${interaction.user.id}>`;

  await thread.send({
    content: `${userMention} ${adminMention}`.trim(),
    embeds: [welcomeEmbed],
    components: [closeRow],
  });

  // ── Save ticket to DB ──────────────────────────────────
  await createTicket({
    ticketNumber,
    guildId:  interaction.guildId,
    threadId: thread.id,
    userId:   interaction.user.id,
    type,
  });

  // ── Confirm to user ────────────────────────────────────
  await interaction.editReply({
    content: `✅ Your ticket has been created: <#${thread.id}>`,
  });

  // ── Reset the select menu so it can be used again ──────
  try {
    const panelMsg = await interaction.channel.messages.fetch(config.panel_message_id);

    if (panelMsg) {
      const { buildPanelSelectMenu } = await import("../utils/ticket.js");
      await panelMsg.edit({ components: [buildPanelSelectMenu()] });
    }
  } catch {
    // Panel message may have been deleted; ignore
  }

}
