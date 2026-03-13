# tabby-teleport

A [Tabby](https://tabby.sh) plugin that integrates [Teleport](https://goteleport.com) SSH nodes as native terminal profiles.

![npm](https://img.shields.io/npm/v/tabby-teleport)

## Features

- **Profile Integration** — Teleport nodes appear directly in Tabby's profile dropdown
- **One-click SSH** — Select a node to open a `tsh ssh` terminal tab instantly
- **Auto Login** — If not logged in, a "Teleport: Login" profile appears to run `tsh login` directly in Tabby
- **Login Settings** — Configure proxy address, login user, auth type, and cluster for `tsh login`
- **Environment Variables** — Set custom environment variables (e.g. `TELEPORT_HOME`, `TSH_LOG`) for all tsh commands
- **Settings Tab** — Configure `tsh` binary path, default SSH user, and more
- **Connection Test** — Verify Teleport login status from Settings
- **Auto Discovery** — Nodes are fetched automatically via `tsh ls --format=json`

## Prerequisites

- [Tabby](https://tabby.sh) terminal
- [Teleport](https://goteleport.com) `tsh` CLI installed and in your PATH
- Logged in to Teleport (`tsh login`)

## Installation

### From Tabby Plugin Manager

1. Open Tabby → Settings → Plugins
2. Search for `tabby-teleport`
3. Click Install

### Manual Installation

```bash
# macOS
cd ~/Library/Application\ Support/tabby/plugins/node_modules
npm install tabby-teleport

# Linux
cd ~/.config/tabby/plugins/node_modules
npm install tabby-teleport

# Windows
cd %APPDATA%\tabby\plugins\node_modules
npm install tabby-teleport
```

Restart Tabby after installation.

## Usage

1. Open a new tab in Tabby — if not logged in, select **Teleport: Login** to authenticate
2. After login, Teleport nodes will appear under the **Teleport** group
3. Select a node to open an SSH session

## Configuration

Go to **Settings → Teleport**:

### General

| Setting      | Description                  | Default |
| ------------ | ---------------------------- | ------- |
| tsh Path     | Path to the `tsh` binary     | `tsh`   |
| Default SSH User | SSH username for connections | `root`  |

### Login Settings

| Setting       | Description                          | Default |
| ------------- | ------------------------------------ | ------- |
| Proxy Address | Teleport proxy address (`--proxy`)   |         |
| Login User    | Teleport login username (`--user`)   |         |
| Auth Type     | Authentication type (`--auth`): Local, GitHub, SAML, OIDC |         |
| Cluster       | Teleport cluster name to login to    |         |

### Environment Variables

Add custom environment variables (key-value pairs) that are set when running any `tsh` command. Useful for `TELEPORT_HOME`, `TSH_LOG`, etc.

## Building from Source

```bash
git clone https://github.com/handawoon/tabby-teleport.git
cd tabby-teleport
npm install
npm run build
```

## License

MIT
