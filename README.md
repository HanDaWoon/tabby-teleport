# tabby-teleport

A [Tabby](https://tabby.sh) plugin that integrates [Teleport](https://goteleport.com) SSH nodes as native terminal profiles.

![npm](https://img.shields.io/npm/v/tabby-teleport)

## Features

- **Profile Integration** — Teleport nodes appear directly in Tabby's profile dropdown with label-based search
- **Quick Connect** — Toolbar button opens a searchable node picker with hostname relevance sorting
- **Label Search** — Search nodes by labels in both profile selector and Quick Connect
- **One-click SSH** — Select a node to open a `tsh ssh` terminal tab instantly
- **Auto Login** — If not logged in, a "Teleport: Login" profile appears to run `tsh login` directly in Tabby
- **Login Settings** — Configure proxy address, login user, auth type, and cluster for `tsh login`
- **Environment Variables** — Set custom environment variables (e.g. `TELEPORT_HOME`, `TSH_LOG`) for all tsh commands
- **Settings Tab** — Configure `tsh` binary path, default SSH user, and more
- **Connection Test** — Verify Teleport login status from Settings
- **Node Caching** — Nodes are cached in memory so they remain visible even after session expiry
- **Auto Re-login** — Selecting a cached node when session is expired automatically runs `tsh login && tsh ssh`
- **Auto Discovery** — Nodes are fetched automatically via `tsh ls --format=json`
- **SSH User Overrides** — Override SSH username per node label (e.g., `env=prod` → `ec2-user`)
- **Multi-Cluster Support** — Nodes from all online clusters are aggregated and grouped by cluster name
- **Quick Connect Hotkey** — Assign a keyboard shortcut to open Quick Connect via Settings → Hotkeys
- **tsh Version Check** — Detects `tsh` version on startup and warns if below v10

## Prerequisites

- [Tabby](https://tabby.sh) terminal
- [Teleport](https://goteleport.com) `tsh` CLI **v10 or later** installed and in your PATH
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
2. After login, Teleport nodes will appear under the **Teleport** group (or **Teleport/cluster-name** for multi-cluster setups)
3. Select a node to open an SSH session
4. Use the toolbar button or assign a hotkey in **Settings → Hotkeys** to open Quick Connect

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

### SSH User Overrides

Override the SSH username for specific nodes based on labels. The first matching rule wins.

| Setting | Description | Example |
| ------- | ----------- | ------- |
| Label   | Node label to match (`key=value`) | `env=prod` |
| User    | SSH username to use | `ec2-user` |

### Environment Variables

Add custom environment variables (key-value pairs) that are set when running any `tsh` command. Useful for `TELEPORT_HOME`, etc.

## Building from Source

```bash
git clone https://github.com/handawoon/tabby-teleport.git
cd tabby-teleport
npm install
npm run build
```

## License

MIT
