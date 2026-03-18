import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { NgModule } from '@angular/core'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import TabbyCoreModule, { ConfigProvider, ProfileProvider, ToolbarButtonProvider } from 'tabby-core'
import { SettingsTabProvider } from 'tabby-settings'

import { TeleportProfileProvider } from './services/profileProvider.service'
import { TeleportToolbarProvider } from './services/toolbar.service'
import { TeleportConfigProvider } from './config'
import { TeleportSettingsTabProvider } from './settings'
import { TeleportSettingsComponent } from './components/teleportSettings.component'
import { QuickConnectModalComponent } from './components/quickConnect.component'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TabbyCoreModule,
    NgbModule,
  ],
  declarations: [
    TeleportSettingsComponent,
    QuickConnectModalComponent,
  ],
  providers: [
    { provide: ConfigProvider, useClass: TeleportConfigProvider, multi: true },
    { provide: SettingsTabProvider, useClass: TeleportSettingsTabProvider, multi: true },
    { provide: ProfileProvider, useClass: TeleportProfileProvider, multi: true },
    { provide: ToolbarButtonProvider, useClass: TeleportToolbarProvider, multi: true },
  ],
})
export default class TeleportModule {}
