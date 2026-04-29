import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FormationService } from '../../../services/formation.service';
import { Formation, ContenuFormation } from '../../../models/formation.models';

@Component({
  selector: 'app-formation-content',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './formation-content.component.html',
  styleUrl: './formation-content.component.css'
})
export class FormationContentComponent implements OnInit {
  formationId!: number;
  formation: Formation | null = null;
  contentBlocks: ContenuFormation[] = [];
  loading = true;
  error: string | null = null;

  showEditModal = false;
  editingBlock: ContenuFormation | null = null;
  editForm: Partial<ContenuFormation> = {};
  saving = false;

  constructor(
    private route: ActivatedRoute,
    private formationService: FormationService
  ) {}

  ngOnInit(): void {
    this.formationId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.formationId) return;
    this.load();
  }

  load(): void {
    this.formationService.getById(this.formationId).subscribe({
      next: (f) => {
        this.formation = f;
        this.formationService.getContentByFormationId(this.formationId).subscribe({
          next: (c) => {
            this.contentBlocks = c.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
            this.loading = false;
          },
          error: (err) => {
            this.error = err.error?.message || 'Failed to load content';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load formation';
        this.loading = false;
      }
    });
  }

  openAddBlock(): void {
    this.editingBlock = null;
    this.editForm = {
      title: '',
      content_type: 'text',
      content_body: '',
      order_index: this.contentBlocks.length,
      formation_id: this.formationId
    };
    this.showEditModal = true;
  }

  openEditBlock(block: ContenuFormation): void {
    this.editingBlock = block;
    this.editForm = {
      title: block.title,
      content_type: block.content_type || 'text',
      content_body: block.content_body || '',
      order_index: block.order_index ?? 0
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingBlock = null;
    this.editForm = {};
  }

  saveBlock(): void {
    if (!this.editForm.title?.trim()) return;
    this.saving = true;
    const payload: ContenuFormation = {
      ...this.editForm,
      title: this.editForm.title!.trim(),
      content_type: this.editForm.content_type || 'text',
      content_body: this.editForm.content_body || '',
      order_index: this.editForm.order_index ?? 0,
      formation_id: this.formationId
    } as ContenuFormation;

    const obs = this.editingBlock?.id
      ? this.formationService.updateContent(this.editingBlock.id, payload)
      : this.formationService.createContent({ ...payload, formation_id: this.formationId });

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.closeEditModal();
        this.load();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to save';
        this.saving = false;
      }
    });
  }

  delete(id: number): void {
    if (!confirm('Delete this content block?')) return;
    this.formationService.deleteContent(id).subscribe({
      next: () => this.load(),
      error: (err) => (this.error = err.error?.message || 'Failed to delete')
    });
  }

  expandedId: number | null = null;

  toggleExpand(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  isExpanded(block: ContenuFormation): boolean {
    return block.id != null && this.expandedId === block.id;
  }
}
