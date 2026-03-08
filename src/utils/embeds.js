import { EmbedBuilder } from "discord.js";


/* ─────────────────────────────────────────────
   Label helpers
───────────────────────────────────────────── */

export const TYPE_LABELS = {
  general: "General Query",
  prize:   "Prize Claim",
  report:  "Report Member",
};


/* ─────────────────────────────────────────────
   Panel Embed  ("Need Assistance?")
───────────────────────────────────────────── */

export function buildPanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle("📌 Need Assistance?")
    .setDescription(
      "Create a ticket for the following:\n\n" +
      "> • **General Queries:** If you have any questions or need assistance with the server, rules, or anything else.\n" +
      "> • **Report A Member:** Report a server member violating the rules or causing disruption within the community.\n" +
      "> • **Prize Claims:** If you've won a giveaway or won an event, submit your claim here with proof."
    )
    .setImage("attachment://banner.png")
    .setFooter({
      text: "Ascend Tickets- Powered by Ascend"
    });
}


/* ─────────────────────────────────────────────
   Ticket Welcome Embeds (per type)
───────────────────────────────────────────── */

export function buildTicketWelcomeEmbed(type, ticketLabel) {
  const base = new EmbedBuilder()
    .setColor(0x5865F2)
    .setFooter({ text: ticketLabel });

  if (type === "prize") {
    return base
      .setTitle("🎁 Prize Claim")
      .setDescription(
        "📌 Please provide the following information to help us address your request:\n\n" +
        "**For Prize Claims:**\n" +
        "• Specify whether it's from a giveaway, event, or other activity.\n" +
        "• Include screenshots, bot messages, or any other relevant evidence showing you won or earned the reward."
      );
  }

  if (type === "general") {
    return base
      .setTitle("❓ General Query")
      .setDescription(
        "📌 Please provide the following information to help us address your request:\n\n" +
        "**For General Queries:**\n" +
        "• Briefly describe your question or issue.\n" +
        "• Any relevant details that will help us assist you."
      );
  }

  if (type === "report") {
    return base
      .setTitle("🚨 Report Member")
      .setDescription(
        "📌 Please provide the following information to help us address your request:\n\n" +
        "**For Member Report:**\n" +
        "• Include their full Discord username.\n" +
        "• Briefly explain what happened.\n" +
        "• Any evidence (screenshots, videos, etc.)."
      );
  }

  return base;
}


/* ─────────────────────────────────────────────
   Transcript Embed (sent to transcript channel)
───────────────────────────────────────────── */

export function buildTranscriptEmbed(ticket, user) {
  const typeLabel  = TYPE_LABELS[ticket.type] || ticket.type;
  const ticketLabel = formatTicketLabel(ticket.ticket_number);

  return new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle(`🔒 ${ticketLabel} — Closed`)
    .addFields(
      { name: "Opened By",     value: `<@${ticket.user_id}>`,  inline: true },
      { name: "Ticket Type",   value: typeLabel,                inline: true },
      { name: "Ticket Status", value: "🔴 Closed",             inline: true },
      {
        name:  "Opened At",
        value: `<t:${Math.floor(new Date(ticket.opened_at).getTime() / 1000)}:F>`,
        inline: true,
      },
      {
        name:  "Closed At",
        value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
        inline: true,
      }
    )
    .setFooter({ text: ticketLabel });
}


/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

export function formatTicketLabel(ticketNumber) {
  return `Ticket-${String(ticketNumber).padStart(3, "0")}`;
}
