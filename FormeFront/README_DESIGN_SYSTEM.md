# 🎨 ForMe Admin Design System

> A comprehensive, accessible, and modern design system for the ForMe admin platform.

## 🚀 Quick Start

```typescript
// 1. Use Toast Notifications
import { ToastService } from './core/services/toast.service';
private toastService = inject(ToastService);

this.toastService.success('Saved successfully!');
this.toastService.error('Failed to save');
```

```html
<!-- 2. Use Skeleton Loaders -->
<app-skeleton-loader *ngIf="loading" [count]="6"></app-skeleton-loader>

<!-- 3. Use Design System Buttons -->
<button class="btn-base btn-success">
  <i class="bi bi-check-circle"></i>
  Save
</button>
```

## 📦 What's Included

### ✅ Core Components
- **Toast Notifications** - Success, error, warning, info messages
- **Skeleton Loaders** - Smooth loading states
- **Keyboard Shortcuts** - ESC, Ctrl+K, / shortcuts
- **Design System CSS** - Complete styling framework

### ✅ Design Tokens
- **Colors** - Primary, Success, Info, Warning, Danger
- **Typography** - 11px to 32px scale
- **Spacing** - 8px to 48px scale
- **Shadows** - 6 levels of elevation
- **Animations** - Smooth transitions

### ✅ Components
- **Buttons** - 7 variants, 3 sizes
- **Badges** - 5 color variants
- **Cards** - Interactive and static
- **Forms** - Inputs, selects, validation
- **Loading** - Spinners and skeletons

## 🎯 Features

### Toast Notifications
```typescript
this.toastService.success('Operation successful!');
this.toastService.error('Something went wrong');
this.toastService.warning('Please review your input');
this.toastService.info('New feature available');
```

### Keyboard Shortcuts
- **ESC** - Close any modal
- **Ctrl/Cmd + K** - Focus search
- **/** - Focus search input

### Skeleton Loaders
```html
<app-skeleton-loader 
  *ngIf="loading" 
  [count]="6">
</app-skeleton-loader>
```

## 🎨 Design System

### Colors
```css
Primary:  #6366f1  /* Purple - Primary actions */
Success:  #10b981  /* Green - Success, Certifications */
Info:     #3b82f6  /* Blue - Info, Sessions */
Warning:  #f59e0b  /* Orange - Warning, Reschedule */
Danger:   #ef4444  /* Red - Danger, Delete */
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
```

### Badges
```html
<span class="badge-base badge-success">Active</span>
<span class="badge-base badge-warning">Pending</span>
<span class="badge-base badge-danger">Failed</span>
<span class="badge-base badge-info">In Progress</span>
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
```

## 📁 File Structure

```
src/
├── styles/
│   └── admin-design-system.css          # Main design system
├── app/
│   ├── core/
│   │   └── services/
│   │       ├── toast.service.ts         # Toast notifications
│   │       └── keyboard-shortcuts.service.ts  # Keyboard shortcuts
│   └── shared/
│       └── components/
│           ├── toast/
│           │   └── toast.component.ts   # Toast UI
│           └── skeleton-loader/
│               └── skeleton-loader.component.ts  # Loading states
```

## 📚 Documentation

- **QUICK_START_GUIDE.md** - Get started in 5 minutes
- **IMPLEMENTATION_COMPLETE.md** - Complete implementation guide
- **IMPLEMENTATION_STATUS.md** - Current progress tracker
- **DESIGN_IMPROVEMENTS_IMPLEMENTATION.md** - Detailed specifications

## ✅ Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🎯 Accessibility

- ✅ WCAG AA compliant
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus indicators
- ✅ ARIA labels
- ✅ Color contrast

## 📱 Responsive

- ✅ Mobile first approach
- ✅ Breakpoints: 640px, 768px, 1024px
- ✅ Touch-friendly (44x44px minimum)
- ✅ Flexible layouts

## 🚀 Performance

- ✅ Optimized animations (transform/opacity)
- ✅ Lazy loading ready
- ✅ Small bundle size
- ✅ CSS variables for theming
- ✅ No runtime overhead

## 🔧 Customization

### Change Colors
```css
:root {
  --color-primary: #your-color;
  --color-success: #your-color;
  /* ... */
}
```

### Change Spacing
```css
:root {
  --space-xs: 8px;
  --space-sm: 12px;
  /* ... */
}
```

### Change Typography
```css
:root {
  --font-size-base: 14px;
  --font-weight-normal: 400;
  /* ... */
}
```

## 📊 Stats

- **Design Tokens**: 100+
- **Components**: 20+
- **Utilities**: 50+
- **Animations**: 10+
- **File Size**: ~15KB (gzipped)

## 🎉 Benefits

- ✅ **Consistent** - Same look across all pages
- ✅ **Accessible** - WCAG AA compliant
- ✅ **Responsive** - Works on all devices
- ✅ **Performant** - Optimized animations
- ✅ **Maintainable** - Centralized tokens
- ✅ **Scalable** - Easy to extend
- ✅ **Professional** - Modern UI/UX

## 🤝 Contributing

1. Follow the design system guidelines
2. Use existing components when possible
3. Add new tokens to the design system
4. Test on all breakpoints
5. Ensure accessibility compliance

## 📝 License

MIT License - ForMe Platform

## 🙏 Credits

Built with:
- Angular 19
- Bootstrap Icons
- CSS Variables
- Modern CSS

---

**Made with ❤️ for ForMe Admin Platform**

Version: 1.0.0
Last Updated: 2026-03-02
