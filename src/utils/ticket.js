import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelType,
} from "discord.js";

import { formatTicketLabel } from "./embeds.js";


/* ─────────────────────────────────────────────
   Panel Select Menu  (ticket category dropdown)
───────────────────────────────────────────── */

export function buildPanelSelectMenu() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket_type_select")
    .setPlaceholder("Select a category…")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("General Query")
        .setDescription("Server queries, questions about the community, general assistance, others.")
        .setValue("general")
        .setEmoji("❓"),

      new StringSelectMenuOptionBuilder()
        .setLabel("Report a Member")
        .setDescription("Report any rule violations or disruptive behavior from server members here")
        .setValue("report")
        .setEmoji("🚨"),

      new StringSelectMenuOptionBuilder()
        .setLabel("Prize Claim")
        .setDescription("Submit your claim for a giveaway or event reward with proof.")
        .setValue("prize")
        .setEmoji("🎁"),
    );

  return new ActionRowBuilder().addComponents(menu);
}


/* ─────────────────────────────────────────────
   Close Button  (inside ticket thread)
───────────────────────────────────────────── */

export function buildCloseButton(ticketNumber) {

  const btn = new ButtonBuilder()
    .setCustomId(`ticket_close:${ticketNumber}`)
    .setLabel("🔒 Close Ticket")
    .setStyle(ButtonStyle.Danger);

  return new ActionRowBuilder().addComponents(btn);
}


/* ─────────────────────────────────────────────
   Closed Button  (after ticket is closed)
───────────────────────────────────────────── */

export function buildClosedButton(ticketNumber) {

  const btn = new ButtonBuilder()
    .setCustomId(`ticket_closed_noop:${ticketNumber}`)
    .setLabel("🔴 Closed")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true);

  return new ActionRowBuilder().addComponents(btn);
}


/* ─────────────────────────────────────────────
   Transcript Buttons
   (used in transcript channel)
───────────────────────────────────────────── */

export function buildTranscriptButtons(ticketNumber, threadId, isClosed = true) {

  const viewBtn = new ButtonBuilder()
    .setLabel("🔗 View Thread")
    .setStyle(ButtonStyle.Link)
    .setURL(`https://discord.com/channels/${process.env.DISCORD_GUILD_ID}/${threadId}`);

  const reopenBtn = new ButtonBuilder()
    .setCustomId(`transcript_reopen:${ticketNumber}`)
    .setLabel("🔓 Reopen Ticket")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(!isClosed);

  return new ActionRowBuilder().addComponents(viewBtn, reopenBtn);
}


/* ─────────────────────────────────────────────
   Private Thread Creator
───────────────────────────────────────────── */

export async function createPrivateThread(channel, ticketLabel) {

  const thread = await channel.threads.create({
    name: ticketLabel,
    type: ChannelType.PrivateThread,
    autoArchiveDuration: 10080, // 7 days
    invitable: false,
    reason: "Ascend Support Ticket",
  });

  return thread;
}