# Sandconomy

A standard run-of-the-mill economy bot with plenty of customizability that can be self-hosted.

# To Use

* Clone this repository (`git clone https://github.com/CantisW/Sandconomy`)
* Open Visual Studio Code or similar and open a terminal.
* Download [PostgreSQL](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads) and set it up. Optionally, download a DB management service such as [DBeaver](https://dbeaver.io/download/).
* Put your username and password into `data-source.ts.default` under `src` then rename it to `data-source.ts`. Everything else is already set up.
* Type in `npm i` in the terminal and wait for dependencies to install.
* Set up the bot (see section below on instructions to set up the bot) and edit the settings under `src/data/bot-settings.json`.
* Type in `npm start`.

Enjoy! Make sure it is set up and you have node.js (`v16.14.0` or higher).

# Setup Bot

Go to the [Discord Developer Portal](https://discord.com/developers/applications) and make a bot. Do this by making an application, then making it a bot.
You will need the bot's token, which is put into `src/data/bot-settings.json`.

### IMPORTANT

Please make sure that when inviting the bot to your server using the OAuth2 tab, you tick `bot` **AND** `application.commands` else the bot will not work. Because the bot is self-hosted, you can give the bot administrator, although you could also limit its permissions to sending messages and embeds.

# Features

* Fairly simple to set up system
* Slash commands
* Customizable economy commands

# Settings

All bot settings are located in `src/data`.

`bot-settings.json` handles all bot-specific settings. Here is where you'll input your [token](https://discord.com/developers/applications) and [guild id]().
'settings.json' handles the settings for your currency. Put in a [name](), adjust [cooldowns](), etc.