require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const express = require('express');

// 🌐 UPTIME SERVER
const app = express();
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// 🤖 CLIENT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const GUILD_ID = "1487021154735620126";

// 🛠️ SLASH COMMAND
const commands = [
  new SlashCommandBuilder()
    .setName('r')
    .setDescription('Send test results')

    .addUserOption(option =>
      option.setName('user')
        .setDescription('Select user')
        .setRequired(true))

    .addStringOption(option =>
      option.setName('kit')
        .setDescription('Kit used')
        .setRequired(true))

    .addStringOption(option =>
      option.setName('region')
        .setDescription('Region')
        .setRequired(true))

    .addStringOption(option =>
      option.setName('rank_before')
        .setDescription('Rank before')
        .setRequired(true))

    .addRoleOption(option =>
      option.setName('rank_earned')
        .setDescription('Select role earned')
        .setRequired(true))

    .addStringOption(option =>
      option.setName('image')
        .setDescription('Image URL (optional)')
        .setRequired(false))
].map(cmd => cmd.toJSON());

// 🚀 REGISTER COMMANDS (FIXED CACHE + DROPDOWN BUGS)
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Refreshing slash commands...");

    // DELETE OLD COMMANDS
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
      { body: [] }
    );

    // REGISTER NEW COMMANDS
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("Slash commands loaded!");
  } catch (err) {
    console.error("Command register error:", err);
  }
})();

// ✅ READY EVENT (NO WARNING)
client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ⚡ COMMAND HANDLER (FIXED NO STUCK "THINKING")
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'r') {

    try {
      await interaction.deferReply();

      const targetUser = interaction.options.getUser('user');
      const kit = interaction.options.getString('kit');
      const region = interaction.options.getString('region');
      const rankBefore = interaction.options.getString('rank_before');
      const role = interaction.options.getRole('rank_earned');
      const image = interaction.options.getString('image');

      if (!targetUser || !role) {
        return interaction.editReply("❌ Missing user or role.");
      }

      const member = await interaction.guild.members.fetch(targetUser.id);

      await member.roles.add(role);

      const embed = new EmbedBuilder()
        .setTitle(`${targetUser.username}'s Test Results 🏆`)
        .setColor(0xFFD700)
        .addFields(
          { name: 'USER', value: `<@${targetUser.id}>`, inline: true },
          { name: 'KIT', value: kit, inline: true },
          { name: '\u200B', value: '\u200B', inline: true },

          { name: 'REGION', value: region, inline: true },
          { name: 'RANK BEFORE', value: rankBefore, inline: true },
          { name: 'RANK EARNED', value: `<@&${role.id}>`, inline: true },

          { name: 'TESTED BY', value: `<@${interaction.user.id}>` }
        )
        .setTimestamp()
        .setThumbnail(image || targetUser.displayAvatarURL());

      return await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error(err);

      if (interaction.deferred) {
        return interaction.editReply("❌ Something went wrong.");
      }
    }
  }
});

// 🔐 LOGIN
client.login(process.env.TOKEN);
