import { Component, OnInit } from '@angular/core'
import { ConfigService } from 'tabby-core'
import { TeleportService } from '../services/teleport.service'

@Component({
  selector: 'teleport-settings',
  template: require('./teleportSettings.component.pug'),
})
export class TeleportSettingsComponent implements OnInit {
  testResult: 'success' | 'error' | null = null
  testError = ''
  newEnvKey = ''
  newEnvValue = ''
  newOverrideLabel = ''
  newOverrideUser = ''
  tshVersion: string | null = null
  tshWarning: string | null = null

  constructor (
    public config: ConfigService,
    private teleport: TeleportService,
  ) {}

  async ngOnInit (): Promise<void> {
    const result = await this.teleport.checkTshCompatibility()
    this.tshVersion = result.version
    if (!result.compatible) {
      this.tshWarning = result.message ?? null
    }
  }

  onConfigChange (): void {
    this.testResult = null
    this.config.save()
  }

  get envEntries (): [string, string][] {
    return Object.entries(this.config.store.teleport?.env ?? {})
  }

  addEnvVar (): void {
    if (!this.newEnvKey.trim()) { return }
    if (!this.config.store.teleport.env) {
      this.config.store.teleport.env = {}
    }
    this.config.store.teleport.env[this.newEnvKey.trim()] = this.newEnvValue
    this.newEnvKey = ''
    this.newEnvValue = ''
    this.config.save()
  }

  removeEnvVar (key: string): void {
    delete this.config.store.teleport.env[key]
    this.config.save()
  }

  addUserOverride (): void {
    if (!this.newOverrideLabel.trim() || !this.newOverrideUser.trim()) { return }
    if (!this.config.store.teleport.userOverrides) {
      this.config.store.teleport.userOverrides = []
    }
    this.config.store.teleport.userOverrides.push({
      label: this.newOverrideLabel.trim(),
      user: this.newOverrideUser.trim(),
    })
    this.newOverrideLabel = ''
    this.newOverrideUser = ''
    this.config.save()
  }

  removeUserOverride (index: number): void {
    this.config.store.teleport.userOverrides.splice(index, 1)
    this.config.save()
  }

  async testConnection (): Promise<void> {
    this.testResult = null
    try {
      const loggedIn = await this.teleport.isLoggedIn(true)
      if (loggedIn) {
        this.testResult = 'success'
      } else {
        this.testResult = 'error'
        this.testError = 'Not logged in. Run "tsh login" first.'
      }
    } catch (err: any) {
      this.testResult = 'error'
      this.testError = err.message || 'tsh not found or not working.'
    }
  }
}
