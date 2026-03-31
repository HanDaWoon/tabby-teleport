import { Injectable } from '@angular/core'
import { HotkeyDescription, HotkeyProvider } from 'tabby-core'

@Injectable()
export class TeleportHotkeyProvider extends HotkeyProvider {
  async provide (): Promise<HotkeyDescription[]> {
    return [{
      id: 'teleport-quick-connect',
      name: 'Teleport Quick Connect',
    }]
  }
}
