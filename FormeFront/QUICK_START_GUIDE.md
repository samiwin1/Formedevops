# 🚀 Quick Start Guide - ForMe Admin Design System

## ✅ What's Already Done

1. ✅ **Global Design System** - `src/styles/admin-design-system.css`
2. ✅ **Toast Notifications** - Working and integrated
3. ✅ **Keyboard Shortcuts** - ESC, Ctrl+K, / shortcuts active
4. ✅ **Skeleton Loaders** - Ready to use component
5. ✅ **Dashboard** - Updated with toasts

## 🎯 How to Use Right Now

### 1. Show Toast Notifications

In ANY component:

```typescript
// Add to imports
import { ToastService } from '../../../core/services/toast.service';

// Inject in constructor or use inject()
private toastService = inject(ToastService);

// Use anywhere
this.toastService.success('Saved successfully!');
this.toastService.error('Failed to save');
this.toastService.warning('Please check your input');
this.toastService.info('New feature available');
```

### 2. Use Skeleton Loaders

```typescript
// Add to component imports
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  imports: [CommonModule, SkeletonLoaderComponent, ...],
})
```

```html
<!-- In your template -->
<app-skeleton-loader *ngIf="loading" [count]="6"></app-skeleton-loader>
<div *ngIf="!loading">
  <!-- Your actual content -->
</div>
```

### 3. Use Design System Buttons

Replace old buttons:

```html
<!-- OLD -->
<button class="btn btn-green">SAVE</button>
<button class="btn btn-red">DELETE</button>

<!-- NEW -->
<button class="btn-base btn-success">
  <i class="bi bi-check-circle"></i>
  Save
</button>
<button class="btn-base btn-danger">
  <i class="bi bi-trash"></i>
  Delete
</button>
```

### 4. Use Design System Badges

```html
<!-- OLD -->
<span class="badge b-green">Active</span>

<!-- NEW -->
<span class="badge-base badge-success">Active</span>
<span class="badge-base badge-warning">Pending</span>
<span class="badge-base badge-danger">Failed</span>
<span class="badge-base badge-info">In Progress</span>
```

### 5. Keyboard Shortcuts (Already Active!)

- **ESC** - Closes any modal
- **Ctrl/Cmd + K** - Focus search
- **/** - Focus search (when not typing)

### 6. Add Loading States

```html
<!-- Simple spinner -->
<div *ngIf="loading" class="spinner"></div>

<!-- Skeleton loader (better UX) -->
<app-skeleton-loader *ngIf="loading" [count]="6"></app-skeleton-loader>
```

## 📝 Next 30 Minutes - Update One Component

Let's update the **Certification Admin** component as an example:

### Step 1: Add Toast Service

**File:** `src/app/features/certification/admin/certification-admin.component.ts`

```typescript
// Add import at top
import { ToastService } from '../../../core/services/toast.service';

// Add to class
private readonly toastService = inject(ToastService);

// Find all instances of:
this.error = 'some message';
this.success = 'some message';

// Replace with:
this.toastService.error('some message');
this.toastService.success('some message');
```

### Step 2: Remove Alert Divs

**File:** `src/app/features/certification/admin/certification-admin.component.html`

```html
<!-- REMOVE these lines -->
<div class="alert alert-success" *ngIf="success">{{ success }}</div>
<div class="alert alert-danger" *ngIf="error">{{ error }}</div>
```

### Step 3: Add Skeleton Loader

```typescript
// Add to imports
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  imports: [..., SkeletonLoaderComponent],
})
```

```html
<!-- Replace loading text with skeleton -->
<app-skeleton-loader *ngIf="loading" [count]="6"></app-skeleton-loader>
<div *ngIf="!loading" class="list-cards-grid">
  <!-- Your cards -->
</div>
```

### Step 4: Update Button Classes

```html
<!-- Find buttons like this -->
<button class="btn btn-green">SAVE</button>

<!-- Replace with -->
<button class="btn-base btn-success">
  <i class="bi bi-check-circle"></i>
  Save
</button>
```

## 🎨 Design System Cheat Sheet

### Colors
```css
--color-primary: #6366f1    /* Purple - Primary actions */
--color-success: #10b981    /* Green - Success, Certifications */
--color-info: #3b82f6       /* Blue - Info, Sessions */
--color-warning: #f59e0b    /* Orange - Warning, Reschedule */
--color-danger: #ef4444     /* Red - Danger, Delete */
```

### Buttons
```html
<button class="btn-base btn-primary">Primary</button>
<button class="btn-base btn-success">Success</button>
<button class="btn-base btn-info">Info</button>
<button class="btn-base btn-warning">Warning</button>
<button class="btn-base btn-danger">Danger</button>
<button class="btn-base btn-outline">Outline</button>
<button class="btn-base btn-ghost">Ghost</button>

