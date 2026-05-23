const express = require("express");

const app = express();

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const API_SECRET = process.env.API_SECRET || "";

const linkedAccounts = {
  "3321828490": "1265951794891329561",
  "5028632040": "1400599067624607784",
  "4036042012": "1357929023363219598"
};

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "Palmor Staff Management API"
  });
});

app.get("/roles", async (req, res) => {
  try {
    const robloxUserId = String(req.query.robloxUserId || "");
    const secret = String(req.query.secret || "");

    if (API_SECRET !== "" && secret !== API_SECRET) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!robloxUserId) {
      return res.status(400).json({
        success: false,
        message: "Missing robloxUserId"
      });
    }

    const discordUserId = linkedAccounts[robloxUserId];

    if (!discordUserId) {
      return res.json({
        success: true,
        linked: false,
        discordId: "",
        roleIds: [],
        roleNames: [],
        rank: "Guest"
      });
    }

    const memberResponse = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`
        }
      }
    );

    if (!memberResponse.ok) {
      return res.status(memberResponse.status).json({
        success: false,
        message: "Could not fetch Discord member"
      });
    }

    const member = await memberResponse.json();
    const roleIds = member.roles || [];

    const rolesResponse = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/roles`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`
        }
      }
    );

    if (!rolesResponse.ok) {
      return res.status(rolesResponse.status).json({
        success: false,
        message: "Could not fetch Discord roles"
      });
    }

    const guildRoles = await rolesResponse.json();

    const roleNames = roleIds
      .map((roleId) => {
        const role = guildRoles.find((item) => item.id === roleId);
        return role ? role.name : null;
      })
      .filter(Boolean);

    res.json({
      success: true,
      linked: true,
      discordId: discordUserId,
      roleIds,
      roleNames
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Palmor Staff Management API running on port ${port}`);
});
