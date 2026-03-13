import { Injectable } from '@angular/core'
import { ConfigProvider } from 'tabby-core'

@Injectable()
export class TeleportConfigProvider extends ConfigProvider {
  defaults = {
    teleport: {
      tshPath: 'tsh',
      defaultUser: 'root',
      proxy: '',
      loginUser: '',
      authType: '',
      cluster: '',
      env: {},
    },
  }
}
