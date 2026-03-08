# Ascend Ticket Bot

A Discord support ticket bot with private threads, sequential numbering, and full transcript logging.

---

## Features

- `/link #transcript-channel` — Posts the ticket panel and configures the bot
- Dropdown to select ticket type: **General Query**, **Report a Member**, **Prize Claim**
- Creates a **private thread** per ticket with sequential numbering (`Ticket-001`, `Ticket-002`, …)
- Automatically adds the user + all members with the admin role
- Type-specific welcome message inside each ticket thread
- **Close button** (admin-only) — locks/archives the thread, removes all members, sends transcript
- **Transcript** posted to your configured channel with Reopen + View Details buttons
- **Reopen** — unarchives thread, re-adds user and admins, sends notification

---

## Setup

### 1. Create a Discord Application & Bot

1. Go to https://discord.com/developers/applications
2. Create a new application
3. Under **Bot**, click "Add Bot"
4. Enable **Server Members Intent** and **Message Content Intent** under Privileged Gateway Intents
5. Copy the **Bot Token** and **Application/Client ID**

### 2. Invite the Bot

Generate an invite URL with these permissions:
- `bot` scope
- `applications.commands` scope
- Permissions: `Manage Threads`, `Create Private Threads`, `Send Messages`, `Read Message History`, `View Channels`

### 3. Database

Run the migration SQL against your PostgreSQL database:

```bash
psql $DATABASE_URL -f migrations/001_init.sql
```

### 4. Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```env
DISCORD_BOT_TOKEN=      # Your bot token
DISCORD_CLIENT_ID=      # Your application/client ID (for deploy-commands)
DISCORD_GUILD_ID=       # Your server ID
ADMIN_ROLE_ID=          # Role ID for admins/support staff
DATABASE_URL=           # PostgreSQL connection string
```

> **Note:** `TRANSCRIPT_CHANNEL_ID` is set per-server via `/link`, not in `.env`.

### 5. Install & Run

```bash
npm install

# Register slash commands (run once or after changes)
npm run deploy

# Start the bot
npm start
```

---

## Usage

### Initial Setup (Admin)

In the channel where you want the ticket panel:
```
/link transcript_channel:#your-transcript-channel
```

This posts the "Need Assistance?" panel with the dropdown.

### Opening a Ticket (Any User)

1. Select a category from the dropdown
2. A private thread is created (visible only to you and admins)
3. Provide the requested information

### Closing a Ticket (Admin Only)

Click **🔒 Close Ticket** inside the thread. This will:
- Disable the close button → shows **🔴 Closed**
- Remove all members from the thread
- Lock and archive the thread
- Post a transcript to the configured transcript channel

### Reopening a Ticket (Admin Only)

In the transcript channel, click **🔓 Reopen Ticket**. This will:
- Unarchive and unlock the thread
- Re-add the ticket owner and all admins
- Send a notification in the thread tagging everyone
- Update the transcript buttons to show **✅ Reopened**

---

## Environment Variables Reference

| Variable            | Required | Description                              |
|---------------------|----------|------------------------------------------|
| `DISCORD_BOT_TOKEN` | ✅       | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | ✅       | Application ID (for deploy-commands)     |
| `DISCORD_GUILD_ID`  | ✅       | Your Discord server ID                   |
| `ADMIN_ROLE_ID`     | ✅       | Role ID for admins/support staff         |
| `DATABASE_URL`      | ✅       | PostgreSQL connection string             |
