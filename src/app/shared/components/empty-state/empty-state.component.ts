import { Component, Input } from "@angular/core"

@Component({
  selector: "app-empty-state",
  templateUrl: "./empty-state.component.html",
  styleUrls: ["./empty-state.component.scss"],
  standalone: false,
})
export class EmptyStateComponent {
  @Input() icon = "alert-circle-outline"
  @Input() title = "No hay datos"
  @Input() message = "No se encontraron elementos para mostrar."
  @Input() showButton = false
  @Input() buttonText = "Acción"
  @Input() buttonIcon = ""
}
