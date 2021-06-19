const fetch = require("node-fetch")
const strictUriEncode = require("strict-uri-encode")
const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")

class GetOffenses extends Command {
	constructor(client) {
		super(client, {
			name: "getfilteredoffenses",
			description: "Gets offenses of a player, filtered by trusted communities and rules",
			aliases: ["getoffenses"],
			usage: "[playername]",
			examples: ["{{p}}getfilteredoffenses Windsinger"],
			category: "offenses",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
		})
	}
	async run(message, args, config) {
		if (!args[0]) return message.reply("Provide a player name to get offenses of")
		if (!config.trustedCommunities || !config.trustedCommunities[0])
			return message.reply("Please set trusted communities first")

		const playername = args.shift()
		const offenses = await this.client.fagc.offenses.fetchAll(playername)
		if (!offenses || !offenses[0])
			return message.channel.send(`User \`${playername}\` has no offenses`)

		let embed = new MessageEmbed()
			.setTitle("FAGC Offenses")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`FAGC Offenses of player \`${playername}\``)

		const filteredOffenses = offenses.filter(offense => config.trustedCommunities.includes(offense.communityId))
		if (!filteredOffenses[0]) return message.channel.send(`User \`${playername}\` has no offenses that correspond to your filters`)
		let i = 0
		await Promise.all(offenses.map(async (offense) => {
			if (i && i % 25 == 0) {
				message.channel.send(embed)
				embed.fields = []
			}

			const violations = offense.violations.map((violation) => violation.id)
			const community = await this.client.getOrFetchCommunity(offense.communityId)
			embed.addField(`Community ${community.name} (\`${offense.communityId}\`)`, `Violation ID(s): ${violations.join(", ")}`)
			i++
		}))
		if (embed.fields[0])
			message.channel.send(embed)
		if (!i)
			message.channel.send("No offenses correspond to your filters")
	}
}

module.exports = GetOffenses