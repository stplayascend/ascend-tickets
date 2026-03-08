import {
  getConfig,
  getTicketByThread,
  getTicketByNumber,
  closeTicket,
  reopenTicket,
} from "../database.js";

import {
  buildTranscriptEmbed,
  buildTicketWelcomeEmbed,
  formatTicketLabel,
  TYPE_LABELS,
} from "../utils/embeds.js";

import {
  buildClosedButton,
  buildTranscriptButtons,
  buildCloseButton,
} from "../utils/ticket.js";


export async function buttonHandler(client, interaction) {

  const { customId } = interaction;

  if (customId.startsWith("ticket_close:")) {
    await handleClose(client, interaction);
    return;
  }

  if (customId.startsWith("transcript_reopen:")) {
    await handleReopen(client, interaction);
    return;
  }

  if (customId.startsWith("transcript_view:")) {
    await handleView(client, interaction);
    return;
  }

  if (customId.startsWith("ticket_closed_noop:")) {
    await interaction.reply({
      content: "This ticket is already closed.",
      flags: 64,
    });
  }
}


/* ─────────────────────────────────────────────
   CLOSE
───────────────────────────────────────────── */
async function handleClose(client, interaction) {

  const isAdmin =
    interaction.member.roles.cache.has(process.env.ADMIN_ROLE_ID) ||
    interaction.member.permissions.has("Administrator");

  if (!isAdmin) {
    return interaction.reply({
      content: "❌ Only admins can close tickets.",
      flags: 64,
    });
  }

  await interaction.deferReply({ flags: 64 });

  const thread = interaction.channel;
  const ticket = await getTicketByThread(thread.id);

  if (!ticket) {
    return interaction.editReply({ content: "❌ Could not find ticket data." });
  }

  if (ticket.status === "closed") {
    return interaction.editReply({ content: "❌ This ticket is already closed." });
  }

  const ticketLabel = formatTicketLabel(ticket.ticket_number);

  /* ─────────────────────────────
     Replace Close Button
  ───────────────────────────── */

  try {

    const firstMessage = (await thread.messages.fetch({ limit: 1, after: "0" })).first();

    if (firstMessage && firstMessage.author.id === client.user.id) {

      await firstMessage.edit({
        components: [buildClosedButton(ticket.ticket_number)],
      });

    }

  } catch {}


  /* ─────────────────────────────
     Transcript Handling
  ───────────────────────────── */

  let transcriptMsg = null;

  if (process.env.TRANSCRIPT_CHANNEL_ID) {

    try {

      const transcriptChannel =
        await client.channels.fetch(process.env.TRANSCRIPT_CHANNEL_ID);

      const transcriptEmbed =
        buildTranscriptEmbed(ticket, interaction.user);

      const transcriptButtons =
        buildTranscriptButtons(ticket.ticket_number, ticket.thread_id, true)


      // If transcript already exists → EDIT it
      if (ticket.transcript_message_id) {

        const existing = await transcriptChannel.messages
          .fetch(ticket.transcript_message_id)
          .catch(() => null);

        if (existing) {

          transcriptMsg = await existing.edit({
            embeds: [transcriptEmbed],
            components: [transcriptButtons],
          });

        }

      }


      // If transcript does not exist → CREATE it
      if (!transcriptMsg) {

        transcriptMsg = await transcriptChannel.send({
          embeds: [transcriptEmbed],
          components: [transcriptButtons],
        });

      }

    } catch (err) {

      console.error("❌ Failed to send transcript:", err);

    }

  }


  /* ─────────────────────────────
     Update Database
  ───────────────────────────── */

  await closeTicket(
    thread.id,
    ticket.transcript_message_id ?? transcriptMsg?.id ?? null
  );


  /* ─────────────────────────────
     Remove Members
  ───────────────────────────── */

  try {

    const members = await thread.members.fetch();

    for (const [, member] of members) {

      if (member.id === client.user.id) continue;

      await thread.members.remove(member.id).catch(() => {});

    }

  } catch {}


  /* ─────────────────────────────
     Lock + Archive
  ───────────────────────────── */

  try {

    await thread.setLocked(true);
    await thread.setArchived(true);

  } catch {}


  await interaction.editReply({
    content: `✅ ${ticketLabel} has been closed.`,
  });

}


/* ─────────────────────────────────────────────
   REOPEN
───────────────────────────────────────────── */

async function handleReopen(client, interaction) {

  const isAdmin =
    interaction.member.roles.cache.has(process.env.ADMIN_ROLE_ID) ||
    interaction.member.permissions.has("Administrator");

  if (!isAdmin) {
    return interaction.reply({
      content: "❌ Only admins can reopen tickets.",
      flags: 64,
    });
  }

  await interaction.deferReply({ flags: 64 });

  const ticketNumber = parseInt(customIdValue(interaction.customId), 10);

  const ticket = await getTicketByNumber(ticketNumber, interaction.guildId);

  if (!ticket) {
    return interaction.editReply({ content: "❌ Could not find ticket data." });
  }

  if (ticket.status === "open") {
    return interaction.editReply({ content: "❌ This ticket is already open." });
  }

  const ticketLabel = formatTicketLabel(ticket.ticket_number);

  let thread;

  try {
    thread = await client.channels.fetch(ticket.thread_id);

    await thread.setArchived(false);
    await thread.setLocked(false);

  } catch {
    return interaction.editReply({
      content: "❌ Failed to reopen the thread. It may have been deleted.",
    });
  }

  await thread.members.add(ticket.user_id).catch(() => {});

  const adminRoleId = process.env.ADMIN_ROLE_ID;

  const role = interaction.guild.roles.cache.get(adminRoleId);

  if (role) {

    const admins = role.members.filter(m => !m.user.bot);

    for (const [, member] of admins) {
      await thread.members.add(member.id).catch(() => {});
    }

  }

  const welcomeEmbed = buildTicketWelcomeEmbed(ticket.type, ticketLabel);

  const closeRow = buildCloseButton(ticket.ticket_number);

  const adminMention = adminRoleId ? `<@&${adminRoleId}>` : "";
  const userMention = `<@${ticket.user_id}>`;

  await thread.send({
    content: `🔓 Ticket reopened by <@${interaction.user.id}>.\n${userMention} ${adminMention}`.trim(),
    embeds: [welcomeEmbed],
    components: [closeRow],
  });

  try {

    await interaction.message.edit({
      components: buildTranscriptButtons(ticket.ticket_number, ticket.thread_id, false)
    });

  } catch {}

  await reopenTicket(ticket.thread_id);

  await interaction.editReply({ content: `✅ ${ticketLabel} has been reopened.` });
}


/* ─────────────────────────────────────────────
   VIEW THREAD
───────────────────────────────────────────── */

async function handleView(client, interaction) {

  const ticketNumber = parseInt(customIdValue(interaction.customId), 10);

  const ticket = await getTicketByNumber(ticketNumber, interaction.guildId);

  if (!ticket) {
    return interaction.reply({
      content: "❌ Ticket not found.",
      flags: 64,
    });
  }

  return interaction.reply({
    content: `🔗 Open Ticket Thread:\nhttps://discord.com/channels/${interaction.guildId}/${ticket.thread_id}`,
    flags: 64,
  });
}


/* ─────────────────────────────────────────────
   Utility
───────────────────────────────────────────── */

function customIdValue(customId) {
  return customId.split(":")[1];
}

