import { Component } from '@angular/core'
import { ConfigService } from 'tabby-core'
import { TeleportService } from '../services/teleport.service'

@Component({
  selector: 'teleport-settings',
  template: require('./teleportSettings.component.pug'),
})
export class TeleportSettingsComponent {
  testResult: 'success' | 'error' | null = null
  testError = ''
  newEnvKey = ''
  newEnvValue = ''

  constructor (
    public config: ConfigService,
    private teleport: TeleportService,
  ) {}

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

  async testConnection (): Promise<void> {
    this.testResult = null
    try {
      const loggedIn = await this.teleport.isLoggedIn()
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
