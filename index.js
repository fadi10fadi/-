const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// إعدادات البوت الأساسية
const PREFIX = '!';
const TOKEN = 'MTU2MDU5NzcwMTkyODk1MTk0Mw.GooCtv._rb-5T5SxtNtIANC_K5cZmKek_optCxGsjAp20'; 

// اسم الرتبة واسم الشانل
const JAIL_ROLE_NAME = 'Jail';
const JAIL_CHANNEL_NAME = 'ˡ┣・صيدنايا⛓️🔗';

// خريطة لتخزين رتب الأعضاء قبل سجنهم
const savedRoles = new Map();

client.once('ready', () => {
    console.log(`✅ تم تشغيل البوت بنجاح باسم: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // ==================== أمر السجن (!jail) ====================
    if (command === 'jail') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply('❌ ليس لديك صلاحية لإدارة الرتب وسجن الأعضاء!');
        }

        const targetMember = message.mentions.members.first();
        if (!targetMember) {
            return message.reply('⚠️ يرجى تحديد العضو المراد سجنه. مثال: `!jail @user السبب`');
        }

        if (targetMember.id === message.author.id) {
            return message.reply('❌ لا يمكنك سجن نفسك!');
        }

        const reason = args.slice(1).join(' ') || 'لم يتم ذكر سبب.';

        // البحث عن الرتبة
        let jailRole = message.guild.roles.cache.find(role => role.name === JAIL_ROLE_NAME);
        if (!jailRole) {
            return message.reply(`⚠️ لم يتم العثور على رتبة باسم \`${JAIL_ROLE_NAME}\`.`);
        }

        try {
            // 1. حفظ رتب العضو الحالية (باستثناء رتبة @everyone والرتب المدارة من التطبيقات)
            const oldRoles = targetMember.roles.cache
                .filter(role => role.id !== message.guild.id && !role.managed)
                .map(role => role.id);

            savedRoles.set(targetMember.id, oldRoles);

            // 2. سحب جميع الرتب وإضافة رتبة السجن فقط
            await targetMember.roles.set([jailRole.id]);

            const embed = new EmbedBuilder()
                .setTitle('🔒 تم سجن العضو')
                .setColor('#FF0000')
                .addFields(
                    { name: '👤 العضو المسجون:', value: `${targetMember.user.tag}`, inline: true },
                    { name: '👮 السجان:', value: `${message.author.tag}`, inline: true },
                    { name: '📝 السبب:', value: reason }
                )
                .setTimestamp();

            // إرسال الإشعار في الشانل الحالي
            message.channel.send({ embeds: [embed] });

            // إرسال تنبيه في شانل السجن ليرى المسجون ما حدث
            const jailChannel = message.guild.channels.cache.find(c => c.name === JAIL_CHANNEL_NAME);
            if (jailChannel) {
                jailChannel.send(`⛓️ <@${targetMember.id}> لقد تم جلبك إلى السجن! \n**السبب:** ${reason}`);
            }

        } catch (error) {
            console.error(error);
            message.reply('❌ حدث خطأ أثناء سجن العضو. تأكد أن رتبة البوت أعلى من رتبة العضو ورتبة الـ Jail.');
        }
    }

    // ==================== أمر فك السجن (!unjail) ====================
    if (command === 'unjail') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply('❌ ليس لديك صلاحية لإدارة الرتب!');
        }

        const targetMember = message.mentions.members.first();
        if (!targetMember) {
            return message.reply('⚠️ يرجى تحديد العضو المراد إفراجه. مثال: `!unjail @user`');
        }

        let jailRole = message.guild.roles.cache.find(role => role.name === JAIL_ROLE_NAME);
        if (!jailRole) {
            return message.reply(`⚠️ لم يتم العثور على رتبة \`${JAIL_ROLE_NAME}\`.`);
        }

        try {
            // إزالة رتبة السجن
            await targetMember.roles.remove(jailRole);

            // استرجاع الرتب القديمة إن وجدت
            const userOldRoles = savedRoles.get(targetMember.id);
            if (userOldRoles && userOldRoles.length > 0) {
                await targetMember.roles.add(userOldRoles);
                savedRoles.delete(targetMember.id); // مسح البيانات بعد الاسترجاع
            }

            const embed = new EmbedBuilder()
                .setTitle('🔓 تم الإفراج عن العضو')
                .setColor('#00FF00')
                .setDescription(`تم إخراج ${targetMember.user.tag} من السجن واسترجاع رتبه بنجاح.`)
                .setTimestamp();

            message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            message.reply('❌ حدث خطأ أثناء إزالة رتبة السجن أو استعادة الرتب.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);


