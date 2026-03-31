import { Component, Input, HostListener, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TeleportNode } from '../types'

interface NodeView {
  node: TeleportNode
  searchString: string
  labels: string[]
}

@Component({
  selector: 'quick-connect-modal',
  template: require('./quickConnect.component.pug'),
  styles: [`
    .node-area { min-height: 200px; }
    .list-group { max-height: 400px; overflow-y: auto; }
    .badge { font-weight: normal; font-size: 0.75em; }
  `],
})
export class QuickConnectModalComponent implements OnInit, OnDestroy {
  @Input() nodes: TeleportNode[] = []
  @Input() isStaleSession = false
  @ViewChild('nodeList') nodeList: ElementRef | undefined
  filter = ''
  filteredNodes: NodeView[] = []
  selectedIndex = 0
  loading = false
  refreshFn: (() => void) | null = null
  private nodeViews: NodeView[] = []
  private debounceTimer: any = null

  constructor (private modalInstance: NgbActiveModal) {}

  ngOnInit (): void {
    this.buildNodeViews()
    this.onFilterChange()
  }

  ngOnDestroy (): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
  }

  close (): void {
    this.modalInstance.dismiss()
  }

  connect (nv: NodeView): void {
    this.modalInstance.close(nv.node)
  }

  connectFirst (): void {
    if (this.filteredNodes.length > 0) {
      const idx = Math.min(this.selectedIndex, this.filteredNodes.length - 1)
      this.connect(this.filteredNodes[idx])
    }
  }

  refresh (): void {
    if (this.refreshFn) {
      this.refreshFn()
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown (event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredNodes.length - 1)
      this.scrollToSelected()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0)
      this.scrollToSelected()
    } else if (event.key === 'Escape') {
      this.close()
    }
  }

  onFilterInput (): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    this.debounceTimer = setTimeout(() => this.onFilterChange(), 150)
  }

  onFilterChange (): void {
    this.selectedIndex = 0
    const query = this.filter.toLowerCase().trim()
    const tokens = query.split(/\s+/).filter(Boolean)

    if (tokens.length === 0) {
      this.filteredNodes = this.nodeViews.slice()
      return
    }

    const matched: { nv: NodeView; score: number }[] = []
    for (const nv of this.nodeViews) {
      if (!tokens.every(token => nv.searchString.includes(token))) { continue }

      const hostname = nv.node.spec.hostname.toLowerCase()
      const labels = nv.node.metadata.labels ?? {}
      const labelValues = Object.values(labels).map(v => v.toLowerCase())
      const hostnameMatchCount = tokens.filter(token => hostname.includes(token)).length
      const allInHostname = hostnameMatchCount === tokens.length
      const exactStart = hostname.startsWith(tokens[0])
      const exactLabelMatch = tokens.filter(token => labelValues.some(v => v === token)).length

      const score = (allInHostname ? 1000 : 0)
        + exactLabelMatch * 200
        + (exactStart ? 500 : 0)
        + hostnameMatchCount * 10

      matched.push({ nv, score })
    }

    matched.sort((a, b) => b.score - a.score || a.nv.node.spec.hostname.localeCompare(b.nv.node.spec.hostname))
    this.filteredNodes = matched.map(m => m.nv)
  }

  buildNodeViews (): void {
    this.nodeViews = this.nodes.map(node => {
      const labels = node.metadata.labels ?? {}
      const labelEntries = Object.entries(labels)
        .filter(([k]) => !k.startsWith('teleport.'))
        .map(([k, v]) => `${k}=${v}`)

      const searchParts = [
        node.spec.hostname,
        node.metadata.name,
        node.spec.addr,
        node.cluster ?? '',
        ...Object.entries(labels).map(([k, v]) => `${k}=${v}`),
      ]

      return {
        node,
        searchString: searchParts.join(' ').toLowerCase(),
        labels: labelEntries,
      }
    })
  }

  private scrollToSelected (): void {
    setTimeout(() => {
      if (!this.nodeList) { return }
      const items = this.nodeList.nativeElement.querySelectorAll('.list-group-item')
      if (items[this.selectedIndex]) {
        items[this.selectedIndex].scrollIntoView({ block: 'nearest' })
      }
    })
  }
}
