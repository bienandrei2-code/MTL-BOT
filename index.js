require('dotenv').config();

// 🔁 AUTO-RESTART / ANTI-CRASH
process.on("uncaughtException", err => {
  console.error("CRASH:", err);
});

process.on("unhandledRejection", err => {
  console.error("PROMISE ERROR:", err);
});

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

// 🤖 CLIENT
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const GUILD_ID = "1487021154735620126";

// 🛠️ COMMAND
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
        .setDescription('Select role')
        .setRequired(true))

    .addStringOption(option =>
      option.setName('image')
        .setDescription('Image URL (optional)')
        .setRequired(false))

].map(cmd => cmd.toJSON());

// 🚀 REGISTER COMMANDS
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('clientReady', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("Command registered!");
  } catch (err) {
    console.error("Command error:", err);
  }
});

// 🔁 CONNECTION EVENTS
client.on("error", console.error);
client.on("shardError", console.error);
client.on("disconnect", () => {
  console.log("Bot disconnected!");
});
client.on("reconnecting", () => {
  console.log("Bot reconnecting...");
});
client.on("resume", () => {
  console.log("Bot resumed!");
});

// ⚡ COMMAND HANDLER
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'r') {

    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user');
    const kit = interaction.options.getString('kit');
    const region = interaction.options.getString('region');
    const rankBefore = interaction.options.getString('rank_before');
    const role = interaction.options.getRole('rank_earned');
    const image = interaction.options.getString('image');

    let member;

    try {
      member = await interaction.guild.members.fetch(targetUser.id);
    } catch (err) {
      return interaction.editReply({
        content: '❌ Could not find that user in the server.'
      });
    }

    try {
      await member.roles.add(role);
    } catch (err) {
      return interaction.editReply({
        content: '❌ Cannot give role. Check bot permissions & role hierarchy.'
      });
    }

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

    await interaction.editReply({ embeds: [embed] });
  }
});

// 🔐 LOGIN
client.login(process.env.TOKEN);
