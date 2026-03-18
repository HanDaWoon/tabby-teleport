import { Component, Input, HostListener } from '@angular/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TeleportNode } from '../types'

@Component({
  selector: 'quick-connect-modal',
  template: require('./quickConnect.component.pug'),
  styles: [`
    .list-group { max-height: 400px; overflow-y: auto; }
    .badge { font-weight: normal; font-size: 0.75em; }
  `],
})
export class QuickConnectModalComponent {
  @Input() nodes: TeleportNode[] = []
  filter = ''
  filteredNodes: TeleportNode[] = []
  selectedIndex = 0
  loading = false
  selectedNode: TeleportNode | null = null

  constructor (private modalInstance: NgbActiveModal) {}

  ngOnInit (): void {
    this.onFilterChange()
  }

  close (): void {
    this.modalInstance.dismiss()
  }

  connect (node: TeleportNode): void {
    this.selectedNode = node
    this.modalInstance.close(node)
  }

  connectFirst (): void {
    if (this.filteredNodes.length > 0) {
      this.connect(this.filteredNodes[this.selectedIndex])
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown (event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredNodes.length - 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0)
    } else if (event.key === 'Escape') {
      this.close()
    }
  }

  onFilterChange (): void {
    this.selectedIndex = 0
    const query = this.filter.toLowerCase().trim()
    const tokens = query.split(/\s+/).filter(Boolean)

    const matched = this.nodes
      .map(node => {
        if (tokens.length === 0) { return { node, score: 0 } }

        const searchable = this.buildSearchString(node)
        if (!tokens.every(token => searchable.includes(token))) { return null }

        const hostname = node.spec.hostname.toLowerCase()
        const score = tokens.reduce((s, token) => s + (hostname.includes(token) ? 1 : 0), 0)
        return { node, score }
      })
      .filter((m): m is { node: TeleportNode; score: number } => m !== null)

    matched.sort((a, b) => b.score - a.score)
    this.filteredNodes = matched.map(m => m.node)
  }

  getNodeLabels (node: TeleportNode): string[] {
    const labels = node.metadata.labels ?? {}
    return Object.entries(labels)
      .filter(([k]) => !k.startsWith('teleport.'))
      .map(([k, v]) => `${k}=${v}`)
  }

  private buildSearchString (node: TeleportNode): string {
    const labels = node.metadata.labels ?? {}
    const parts = [
      node.spec.hostname,
      node.metadata.name,
      node.spec.addr,
      node.cluster ?? '',
      ...Object.entries(labels).map(([k, v]) => `${k}=${v}`),
    ]
    return parts.join(' ').toLowerCase()
  }
}
