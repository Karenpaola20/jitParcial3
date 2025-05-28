import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { IonicModule } from "@ionic/angular"

import { IncomingCallComponent } from "./components/incoming-call/Incoming-call.component"
import { UserAvatarComponent } from "./components/user-avatar/user-avatar.component"
import { ContactCardComponent } from "./components/contact-card/contact-card.component"
import { EmptyStateComponent } from "./components/empty-state/empty-state.component"
import { AppHeaderComponent } from "./components/app-header/app-header.component"
import { CallButtonComponent } from "./components/call-button/call-button.component"
import { CallHistoryItemComponent } from "./components/call-history-item/call-history-item.component"
import { NotificationToastComponent } from "./components/notification-toast/notification-toast.component"
import { ChatComponent } from "../features/home/pages/chat/chat.component"
import { FormsModule } from "@angular/forms"
import { RouterModule } from "@angular/router"

const COMPONENTS = [
  IncomingCallComponent,
  UserAvatarComponent,
  ContactCardComponent,
  EmptyStateComponent,
  AppHeaderComponent,
  CallButtonComponent,
  CallHistoryItemComponent,
  NotificationToastComponent,
  ChatComponent
]

const Modules = [
  FormsModule,
  IonicModule,
  RouterModule,
  CommonModule
]

@NgModule({
  declarations: [...COMPONENTS],
  imports: [... Modules],
  exports: [...COMPONENTS, ... Modules],
})
export class SharedModule {}
