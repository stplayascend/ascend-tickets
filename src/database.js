import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import pg from "pg";
import { config } from "dotenv";

config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});


/* ─────────────────────────────────────────────
   Query Helper
───────────────────────────────────────────── */

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}


/* ─────────────────────────────────────────────
   Guild Config
───────────────────────────────────────────── */

export async function getConfig(guildId) {
  const res = await query(
    `SELECT * FROM ticket_config WHERE guild_id = $1`,
    [guildId]
  );
  return res.rows[0] || null;
}

export async function upsertConfig(guildId, data) {
  const { panelChannelId, panelMessageId } = data;

  await query(
    `INSERT INTO ticket_config (guild_id, panel_channel_id, panel_message_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (guild_id) DO UPDATE
       SET panel_channel_id = COALESCE($2, ticket_config.panel_channel_id),
           panel_message_id = COALESCE($3, ticket_config.panel_message_id)`,
    [guildId, panelChannelId, panelMessageId]
  );
}


/* ─────────────────────────────────────────────
   Ticket Counter  (sequential: 1, 2, 3 …)
───────────────────────────────────────────── */

export async function incrementTicketCounter(guildId) {

  // Ensure config row exists
  await query(
    `INSERT INTO ticket_config (guild_id) VALUES ($1)
     ON CONFLICT (guild_id) DO NOTHING`,
    [guildId]
  );

  const res = await query(
    `UPDATE ticket_config
     SET ticket_counter = ticket_counter + 1
     WHERE guild_id = $1
     RETURNING ticket_counter`,
    [guildId]
  );

  return res.rows[0].ticket_counter;
}


/* ─────────────────────────────────────────────
   Tickets
───────────────────────────────────────────── */

export async function createTicket({ ticketNumber, guildId, threadId, userId, type }) {
  await query(
    `INSERT INTO tickets (ticket_number, guild_id, thread_id, user_id, type)
     VALUES ($1, $2, $3, $4, $5)`,
    [ticketNumber, guildId, threadId, userId, type]
  );
}

export async function getTicketByThread(threadId) {
  const res = await query(
    `SELECT * FROM tickets WHERE thread_id = $1`,
    [threadId]
  );
  return res.rows[0] || null;
}

export async function getTicketByNumber(ticketNumber, guildId) {
  const res = await query(
    `SELECT * FROM tickets WHERE ticket_number = $1 AND guild_id = $2`,
    [ticketNumber, guildId]
  );
  return res.rows[0] || null;
}

export async function closeTicket(threadId, transcriptMessageId) {
  await query(
    `UPDATE tickets
     SET status = 'closed',
         transcript_message_id = $2,
         closed_at = NOW()
     WHERE thread_id = $1`,
    [threadId, transcriptMessageId]
  );
}

export async function reopenTicket(threadId) {
  await query(
    `UPDATE tickets
     SET status = 'open',
         closed_at = NULL
     WHERE thread_id = $1`,
    [threadId]
  );
}