<!-- Sizes -->
<button class="btn-base btn-primary btn-sm">Small</button>
<button class="btn-base btn-primary">Normal</button>
<button class="btn-base btn-primary btn-lg">Large</button>

<!-- Icon button -->
<button class="btn-base btn-primary btn-icon">
  <i class="bi bi-plus"></i>
</button>
```

### Badges
```html
<span class="badge-base badge-success">Success</span>
<span class="badge-base badge-info">Info</span>
<span class="badge-base badge-warning">Warning</span>
<span class="badge-base badge-danger">Danger</span>
<span class="badge-base badge-gray">Gray</span>
```

### Cards
```html
<div class="card-base">Basic card</div>
<div class="card-base card-interactive">Interactive card (hover effect)</div>
```

### Forms
```html
<label class="form-label">Email</label>
<input type="email" class="form-control">
<span class="form-hint">Enter your email</span>
<span class="form-error">Email is required</span>

<select class="form-select">
  <option>Option 1</option>
</select>
```

### Loading
```html
<!-- Spinner -->
<div class="spinner"></div>
<div class="spinner spinner-sm"></div>
<div class="spinner spinner-lg"></div>

<!-- Skeleton -->
<div class="skeleton skeleton-text"></div>
<div class="skeleton skeleton-title"></div>
<div class="skeleton skeleton-avatar"></div>
```

### Spacing
```html
<div class="mt-1">Margin top 8px</div>
<div class="mt-2">Margin top 12px</div>
<div class="mt-3">Margin top 16px</div>
<div class="mt-4">Margin top 24px</div>

<div class="p-1">Padding 8px</div>
<div class="p-2">Padding 12px</div>
<div class="p-3">Padding 16px</div>
<div class="p-4">Padding 24px</div>

<div class="gap-1">Gap 8px</div>
<div class="gap-2">Gap 12px</div>
<div class="gap-3">Gap 16px</div>
<div class="gap-4">Gap 24px</div>
```

### Typography
```html
<p class="text-xs">Extra small (11px)</p>
<p class="text-sm">Small (12px)</p>
<p class="text-base">Base (14px)</p>
<p class="text-lg">Large (16px)</p>
<p class="text-xl">Extra large (18px)</p>
<p class="text-2xl">2X large (20px)</p>
<p class="text-3xl">3X large (24px)</p>

<p class="font-normal">Normal weight</p>
<p class="font-medium">Medium weight</p>
<p class="font-semibold">Semibold weight</p>
<p class="font-bold">Bold weight</p>
```

## 🔥 Pro Tips

1. **Always use toasts instead of inline alerts** - Better UX
2. **Use skeleton loaders instead of spinners** - Perceived performance
3. **Add icons to buttons** - Better visual communication
4. **Use consistent spacing** - Use design system classes
5. **Test keyboard shortcuts** - ESC should close modals
6. **Add ARIA labels** - Better accessibility
7. **Use semantic HTML** - Better SEO and accessibility

## 📱 Mobile Testing

Test on these breakpoints:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🐛 Common Issues

### Toast not showing?
- Check if `<app-toast></app-toast>` is in `app.component.html`
- Check if `ToastComponent` is imported in `app.component.ts`

### Skeleton loader not showing?
- Import `SkeletonLoaderComponent` in your component
- Add to `imports` array in `@Component` decorator

### Keyboard shortcuts not working?
- Check if `KeyboardShortcutsService` is initialized in `app.component.ts`
- Check browser console for errors

### Styles not applying?
- Check if `admin-design-system.css` is imported in `styles.css`
- Clear browser cache
- Check for CSS specificity issues

## 🎉 You're Ready!

Start by updating one component at a time. The design system is ready to use!

**Recommended order:**
1. ✅ Dashboard (Already done!)
2. Certification Admin
3. Oral Sessions
4. Reschedule Admin
5. Sessions Calendar
6. Issued Certificates

Each component should take 15-30 minutes to update.

Good luck! 🚀
